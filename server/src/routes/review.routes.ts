import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireApproved } from '../middleware/auth'
import { createReviewSchema } from '../schemas/review.schema'

const router = Router()

// CREATE — sender reviews traveler after a FINALIZED delivery
router.post('/:deliveryId', requireAuth, requireApproved, async (req, res) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id: req.params.deliveryId as string },
  })
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' })

  // Only the sender of this delivery can leave a review
  if (delivery.senderId !== req.user!.userId) {
    return res.status(403).json({ error: 'Only the sender can review this delivery' })
  }

  // Delivery must be finalized
  if (delivery.status !== 'FINALIZED') {
    return res.status(409).json({ error: 'You can only review a finalized delivery' })
  }

  // One review per delivery (enforced by DB unique constraint too, but check early)
  const existing = await prisma.review.findUnique({ where: { deliveryId: delivery.id } })
  if (existing) {
    return res.status(409).json({ error: 'You have already reviewed this delivery' })
  }

  const parseResult = createReviewSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }

  // Create review + update traveler's avg rating atomically
  const allReviews = await prisma.review.findMany({
    where: { revieweeId: delivery.travelerId },
    select: { rating: true },
  })

  const newRating = parseResult.data.rating
  const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0) + newRating
  const newAvg = parseFloat((totalRatings / (allReviews.length + 1)).toFixed(2))

  const [review] = await prisma.$transaction([
    prisma.review.create({
      data: {
        deliveryId: delivery.id,
        reviewerId: req.user!.userId,
        revieweeId: delivery.travelerId,
        rating: newRating,
        comment: parseResult.data.comment,
      },
    }),
    prisma.user.update({
      where: { id: delivery.travelerId },
      data: {
        rating: newAvg,
        reviewCount: { increment: 1 },
      },
    }),
  ])

  res.status(201).json({ review })
})

// GET reviews for a specific traveler
router.get('/traveler/:userId', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { revieweeId: req.params.userId as string },
    orderBy: { createdAt: 'desc' },
    include: {
      reviewer: { select: { id: true, nickname: true } },
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: req.params.userId as string },
    select: { rating: true, reviewCount: true, packagesDeliveredCount: true, nickname: true },
  })

  if (!user) return res.status(404).json({ error: 'User not found' })

  res.json({ user, reviews })
})

export default router