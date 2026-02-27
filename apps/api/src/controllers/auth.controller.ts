import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '@repo/db'
import { signToken } from '../utils/jwt'

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

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: 'Email already in use' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'EMPLOYEE',
      },
    })

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    res.status(201).json({
      token,
      user: toUserPublic(user),
    })
  } catch (err) {
    console.error('register error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account deactivated' })
      return
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    res.json({
      token,
      user: toUserPublic(user),
    })
  } catch (err) {
    console.error('login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token')
  res.json({ message: 'Logged out' })
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ user: toUserPublic(user) })
  } catch (err) {
    console.error('getMe error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function handleGoogleCallback(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`)
      return
    }

    const token = signToken({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    })

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`)
  } catch (err) {
    console.error('handleGoogleCallback error:', err)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`)
  }
}
