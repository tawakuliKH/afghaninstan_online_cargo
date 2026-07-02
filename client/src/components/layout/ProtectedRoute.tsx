import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface Props {
  children: React.ReactNode
  requireApproved?: boolean
}

export function ProtectedRoute({ children, requireApproved = false }: Props) {
  const { user } = useAuthStore()

  if (!user) return <Navigate to="/login" replace />

  if (requireApproved && user.accountStatus !== 'APPROVED') {
    return <Navigate to="/profile" replace />
  }

  return <>{children}</>
}