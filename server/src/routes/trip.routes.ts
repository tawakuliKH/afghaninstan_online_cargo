import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireApproved, optionalAuth } from '../middleware/auth'
import { createTripSchema, updateTripSchema } from '../schemas/trip.schema'
import { getViewerContext, shapeUserForViewer } from '../lib/visibility'

const router = Router()

// CREATE
router.post('/', requireAuth, requireApproved, async (req, res) => {
  const parseResult = createTripSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }

  const trip = await prisma.trip.create({
    data: {
      ...parseResult.data,
      travelerId: req.user!.userId,
    },
  })

  res.status(201).json({ trip })
})

// LIST (no filters/pagination yet — next step)
router.get('/', async (_req, res) => {
  const trips = await prisma.trip.findMany({
    orderBy: { departureDate: 'asc' },
    include: { traveler: { select: { id: true, nickname: true, legalFullName: true } } },
  })
  res.json({ trips })
})


// UPDATE
router.patch('/:id', requireAuth, requireApproved, async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id as string } })
  if (!trip) return res.status(404).json({ error: 'Trip not found' })

  const isOwner = trip.travelerId === req.user!.userId
  if (!isOwner && !req.user!.isAdmin) {
    return res.status(403).json({ error: 'You can only edit your own trips' })
  }

  const parseResult = updateTripSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }

  const updated = await prisma.trip.update({
    where: { id: req.params.id as string},
    data: parseResult.data,
  })

  res.json({ trip: updated })
})

// DELETE
router.delete('/:id', requireAuth, requireApproved, async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id as string} })
  if (!trip) return res.status(404).json({ error: 'Trip not found' })

  const isOwner = trip.travelerId === req.user!.userId
  if (!isOwner && !req.user!.isAdmin) {
    return res.status(403).json({ error: 'You can only delete your own trips' })
  }

  await prisma.trip.delete({ where: { id: req.params.id as string } })
  res.json({ message: 'Trip deleted' })
})

// LIST with filters + pagination
router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = 10
  const skip = (page - 1) * pageSize

  const { originCountry, destCountry, startDate, endDate } = req.query

  const where: any = {}
  if (originCountry) where.originCountry = { equals: String(originCountry), mode: 'insensitive' }
  if (destCountry) where.destCountry = { equals: String(destCountry), mode: 'insensitive' }
  if (startDate || endDate) {
    where.departureDate = {}
    if (startDate) where.departureDate.gte = new Date(String(startDate))
    if (endDate) where.departureDate.lte = new Date(String(endDate))
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { departureDate: 'asc' },
      include: { traveler: { select: { id: true, nickname: true, legalFullName: true } } },
      skip,
      take: pageSize,
    }),
    prisma.trip.count({ where }),
  ])

  res.json({
    trips,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
})

// GET ONE
router.get('/:id', optionalAuth, async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id as string },
    include: { traveler: true }, // full user record now, we'll shape it below
  })
  if (!trip) return res.status(404).json({ error: 'Trip not found' })

  const viewer = await getViewerContext(req.user?.userId)
  const { traveler, ...tripData } = trip

  res.json({
    trip: {
      ...tripData,
      traveler: shapeUserForViewer(traveler, viewer),
    },
    viewerCanSeeContact: viewer.isAuthenticated && (viewer.hasPosted || viewer.userId === traveler.id),
  })
})

export default router