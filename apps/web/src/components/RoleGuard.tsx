import type { Role } from '@repo/types'
import { useAuth } from '../context/AuthContext'

interface RoleGuardProps {
  allowedRoles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth()
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
