import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireApproved } from '../middleware/auth'
import { z } from 'zod'

const router = Router()

const sendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(2000),
})

// SEND a message
router.post('/', requireAuth, requireApproved, async (req, res) => {
  const parseResult = sendMessageSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors })
  }
  const { receiverId, content } = parseResult.data

  if (receiverId === req.user!.userId) {
    return res.status(400).json({ error: 'You cannot message yourself' })
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } })
  if (!receiver || receiver.accountStatus !== 'APPROVED') {
    return res.status(404).json({ error: 'Recipient not found or not approved' })
  }

  const message = await prisma.message.create({
    data: {
      senderId: req.user!.userId,
      receiverId,
      content,
    },
  })

  // Create in-app notification for receiver
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'MESSAGE',
      title: 'New message',
      body: `You have a new message from ${req.user!.userId}`,
      link: `/messages/${req.user!.userId}`,
    },
  })

  res.status(201).json({ message })
})

// LIST conversations (unique users this person has talked with)
router.get('/conversations', requireAuth, requireApproved, async (req, res) => {
  const userId = req.user!.userId

  // Get the latest message per conversation partner
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, nickname: true } },
      receiver: { select: { id: true, nickname: true } },
    },
  })

  // Deduplicate by conversation partner
  const seen = new Set<string>()
  const conversations = messages.reduce((acc, msg) => {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId
    if (!seen.has(partnerId)) {
      seen.add(partnerId)
      acc.push({
        partner: msg.senderId === userId ? msg.receiver : msg.sender,
        lastMessage: { content: msg.content, createdAt: msg.createdAt, readAt: msg.readAt },
      })
    }
    return acc
  }, [] as any[])

  res.json({ conversations })
})

// GET thread with a specific user
router.get('/thread/:userId', requireAuth, requireApproved, async (req, res) => {
  const myId = req.user!.userId
  const otherId = req.params.userId as string

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    },
    orderBy: { createdAt: 'asc' },
  })

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: {
      senderId: otherId,
      receiverId: myId,
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  res.json({ messages })
})

// UNREAD count — useful for the notification badge in the navbar
router.get('/unread-count', requireAuth, requireApproved, async (req, res) => {
  const count = await prisma.message.count({
    where: { receiverId: req.user!.userId, readAt: null },
  })
  res.json({ unreadCount: count })
})

export default router