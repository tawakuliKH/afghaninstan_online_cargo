import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { supabase } from '../lib/supabase'
import { z } from 'zod'
import { sendEmail, emailTemplates } from '../lib/email'

const router = Router()

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin)

// ── Users ──────────────────────────────────────────────────

// List all users with optional status filter
router.get('/users', async (req, res) => {
  const { status, page, search } = req.query
  const pageSize = 20
  const pageNum = Math.max(1, Number(page) || 1)

  const where: any = {}
  if (status) where.accountStatus = String(status).toUpperCase()
  if (search) {
    where.OR = [
      { nickname: { contains: String(search), mode: 'insensitive' } },
      { legalFullName: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        legalFullName: true,
        nickname: true,
        documentType: true,
        documentNumber: true,
        accountStatus: true,
        isAdmin: true,
        createdAt: true,
        currentCountry: true,
        currentCity: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  res.json({ users, pagination: { page: pageNum, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
})

// Get one user — full details including KYC doc signed URLs
router.get('/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id as string },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  // Generate signed URLs for private KYC documents (5 minute expiry)
  const signedUrls: Record<string, string> = {}
  const filesToSign = [
    { key: 'passportPhotoUrl', path: user.passportPhotoUrl },
    { key: 'facePhotoUrl', path: user.facePhotoUrl },
    ...(user.visaResidencyDocUrl ? [{ key: 'visaResidencyDocUrl', path: user.visaResidencyDocUrl }] : []),
  ]

  for (const file of filesToSign) {
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(file.path, 300) // 300 seconds = 5 minutes
    if (!error && data) signedUrls[file.key] = data.signedUrl
  }

  res.json({ user: { ...user, ...signedUrls } })
})

// Approve a user
router.patch('/users/:id/approve', async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id as string },
    data: { accountStatus: 'APPROVED', adminNote: null },
    select: { id: true, email: true, accountStatus: true },
  })

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'ACCOUNT_APPROVED',
      title: 'Account approved',
      body: 'Your account has been approved. You can now post trips and packages.',
      link: '/profile',
    },
  })
  // After prisma.notification.create in approve route:
  const approvedUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, nickname: true }
  })
  if (approvedUser) {
    const { subject, html } = emailTemplates.accountApproved(approvedUser.nickname)
    await sendEmail(approvedUser.email, subject, html)
  }

  res.json({ user })
})


// Reject a user (with reason)
const rejectSchema = z.object({ reason: z.string().min(5) })
router.patch('/users/:id/reject', async (req, res) => {
  const parseResult = rejectSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }

  const user = await prisma.user.update({
    where: { id: req.params.id as string },
    data: { accountStatus: 'REJECTED', adminNote: parseResult.data.reason },
    select: { id: true, email: true, accountStatus: true, adminNote: true },
  })

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'ACCOUNT_REJECTED',
      title: 'Account rejected',
      body: `Your account was rejected. Reason: ${parseResult.data.reason}`,
      link: '/register',
    },
  })
  // After prisma.notification.create in reject route:
const rejectedUser = await prisma.user.findUnique({
  where: { id: user.id },
  select: { email: true, nickname: true }
})
if (rejectedUser) {
  const { subject, html } = emailTemplates.accountRejected(
    rejectedUser.nickname,
    parseResult.data.reason
  )
  await sendEmail(rejectedUser.email, subject, html)
}

  res.json({ user })
})

// Suspend a user
router.patch('/users/:id/suspend', async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id as string },
    data: { accountStatus: 'SUSPENDED' },
    select: { id: true, email: true, accountStatus: true },
  })
  res.json({ user })
})

// Delete a user — soft delete (SUSPENDED) to safely preserve trips/packages/deliveries/messages history
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user!.userId) {
    return res.status(400).json({ error: 'You cannot delete your own account' })
  }
  const user = await prisma.user.update({
    where: { id: req.params.id as string },
    data: { accountStatus: 'SUSPENDED' },
    select: { id: true, email: true, accountStatus: true },
  })
  res.json({ message: 'User suspended (soft-deleted)', user })
})

// ── Packages ───────────────────────────────────────────────

router.get('/packages', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = 20
  const { search } = req.query

  const where: any = {}
  if (search) {
    where.title = { contains: String(search), mode: 'insensitive' }
  }

  const [packages, total] = await Promise.all([
    prisma.package.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { sender: { select: { id: true, nickname: true, email: true } } },
    }),
    prisma.package.count({ where }),
  ])

  res.json({ packages, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
})

router.delete('/packages/:id', async (req, res) => {
  const pkg = await prisma.package.findUnique({ where: { id: req.params.id as string } })
  if (!pkg) return res.status(404).json({ error: 'Package not found' })

  await prisma.package.delete({ where: { id: req.params.id as string } })
  res.json({ message: 'Package deleted' })
})

// ── Trips ──────────────────────────────────────────────────

