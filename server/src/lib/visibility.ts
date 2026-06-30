import { prisma } from './prisma'

export interface ViewerContext {
  isAuthenticated: boolean
  userId?: string
  hasPosted?: boolean
}

export async function getViewerContext(userId?: string): Promise<ViewerContext> {
  if (!userId) return { isAuthenticated: false }

  const [tripCount, packageCount] = await Promise.all([
    prisma.trip.count({ where: { travelerId: userId } }),
    prisma.package.count({ where: { senderId: userId } }),
  ])

  return {
    isAuthenticated: true,
    userId,
    hasPosted: tripCount > 0 || packageCount > 0,
  }
}

// Shapes a User object according to the 3-tier visibility rule.
// posterUserId = the id of the user being displayed (trip owner / package sender / profile owner)
export function shapeUserForViewer<T extends { id: string; nickname: string; legalFullName: string; whatsappNumber?: string; email?: string }>(
  user: T,
  viewer: ViewerContext
) {
  const isOwnProfile = viewer.userId === user.id

  // Tier 1: anonymous — nickname only, no contact
  if (!viewer.isAuthenticated) {
    return { id: user.id, nickname: user.nickname }
  }

  // Tier 2: approved but hasn't posted — real name, no contact (unless viewing own profile)
  if (!viewer.hasPosted && !isOwnProfile) {
    return { id: user.id, nickname: user.nickname, legalFullName: user.legalFullName }
  }

  // Tier 3: approved + has posted (or viewing own profile) — full visibility
  return {
    id: user.id,
    nickname: user.nickname,
    legalFullName: user.legalFullName,
    whatsappNumber: user.whatsappNumber,
    email: user.email,
  }
}