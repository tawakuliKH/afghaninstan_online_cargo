import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { upload } from '../middleware/upload'
import { registerSchema } from '../schemas/auth.schema'
import { prisma } from '../lib/prisma'
import { uploadKycFile } from '../lib/storage'
import { loginSchema } from '../schemas/auth.schema'
import { signAccessToken, signRefreshToken } from '../lib/jwt'
import { verifyRefreshToken } from '../lib/jwt'
import { requireAuth, requireApproved } from '../middleware/auth'


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
  res.json({ user })
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

  res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isAdmin: user.isAdmin,
      accountStatus: user.accountStatus,
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

export default router