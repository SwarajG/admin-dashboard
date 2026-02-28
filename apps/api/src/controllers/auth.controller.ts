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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function setupStatus(_req: Request, res: Response): Promise<void> {
  const orgCount = await prisma.organisation.count()
  res.json({ orgExists: orgCount > 0 })
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, orgName } = req.body

    const orgCount = await prisma.organisation.count()
    if (orgCount > 0) {
      res.status(403).json({ error: 'Registration is closed. Contact your admin.' })
      return
    }

    if (!orgName || orgName.trim().length < 2) {
      res.status(400).json({ error: 'Organisation name is required (min 2 characters)' })
      return
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: 'Email already in use' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const baseSlug = slugify(orgName)
    let slug = baseSlug
    let suffix = 1
    while (await prisma.organisation.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const [org, user] = await prisma.$transaction(async (tx) => {
      const createdOrg = await tx.organisation.create({
        data: { name: orgName.trim(), slug },
      })
      const createdUser = await tx.user.create({
        data: { name, email, password: hashedPassword, role: 'ADMIN' },
      })
      await tx.orgMember.create({
        data: { orgId: createdOrg.id, userId: createdUser.id },
      })
      return [createdOrg, createdUser]
    })

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    res.status(201).json({
      token,
      user: toUserPublic(user),
      org: { id: org.id, name: org.name, slug: org.slug },
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
