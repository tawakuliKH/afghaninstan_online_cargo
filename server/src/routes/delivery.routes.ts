import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireApproved } from '../middleware/auth'
import { proposeDeliverySchema, acceptDeliverySchema } from '../schemas/delivery.schema'
import { sendEmail, emailTemplates } from '../lib/email'


const router = Router()

// PROPOSE — Sender marks package as handed to traveler
router.post('/propose', requireAuth, requireApproved, async (req, res) => {
  const parseResult = proposeDeliverySchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }
  const data = parseResult.data

  // Confirm the package belongs to the sender
  const pkg = await prisma.package.findUnique({ where: { id: data.packageId } })
  if (!pkg) return res.status(404).json({ error: 'Package not found' })
  if (pkg.senderId !== req.user!.userId) {
    return res.status(403).json({ error: 'You can only propose deliveries for your own packages' })
  }

  // Confirm package doesn't already have an active delivery
  const existing = await prisma.delivery.findFirst({
    where: {
      packageId: data.packageId,
      status: { in: ['PROPOSED', 'ACCEPTED'] },
    },
  })
  if (existing) {
    return res.status(409).json({ error: 'This package already has an active delivery in progress' })
  }

  // Confirm traveler exists and is approved
  const traveler = await prisma.user.findUnique({ where: { id: data.travelerId } })
  if (!traveler || traveler.accountStatus !== 'APPROVED') {
    return res.status(404).json({ error: 'Traveler not found or not approved' })
  }

  // Confirm traveler has no unpaid commission
  const unpaidCommission = await prisma.delivery.findFirst({
    where: {
      travelerId: data.travelerId,
      status: 'FINALIZED',
      commissionPaid: false,
    },
  })
  if (unpaidCommission) {
    return res.status(403).json({ error: 'This traveler has unpaid commission and cannot accept new deliveries' })
  }

  const delivery = await prisma.delivery.create({
    data: {
      packageId: data.packageId,
      travelerId: data.travelerId,
      tripId: data.tripId,
      senderId: req.user!.userId,
      agreedAmount: data.agreedAmount,
      currency: data.currency,
      paymentLocation: data.paymentLocation,
    },
  })

  // Notify traveler — in-app notification + email
  const [senderUser, travelerUser, pkgData] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user!.userId }, select: { nickname: true } }),
    prisma.user.findUnique({ where: { id: data.travelerId }, select: { email: true, nickname: true } }),
    prisma.package.findUnique({ where: { id: data.packageId }, select: { title: true, destCity: true, destCountry: true } }),
  ])
  if (senderUser && travelerUser && pkgData) {
    await prisma.notification.create({
      data: {
        userId: data.travelerId,
        type: 'DELIVERY_PROPOSED',
        title: 'New delivery request',
        body: `${senderUser.nickname} wants you to carry ${pkgData.title} to ${pkgData.destCity}, ${pkgData.destCountry}.`,
        link: '/profile?tab=deliveries',
      },
    })

    const { subject, html } = emailTemplates.deliveryProposed(
      travelerUser.nickname,
      pkgData.title,
      senderUser.nickname
    )
    await sendEmail(travelerUser.email, subject, html)
  }
  res.status(201).json({ delivery })
})

// ACCEPT — Traveler accepts the delivery request
router.post('/:id/accept', requireAuth, requireApproved, async (req, res) => {
  const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id as string } })
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' })
  if (delivery.travelerId !== req.user!.userId) {
    return res.status(403).json({ error: 'Only the assigned traveler can accept this delivery' })
  }
  if (delivery.status !== 'PROPOSED') {
    return res.status(409).json({ error: `Delivery is already ${delivery.status.toLowerCase()}` })
  }

  const parseResult = acceptDeliverySchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }

  const updated = await prisma.delivery.update({
    where: { id: req.params.id as string },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      estimatedDeliveryDate: parseResult.data.estimatedDeliveryDate,
    },
  })

  const [travelerUser, senderUser, pkgData] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user!.userId }, select: { nickname: true } }),
    prisma.user.findUnique({ where: { id: delivery.senderId }, select: { email: true, nickname: true } }),
    prisma.package.findUnique({ where: { id: delivery.packageId }, select: { title: true } }),
  ])
  if (travelerUser && senderUser && pkgData && updated.estimatedDeliveryDate) {
    const estimatedDateStr = new Date(updated.estimatedDeliveryDate).toLocaleDateString()

    await prisma.notification.create({
      data: {
        userId: delivery.senderId,
        type: 'DELIVERY_ACCEPTED',
        title: 'Your delivery request was accepted!',
        body: `${travelerUser.nickname} accepted your delivery for ${pkgData.title}. Estimated delivery: ${estimatedDateStr}.`,
        link: '/profile?tab=packages',
      },
    })

    const { subject, html } = emailTemplates.deliveryAccepted(
      senderUser.nickname,
      pkgData.title,
      travelerUser.nickname,
      estimatedDateStr
    )
    await sendEmail(senderUser.email, subject, html)
  }
  res.json({ delivery: updated })
})

