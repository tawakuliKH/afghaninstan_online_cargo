import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireApproved } from '../middleware/auth'

const router = Router()

// LIST my notifications
router.get('/', requireAuth, requireApproved, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  res.json({ notifications })
})

// MARK ONE as read
router.patch('/:id/read', requireAuth, requireApproved, async (req, res) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id as string },
  })
  if (!notification) return res.status(404).json({ error: 'Notification not found' })
  if (notification.userId !== req.user!.userId) {
    return res.status(403).json({ error: 'Not your notification' })
  }

  const updated = await prisma.notification.update({
    where: { id: req.params.id as string },
    data: { readAt: new Date() },
  })
  res.json({ notification: updated })
})

// MARK ALL as read
router.patch('/read-all', requireAuth, requireApproved, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, readAt: null },
    data: { readAt: new Date() },
  })
  res.json({ message: 'All notifications marked as read' })
})

// UNREAD count
router.get('/unread-count', requireAuth, requireApproved, async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.userId, readAt: null },
  })
  res.json({ unreadCount: count })
})

export default router