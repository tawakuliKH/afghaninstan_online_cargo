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
    },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const [tripsCount, packagesCount] = await Promise.all([
    prisma.trip.count({ where: { travelerId: user.id } }),
    prisma.package.count({ where: { senderId: user.id } }),
  ])

  res.json({ user: { ...user, hasPosted: tripsCount + packagesCount > 0 } })
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

  const viewer = await getViewerContext(req.user?.userId)
  const shaped = shapeUserForViewer(user, viewer)

  const reviews = await prisma.review.findMany({
    where: { revieweeId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { reviewer: { select: { id: true, nickname: true } } },
  })

  res.json({
    user: shaped,
    reviews,
    viewerCanSeeContact: viewer.isAuthenticated && (viewer.hasPosted === true || viewer.userId === user.id)
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

  const [tripsCount, packagesCount] = await Promise.all([
    prisma.trip.count({ where: { travelerId: user.id } }),
    prisma.package.count({ where: { senderId: user.id } }),
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

router.get('/users', requireAuth, requireApproved, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { accountStatus: 'APPROVED' },
    select: {
      id: true,
      nickname: true,
      legalFullName: true,
      rating: true,
      packagesDeliveredCount: true,
    },
    orderBy: { nickname: 'asc' },
  })
  res.json({ users })
})

export default router