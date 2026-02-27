import { Request, Response } from 'express'
import { prisma, Role } from '@repo/db'

function toUserPublic(user: {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: Date
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  }
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const { role } = req.query

    const where: { role?: Role } = {}
    if (role && ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'].includes(role as string)) {
      where.role = role as Role
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ users: users.map(toUserPublic) })
  } catch (err) {
    console.error('listUsers error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ user: toUserPublic(user) })
  } catch (err) {
    console.error('getUserById error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    if (req.user.id === id) {
      res.status(400).json({ error: 'Cannot change your own role' })
      return
    }

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    res.json({ user: toUserPublic(updated) })
  } catch (err) {
    console.error('updateUserRole error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { isActive } = req.body

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    if (req.user.id === id) {
      res.status(400).json({ error: 'Cannot deactivate your own account' })
      return
    }

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    res.json({ user: toUserPublic(updated) })
  } catch (err) {
    console.error('updateUserStatus error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
