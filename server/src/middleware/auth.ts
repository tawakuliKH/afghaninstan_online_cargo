import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'
import { prisma } from '../lib/prisma'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No access token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired access token' })
  }
}

export async function requireApproved(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
  if (!user || user.accountStatus !== 'APPROVED') {
    return res.status(403).json({ error: 'Your account must be approved to perform this action' })
  }

  next()
}