// FINALIZE — Traveler confirms package delivered to recipient
router.post('/:id/finalize', requireAuth, requireApproved, async (req, res) => {
  const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id as string } })
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' })
  if (delivery.travelerId !== req.user!.userId) {
    return res.status(403).json({ error: 'Only the assigned traveler can finalize this delivery' })
  }
  if (delivery.status !== 'ACCEPTED') {
    return res.status(409).json({ error: 'Delivery must be accepted before it can be finalized' })
  }

  const commissionAmount = parseFloat((delivery.agreedAmount * 0.05).toFixed(2))

  // Use a transaction so the delivery update + counter increment are atomic
  const [updatedDelivery] = await prisma.$transaction([
    prisma.delivery.update({
      where: { id: req.params.id as string },
      data: {
        status: 'FINALIZED',
        finalizedAt: new Date(),
        commissionAmount,
      },
    }),
    prisma.user.update({
      where: { id: delivery.travelerId },
      data: { packagesDeliveredCount: { increment: 1 } },
    }),
  ])

  const [travelerUser, senderUser, pkgData] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user!.userId }, select: { nickname: true } }),
    prisma.user.findUnique({ where: { id: delivery.senderId }, select: { email: true, nickname: true } }),
    prisma.package.findUnique({ where: { id: delivery.packageId }, select: { title: true } }),
  ])
  if (travelerUser && senderUser && pkgData) {
    const { subject, html } = emailTemplates.deliveryFinalized(
      senderUser.nickname,
      pkgData.title,
      travelerUser.nickname
    )
    await sendEmail(senderUser.email, subject, html)

    await prisma.notification.create({
      data: {
        userId: delivery.senderId,
        type: 'DELIVERY_FINALIZED',
        title: 'Your package has been delivered!',
        body: `${travelerUser.nickname} has confirmed delivery of ${pkgData.title}. Please confirm and leave a review.`,
        link: `/deliveries/${delivery.id}/review`,
      },
    })
  }
  res.json({
    delivery: updatedDelivery,
    commissionOwed: commissionAmount,
    currency: delivery.currency,
  })
})

// CANCEL — Sender or Traveler can cancel a PROPOSED delivery
router.post('/:id/cancel', requireAuth, requireApproved, async (req, res) => {
  const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id as string } })
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' })

  const isInvolved = delivery.senderId === req.user!.userId || delivery.travelerId === req.user!.userId
  if (!isInvolved && !req.user!.isAdmin) {
    return res.status(403).json({ error: 'Not authorized to cancel this delivery' })
  }
  if (delivery.status !== 'PROPOSED') {
    return res.status(409).json({ error: 'Only proposed deliveries can be cancelled' })
  }

  const updated = await prisma.delivery.update({
    where: { id: req.params.id as string },
    data: { status: 'CANCELLED' },
  })

  res.json({ delivery: updated })
})

// LIST MINE — both as sender and as traveler
router.get('/mine', requireAuth, requireApproved, async (req, res) => {
  const deliveries = await prisma.delivery.findMany({
    where: {
      OR: [
        { senderId: req.user!.userId },
        { travelerId: req.user!.userId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      package: { select: { id: true, title: true, destCountry: true, destCity: true, createdAt: true } },
      sender: { select: { id: true, nickname: true } },
      traveler: { select: { id: true, nickname: true } },
      review: true,
    },
  })

  res.json({ deliveries })
})

// GET ONE
router.get('/:id', requireAuth, requireApproved, async (req, res) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id: req.params.id as string },
    include: {
      package: true,
      sender: { select: { id: true, nickname: true, legalFullName: true } },
      traveler: { select: { id: true, nickname: true, legalFullName: true } },
      review: true,
    },
  })
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' })

  const isInvolved = delivery.senderId === req.user!.userId || delivery.travelerId === req.user!.userId
  if (!isInvolved && !req.user!.isAdmin) {
    return res.status(403).json({ error: 'Not authorized to view this delivery' })
  }

  // Hide commission details from sender — only traveler and admin see those
  const isTraveler = delivery.travelerId === req.user!.userId
  if (!isTraveler && !req.user!.isAdmin) {
    const { commissionAmount, commissionPaid, ...safeDelivery } = delivery
    return res.json({ delivery: safeDelivery })
  }

  res.json({ delivery })
})

export default router