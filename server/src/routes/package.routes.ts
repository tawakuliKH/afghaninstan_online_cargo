import { Router } from 'express'
import crypto from 'node:crypto'
import { prisma } from '../lib/prisma'
import { upload } from '../middleware/upload'
import { createPackageSchema, updatePackageSchema } from '../schemas/package.schema'
import { uploadPackagePhoto } from '../lib/storage'
import { requireAuth, requireApproved, optionalAuth } from '../middleware/auth'
import { getViewerContext, shapeUserForViewer } from '../lib/visibility'

const router = Router()

// CREATE
router.post('/', requireAuth, requireApproved, upload.single('goodsPhoto'), async (req, res) => {
  const parseResult = createPackageSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }

  let goodsPhotoUrl: string | undefined
  if (req.file) {
    const ext = req.file.originalname.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    goodsPhotoUrl = await uploadPackagePhoto(path, req.file.buffer, req.file.mimetype)
  }

  const pkg = await prisma.package.create({
    data: {
      ...parseResult.data,
      senderId: req.user!.userId,
      goodsPhotoUrl,
    },
  })

  res.status(201).json({ package: pkg })
})

// LIST with filters + pagination
router.get('/', optionalAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = 10
  const skip = (page - 1) * pageSize

  const { originCountry, destCountry, startDate, endDate } = req.query

  const where: any = {}
  if (originCountry) where.originCountry = { equals: String(originCountry), mode: 'insensitive' }
  if (destCountry) where.destCountry = { equals: String(destCountry), mode: 'insensitive' }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(String(startDate))
    if (endDate) where.createdAt.lte = new Date(String(endDate))
  }

  const viewer = await getViewerContext(req.user?.userId, req.user?.isAdmin)

  const [rawPackages, total] = await Promise.all([
    prisma.package.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true, nickname: true, legalFullName: true, whatsappNumber: true, email: true,
            rating: true, packagesDeliveredCount: true,
          },
        },
        deliveries: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true } },
      },
      skip,
      take: pageSize,
    }),
    prisma.package.count({ where }),
  ])

  const packages = rawPackages.map(({ deliveries, sender, recipientName, recipientWhatsapp, recipientEmail, ...pkg }) => {
    const { rating, packagesDeliveredCount, ...senderContact } = sender
    return {
      ...pkg,
      ...(viewer.hasFullAccess ? { recipientName, recipientWhatsapp, recipientEmail } : {}),
      deliveryStatus: deliveries[0]?.status ?? null,
      sender: { ...shapeUserForViewer(senderContact, viewer), rating, packagesDeliveredCount },
    }
  })

  res.json({
    packages,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
})

// UPDATE
router.patch('/:id', requireAuth, requireApproved, async (req, res) => {
  const pkg = await prisma.package.findUnique({ where: { id: req.params.id as string } })
  if (!pkg) return res.status(404).json({ error: 'Package not found' })

  const isOwner = pkg.senderId === req.user!.userId
  if (!isOwner && !req.user!.isAdmin) {
    return res.status(403).json({ error: 'You can only edit your own packages' })
  }

  const parseResult = updatePackageSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }

  const updated = await prisma.package.update({
    where: { id: req.params.id as string },
    data: parseResult.data,
  })

  res.json({ package: updated })
})

// DELETE
router.delete('/:id', requireAuth, requireApproved, async (req, res) => {
  const pkg = await prisma.package.findUnique({ where: { id: req.params.id as string } })
  if (!pkg) return res.status(404).json({ error: 'Package not found' })

  const isOwner = pkg.senderId === req.user!.userId
  if (!isOwner && !req.user!.isAdmin) {
    return res.status(403).json({ error: 'You can only delete your own packages' })
  }

  const finalizedDelivery = await prisma.delivery.findFirst({
    where: { packageId: pkg.id, status: 'FINALIZED' },
  })
  if (finalizedDelivery) {
    return res.status(403).json({ error: 'Finalized packages cannot be deleted. Contact admin.' })
  }

  await prisma.package.delete({ where: { id: req.params.id as string } })
  res.json({ message: 'Package deleted' })
})

// GET ONE
router.get('/:id', optionalAuth, async (req, res) => {
  const pkg = await prisma.package.findUnique({
    where: { id: req.params.id as string },
    include: {
      sender: true,
      deliveries: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          status: true,
          estimatedDeliveryDate: true,
          finalizedAt: true,
          traveler: { select: { id: true, nickname: true } },
        },
      },
    },
  })
  if (!pkg) return res.status(404).json({ error: 'Package not found' })

  const viewer = await getViewerContext(req.user?.userId, req.user?.isAdmin)
  const viewerCanSeeContact = viewer.hasFullAccess
  const { sender, deliveries, recipientName, recipientWhatsapp, recipientEmail, ...packageData } = pkg

  res.json({
    package: {
      ...packageData,
      ...(viewerCanSeeContact ? { recipientName, recipientWhatsapp, recipientEmail } : {}),
      sender: shapeUserForViewer(sender, viewer),
      activeDelivery: deliveries[0] ?? null,
    },
    viewerCanSeeContact,
  })
})

export default router