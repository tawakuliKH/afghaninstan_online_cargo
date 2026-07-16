import { prisma } from './prisma'

export interface ViewerContext {
  isAuthenticated: boolean
  userId?: string
  hasFullAccess: boolean
}

// Full contact visibility rule:
//   - Admin: always full access
//   - Approved user who has posted at least one trip or package: full access
//   - Everyone else (anonymous, pending, approved-but-never-posted): nickname only
export async function getViewerContext(userId?: string, isAdmin?: boolean): Promise<ViewerContext> {
  if (!userId) return { isAuthenticated: false, hasFullAccess: false }

  if (isAdmin) {
    return { isAuthenticated: true, userId, hasFullAccess: true }
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { accountStatus: true } })
  if (!user || user.accountStatus !== 'APPROVED') {
    return { isAuthenticated: true, userId, hasFullAccess: false }
  }

  const [tripCount, packageCount] = await Promise.all([
    prisma.trip.count({ where: { travelerId: userId } }),
    prisma.package.count({ where: { senderId: userId } }),
  ])

  return {
    isAuthenticated: true,
    userId,
    hasFullAccess: tripCount > 0 || packageCount > 0,
  }
}

// Shapes a User object according to the visibility rule above.
export function shapeUserForViewer<T extends { id: string; nickname: string; legalFullName: string; whatsappNumber?: string | null; email?: string }>(
  user: T,
  viewer: ViewerContext
) {
  if (viewer.hasFullAccess) {
    return {
      id: user.id,
      nickname: user.nickname,
      legalFullName: user.legalFullName,
      whatsappNumber: user.whatsappNumber,
      email: user.email,
    }
  }

  return { id: user.id, nickname: user.nickname }
}
