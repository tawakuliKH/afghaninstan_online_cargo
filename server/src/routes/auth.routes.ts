import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { upload } from '../middleware/upload'
import { registerSchema } from '../schemas/auth.schema'
import { prisma } from '../lib/prisma'
import { uploadKycFile } from '../lib/storage'
import { supabase } from '../lib/supabase'
import { loginSchema } from '../schemas/auth.schema'
import { signAccessToken, signRefreshToken } from '../lib/jwt'
import { verifyRefreshToken } from '../lib/jwt'
import { requireAuth, requireApproved } from '../middleware/auth'
import { optionalAuth } from '../middleware/auth'
import { getViewerContext, shapeUserForViewer } from '../lib/visibility'


const router = Router()

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      nickname: true,
      accountStatus: true,
      isAdmin: true,
      legalFullName: true,
      whatsappNumber: true,
      permanentCountry: true,
      permanentCity: true,
      currentCountry: true,
      currentCity: true,
    },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const [tripsCount, packagesCount, unpaidCommissionCount] = await Promise.all([
    prisma.trip.count({ where: { travelerId: user.id } }),
    prisma.package.count({ where: { senderId: user.id } }),
    prisma.delivery.count({ where: { travelerId: user.id, status: 'FINALIZED', commissionPaid: false } }),
  ])

  res.json({
    user: {
      ...user,
      hasPosted: tripsCount + packagesCount > 0,
      hasUnpaidCommission: unpaidCommissionCount > 0,
    },
  })
})

// Update own profile — editable fields + optional KYC document re-uploads
router.patch(
  '/me',
  requireAuth,
  upload.fields([
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'facePhoto', maxCount: 1 },
    { name: 'visaResidencyDoc', maxCount: 1 },
  ]),
  async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const body = req.body as Record<string, string | undefined>
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined

    const data: Record<string, unknown> = {}
    const editableFields = [
      'nickname',
      'whatsappNumber',
      'permanentCountry',
      'permanentCity',
      'currentCountry',
      'currentCity',
    ] as const
    for (const field of editableFields) {
      if (body[field]) data[field] = body[field]
    }

    const passportFile = files?.passportPhoto?.[0]
    if (passportFile) {
      const ext = passportFile.originalname.split('.').pop()
      const path = await uploadKycFile(`${user.id}/passport.${ext}`, passportFile.buffer, passportFile.mimetype, true)
      data.passportPhotoUrl = path
    }

    const faceFile = files?.facePhoto?.[0]
    if (faceFile) {
      const ext = faceFile.originalname.split('.').pop()
      const path = await uploadKycFile(`${user.id}/face.${ext}`, faceFile.buffer, faceFile.mimetype, true)
      data.facePhotoUrl = path
    }

    const visaFile = files?.visaResidencyDoc?.[0]
    if (visaFile) {
      const ext = visaFile.originalname.split('.').pop()
      const path = await uploadKycFile(`${user.id}/visa.${ext}`, visaFile.buffer, visaFile.mimetype, true)
      data.visaResidencyDocUrl = path
    }

    // ANY profile edit sends the account back to PENDING for admin re-approval
    const hasChanges = Object.keys(data).length > 0
    if (hasChanges) {
      data.accountStatus = 'PENDING'
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        email: true,
        nickname: true,
        accountStatus: true,
        isAdmin: true,
        legalFullName: true,
        whatsappNumber: true,
        permanentCountry: true,
        permanentCity: true,
        currentCountry: true,
        currentCity: true,
      },
    })

    if (hasChanges) {
      const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } })
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'PROFILE_UPDATED' as const,
            title: 'Profile update pending review',
            body: `${user.nickname} updated their profile and requires re-approval.`,
            link: '/admin?tab=pending',
          })),
        })
      }
    }

    res.json({ user: updated })
  }
)

// Request own account deletion — does not deactivate immediately; admin must action it
router.delete('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  await prisma.user.update({
    where: { id: user.id },
    data: {
      accountStatus: 'PENDING',
      adminNote: `DELETION_REQUESTED: User requested account deletion on ${new Date().toISOString()}.`,
    },
  })

  const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } })
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: 'PROFILE_UPDATED' as const,
        title: 'Account deletion request',
        body: `${user.nickname} has requested account deletion. Please review and action.`,
        link: '/admin?tab=pending',
      })),
    })
  }

  res.json({ message: 'Your deletion request has been submitted. Admin will process it shortly.' })
})

