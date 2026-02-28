import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { prisma } from '@repo/db'

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    let token: string | undefined

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (req.cookies?.token) {
      token = req.cookies.token
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.id } })

    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account deactivated' })
      return
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    }

    const membership = await prisma.orgMember.findFirst({ where: { userId: user.id } })
    req.orgId = membership?.orgId

    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
