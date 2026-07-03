import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireApproved } from '../middleware/auth'
import { z } from 'zod'

const router = Router()

const recordOpenedSchema = z.object({
  type: z.enum(['ACCOUNT_CREATION_SENDER', 'ACCOUNT_CREATION_TRAVELER', 'DELIVER_PACKAGE', 'ACCEPT_DELIVERY']),
  deliveryId: z.string().uuid().optional(),
  version: z.string().default('1.0'),
})

const recordAcceptedSchema = recordOpenedSchema

// Record that user opened the agreement
router.post('/opened', requireAuth, async (req, res) => {
  const parseResult = recordOpenedSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }

  const record = await prisma.agreementAcceptance.create({
    data: {
      userId: req.user!.userId,
      type: parseResult.data.type,
      deliveryId: parseResult.data.deliveryId,
      version: parseResult.data.version,
      openedAt: new Date(),
    },
  })

  res.status(201).json({ record })
})

// Record that user accepted the agreement
router.post('/accepted', requireAuth, async (req, res) => {
  const parseResult = recordAcceptedSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }

  // Find the most recent opened record for this user+type+delivery
  const existing = await prisma.agreementAcceptance.findFirst({
    where: {
      userId: req.user!.userId,
      type: parseResult.data.type,
      deliveryId: parseResult.data.deliveryId ?? null,
      acceptedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!existing) {
    return res.status(400).json({ error: 'You must open the agreement before accepting it' })
  }

  const updated = await prisma.agreementAcceptance.update({
    where: { id: existing.id },
    data: { acceptedAt: new Date() },
  })

  res.json({ record: updated })
})

export default router