// Signed URL for the logged-in user's own face photo (private KYC bucket)
router.get('/me/avatar', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { facePhotoUrl: true },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(user.facePhotoUrl, 300)

  if (error || !data) return res.json({ signedUrl: null })

  res.json({ signedUrl: data.signedUrl })
})

// Wallet — earnings and commission owed/paid for deliveries where this user was the traveler
router.get('/me/wallet', requireAuth, async (req, res) => {
  const deliveries = await prisma.delivery.findMany({
    where: { travelerId: req.user!.userId, status: 'FINALIZED' },
    orderBy: { finalizedAt: 'desc' },
    include: { package: { select: { title: true } } },
  })

  let totalEarned = 0
  let totalCommissionOwed = 0
  let totalCommissionPaid = 0
  const transactions: any[] = []

  for (const d of deliveries) {
    totalEarned += d.agreedAmount
    const commission = d.commissionAmount ?? 0
    if (d.commissionPaid) {
      totalCommissionPaid += commission
    } else {
      totalCommissionOwed += commission
    }

    transactions.push({
      id: d.id,
      packageTitle: d.package?.title ?? 'Unknown package',
      agreedAmount: d.agreedAmount,
      currency: d.currency,
      commissionAmount: commission,
      commissionPaid: d.commissionPaid,
      finalizedAt: d.finalizedAt,
      type: 'earning',
    })

    if (!d.commissionPaid && commission > 0) {
      transactions.push({
        id: `${d.id}-commission`,
        packageTitle: d.package?.title ?? 'Unknown package',
        agreedAmount: -commission,
        currency: d.currency,
        commissionAmount: commission,
        commissionPaid: false,
        finalizedAt: d.finalizedAt,
        type: 'commission_owed',
      })
    }
  }

  res.json({
    totalEarned,
    totalCommissionOwed,
    totalCommissionPaid,
    balance: totalEarned - totalCommissionOwed,
    transactions,
  })
})

// Public user search — no auth required
router.get('/users/search', optionalAuth, async (req, res) => {
  const q = String(req.query.q || '').trim()
  if (q.length < 2) {
    return res.json({ users: [] })
  }

  const viewer = await getViewerContext(req.user?.userId, req.user?.isAdmin)

  const users = await prisma.user.findMany({
    where: {
      accountStatus: 'APPROVED',
      OR: [
        { nickname: { contains: q, mode: 'insensitive' } },
        { legalFullName: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      nickname: true,
      legalFullName: true,
      whatsappNumber: true,
      email: true,
      rating: true,
      packagesDeliveredCount: true,
      currentCity: true,
      currentCountry: true,
      createdAt: true,
    },
    take: 20,
    orderBy: { nickname: 'asc' },
  })

  const shaped = users.map(({ rating, packagesDeliveredCount, currentCity, currentCountry, createdAt, ...contact }) => ({
    ...shapeUserForViewer(contact, viewer),
    rating,
    packagesDeliveredCount,
    currentCity,
    currentCountry,
    createdAt,
  }))

  res.json({ users: shaped })
})

router.get('/users/:id/profile', optionalAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id as string },
    select: {
      id: true,
      nickname: true,
      legalFullName: true,
      whatsappNumber: true,
      email: true,
      currentCountry: true,
      currentCity: true,
      rating: true,
      reviewCount: true,
      packagesDeliveredCount: true,
      accountStatus: true,
      createdAt: true,
    },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const viewer = await getViewerContext(req.user?.userId, req.user?.isAdmin)
  const { legalFullName, whatsappNumber, email, ...publicStats } = user
  const shapedContact = shapeUserForViewer(user, viewer)

  const reviews = await prisma.review.findMany({
    where: { revieweeId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { reviewer: { select: { id: true, nickname: true } } },
  })

  res.json({
    user: { ...publicStats, ...shapedContact },
    reviews,
    viewerCanSeeContact: viewer.hasFullAccess,
  })
})

router.post('/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' })
  }

  try {
    const payload = verifyRefreshToken(refreshToken)
    const newAccessToken = signAccessToken({ userId: payload.userId, isAdmin: payload.isAdmin })
    res.json({ accessToken: newAccessToken })
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out successfully' })
})

