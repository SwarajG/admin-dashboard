import { Role } from '@repo/db'

declare global {
  namespace Express {
    interface User {
      id: string
      email: string
      name: string
      role: Role
      isActive: boolean
    }
    interface Request {
      user?: User
    }
  }
}
export {}
