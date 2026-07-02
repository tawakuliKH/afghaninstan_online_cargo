import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { supabase } from '../lib/supabase'
import { z } from 'zod'

const router = Router()

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin)

// ── Users ──────────────────────────────────────────────────

// List all users with optional status filter
router.get('/users', async (req, res) => {
  const { status, page } = req.query
  const pageSize = 20
  const pageNum = Math.max(1, Number(page) || 1)

  const where: any = {}
  if (status) where.accountStatus = String(status).toUpperCase()

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

// ── Deliveries ─────────────────────────────────────────────

// List all deliveries
router.get('/deliveries', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = 20

  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        sender: { select: { id: true, nickname: true, email: true } },
        traveler: { select: { id: true, nickname: true, email: true } },
        package: { select: { id: true, title: true } },
      },
    }),
    prisma.delivery.count(),
  ])

  res.json({ deliveries, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
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