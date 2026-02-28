import { Request, Response } from 'express'
import { prisma } from '@repo/db'

export async function getMyOrg(req: Request, res: Response): Promise<void> {
  try {
    if (!req.orgId) {
      res.status(404).json({ error: 'No organisation found for this user' })
      return
    }

    const org = await prisma.organisation.findUnique({
      where: { id: req.orgId },
      select: { id: true, name: true, slug: true, createdAt: true },
    })

    if (!org) {
      res.status(404).json({ error: 'Organisation not found' })
      return
    }

    res.json({ org: { ...org, createdAt: org.createdAt.toISOString() } })
  } catch (err) {
    console.error('getMyOrg error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
