import { Request, Response, NextFunction } from 'express'
import { Role } from '@repo/db'

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }
    next()
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole('ADMIN')(req, res, next)
}

export function requireManagerOrAbove(req: Request, res: Response, next: NextFunction): void {
  requireRole('ADMIN', 'MANAGER')(req, res, next)
}