router.get('/trips', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = 20
  const { search } = req.query

  const where: any = {}
  if (search) {
    where.OR = [
      { originCity: { contains: String(search), mode: 'insensitive' } },
      { destCity: { contains: String(search), mode: 'insensitive' } },
    ]
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { traveler: { select: { id: true, nickname: true, email: true } } },
    }),
    prisma.trip.count({ where }),
  ])

  res.json({ trips, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
})

router.delete('/trips/:id', async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id as string } })
  if (!trip) return res.status(404).json({ error: 'Trip not found' })

  await prisma.trip.delete({ where: { id: req.params.id as string } })
  res.json({ message: 'Trip deleted' })
})

// ── Messages / Chats ───────────────────────────────────────

// Conversations grouped by user pair, across the whole platform
router.get('/messages', async (_req, res) => {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, nickname: true } },
      receiver: { select: { id: true, nickname: true } },
    },
  })

  const conversations = new Map<
    string,
    { userA: { id: string; nickname: string }; userB: { id: string; nickname: string }; lastMessage: any; count: number }
  >()

  for (const msg of messages) {
    const key = [msg.senderId, msg.receiverId].sort().join('_')
    const existing = conversations.get(key)
    if (existing) {
      existing.count += 1
    } else {
      conversations.set(key, {
        userA: msg.sender,
        userB: msg.receiver,
        lastMessage: { id: msg.id, content: msg.content, createdAt: msg.createdAt },
        count: 1,
      })
    }
  }

  res.json({ conversations: Array.from(conversations.values()) })
})

// Full thread between two specific users
router.get('/messages/thread/:userAId/:userBId', async (req, res) => {
  const { userAId, userBId } = req.params
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userAId as string, receiverId: userBId as string },
        { senderId: userBId as string, receiverId: userAId as string },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, nickname: true } },
      receiver: { select: { id: true, nickname: true } },
    },
  })
  res.json({ messages })
})

router.delete('/messages/:id', async (req, res) => {
  const message = await prisma.message.findUnique({ where: { id: req.params.id as string } })
  if (!message) return res.status(404).json({ error: 'Message not found' })

  await prisma.message.delete({ where: { id: req.params.id as string } })
  res.json({ message: 'Message deleted' })
})

// ── Deliveries ─────────────────────────────────────────────

// List all deliveries (optionally filtered by status — used by the Delivered Packages tab with status=FINALIZED)
router.get('/deliveries', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = 20
  const { status } = req.query

  const where: any = {}
  if (status) where.status = String(status).toUpperCase()

  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        sender: { select: { id: true, nickname: true, email: true } },
        traveler: { select: { id: true, nickname: true, email: true } },
        package: { select: { id: true, title: true } },
      },
    }),
    prisma.delivery.count({ where }),
  ])

  res.json({ deliveries, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
})

// Get one delivery — full detail
router.get('/deliveries/:id', async (req, res) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id: req.params.id as string },
    include: {
      sender: { select: { id: true, nickname: true, email: true, legalFullName: true } },
      traveler: { select: { id: true, nickname: true, email: true, legalFullName: true } },
      package: true,
      trip: true,
    },
  })
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' })

  const agreementAcceptances = await prisma.agreementAcceptance.findMany({
    where: { deliveryId: delivery.id },
  })

  res.json({ delivery, agreementAcceptances })
})

// Delete a delivery
router.delete('/deliveries/:id', async (req, res) => {
  const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id as string } })
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' })

  await prisma.delivery.delete({ where: { id: req.params.id as string } })
  res.json({ message: 'Delivery deleted' })
})

// Mark commission as paid
router.patch('/deliveries/:id/commission-paid', async (req, res) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id: req.params.id as string },
  })
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' })
  if (delivery.status !== 'FINALIZED') {
    return res.status(409).json({ error: 'Only finalized deliveries have commission' })
  }
  if (delivery.commissionPaid) {
    return res.status(409).json({ error: 'Commission already marked as paid' })
  }

  const updated = await prisma.delivery.update({
    where: { id: req.params.id as string },
    data: { commissionPaid: true },
  })

  res.json({ delivery: updated })
})

// ── Dashboard stats ────────────────────────────────────────

router.get('/stats', async (_req, res) => {
  const [
    totalUsers,
    pendingUsers,
    totalTrips,
    totalPackages,
    totalDeliveries,
    finalizedDeliveries,
    unpaidCommissions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { accountStatus: 'PENDING' } }),
    prisma.trip.count(),
    prisma.package.count(),
    prisma.delivery.count(),
    prisma.delivery.count({ where: { status: 'FINALIZED' } }),
    prisma.delivery.count({ where: { status: 'FINALIZED', commissionPaid: false } }),
  ])

  res.json({
    totalUsers,
    pendingUsers,
    totalTrips,
    totalPackages,
    totalDeliveries,
    finalizedDeliveries,
    unpaidCommissions,
  })
})

export default router