router.post('/login', async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }
  const { email, password } = parseResult.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const payload = { userId: user.id, isAdmin: user.isAdmin }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, in milliseconds
  })

  const [tripsCount, packagesCount, unpaidCommissionCount] = await Promise.all([
    prisma.trip.count({ where: { travelerId: user.id } }),
    prisma.package.count({ where: { senderId: user.id } }),
    prisma.delivery.count({ where: { travelerId: user.id, status: 'FINALIZED', commissionPaid: false } }),
  ])

  res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isAdmin: user.isAdmin,
      accountStatus: user.accountStatus,
      hasPosted: tripsCount + packagesCount > 0,
      hasUnpaidCommission: unpaidCommissionCount > 0,
    },
  })
})

router.post(
  '/register',
  upload.fields([
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'facePhoto', maxCount: 1 },
    { name: 'visaResidencyDoc', maxCount: 1 },
  ]),
  async (req, res) => {
    const parseResult = registerSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
    }
    const data = parseResult.data

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const passportFile = files.passportPhoto?.[0]
    const faceFile = files.facePhoto?.[0]
    const visaFile = files.visaResidencyDoc?.[0]

    if (!passportFile || !faceFile) {
      return res.status(400).json({ error: 'Passport/Tazkira photo and face photo are required' })
    }
    if (data.currentCountry !== 'Afghanistan' && !visaFile) {
      return res.status(400).json({ error: 'A visa or residency document is required for residents outside Afghanistan' })
    }

    // Friendly uniqueness checks BEFORE we touch storage or the DB insert
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } })
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }
    const existingDoc = await prisma.user.findUnique({ where: { documentNumber: data.documentNumber } })
    if (existingDoc) {
      return res.status(409).json({ error: 'An account with this document number already exists' })
    }

    // Generate the ID ourselves (rather than letting Prisma auto-generate it)
    // so we can use it as the folder name for this user's files BEFORE the row exists
    const userId = crypto.randomUUID()

    try {
      const passportExt = passportFile.originalname.split('.').pop()
      const faceExt = faceFile.originalname.split('.').pop()

      const passportPath = await uploadKycFile(`${userId}/passport.${passportExt}`, passportFile.buffer, passportFile.mimetype)
      const facePath = await uploadKycFile(`${userId}/face.${faceExt}`, faceFile.buffer, faceFile.mimetype)

      let visaPath: string | undefined
      if (visaFile) {
        const visaExt = visaFile.originalname.split('.').pop()
        visaPath = await uploadKycFile(`${userId}/visa.${visaExt}`, visaFile.buffer, visaFile.mimetype)
      }

      const passwordHash = await bcrypt.hash(data.password, 10)

      const user = await prisma.user.create({
        data: {
          id: userId,
          email: data.email,
          passwordHash,
          legalFullName: data.legalFullName,
          nickname: data.nickname,
          dateOfBirth: data.dateOfBirth,
          whatsappNumber: data.whatsappNumber,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          documentIssuingCountry: data.documentIssuingCountry,
          permanentCountry: data.permanentCountry,
          permanentCity: data.permanentCity,
          currentCountry: data.currentCountry,
          currentCity: data.currentCity,
          passportPhotoUrl: passportPath,
          facePhotoUrl: facePath,
          visaResidencyDocUrl: visaPath,
        },
      })

      res.status(201).json({
        message: 'Registration received. Your account is pending admin approval.',
        userId: user.id,
        accountStatus: user.accountStatus,
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Registration failed. Please try again.' })
    }
  }
)

// Travelers eligible to be proposed a delivery — approved users who have posted at least one trip
router.get('/users', requireAuth, requireApproved, async (req, res) => {
  const users = await prisma.user.findMany({
    where: {
      accountStatus: 'APPROVED',
      trips: { some: {} },
      id: { not: req.user!.userId },
    },
    select: {
      id: true,
      nickname: true,
      legalFullName: true,
      rating: true,
      packagesDeliveredCount: true,
      _count: { select: { trips: true } },
      trips: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { destCountry: true, destCity: true, departureDate: true },
      },
    },
    orderBy: { nickname: 'asc' },
  })

  const shaped = users.map(({ _count, trips, ...u }) => ({
    ...u,
    tripCount: _count.trips,
    mostRecentTrip: trips[0] ?? null,
  }))

  res.json({ users: shaped })
})

export default router