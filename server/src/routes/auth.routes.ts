import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { upload } from '../middleware/upload'
import { registerSchema } from '../schemas/auth.schema'
import { prisma } from '../lib/prisma'
import { uploadKycFile } from '../lib/storage'

const router = Router()

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