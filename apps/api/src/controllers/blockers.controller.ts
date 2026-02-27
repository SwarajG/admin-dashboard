import { Request, Response } from 'express'
import { prisma } from '@repo/db'

export async function listBlockers(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id: projectId } = req.params
    const { id: userId, role } = req.user

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    if (role !== 'ADMIN' && role !== 'MANAGER') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      })
      if (!membership) {
        res.status(403).json({ error: 'Access denied' })
        return
      }
    }

    const blockers = await prisma.blocker.findMany({
      where: { projectId },
      include: {
        reportedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      blockers: blockers.map((b) => ({
        id: b.id,
        projectId: b.projectId,
        reportedById: b.reportedById,
        title: b.title,
        description: b.description,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        reportedBy: b.reportedBy,
      })),
    })
  } catch (err) {
    console.error('listBlockers error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function createBlocker(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id: projectId } = req.params
    const { id: userId, role } = req.user

    if (role === 'VIEWER') {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    if (role === 'EMPLOYEE') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      })
      if (!membership) {
        res.status(403).json({ error: 'Access denied' })
        return
      }
    }

    const { title, description } = req.body

    const blocker = await prisma.blocker.create({
      data: {
        projectId,
        reportedById: userId,
        title,
        description,
      },
      include: {
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    })

    res.status(201).json({
      blocker: {
        id: blocker.id,
        projectId: blocker.projectId,
        reportedById: blocker.reportedById,
        title: blocker.title,
        description: blocker.description,
        status: blocker.status,
        createdAt: blocker.createdAt.toISOString(),
        updatedAt: blocker.updatedAt.toISOString(),
        reportedBy: blocker.reportedBy,
      },
    })
  } catch (err) {
    console.error('createBlocker error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateBlocker(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id } = req.params
    const { id: userId, role } = req.user

    const blocker = await prisma.blocker.findUnique({
      where: { id },
      include: {
        project: { select: { ownerId: true } },
      },
    })

    if (!blocker) {
      res.status(404).json({ error: 'Blocker not found' })
      return
    }

    const isReporter = blocker.reportedById === userId
    const isProjectOwner = blocker.project.ownerId === userId
    const isAdmin = role === 'ADMIN'
    const isManager = role === 'MANAGER'

    if (!isReporter && !isProjectOwner && !isAdmin && !isManager) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    const { title, description, status } = req.body

    const updated = await prisma.blocker.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
      include: {
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    })

    res.json({
      blocker: {
        id: updated.id,
        projectId: updated.projectId,
        reportedById: updated.reportedById,
        title: updated.title,
        description: updated.description,
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        reportedBy: updated.reportedBy,
      },
    })
  } catch (err) {
    console.error('updateBlocker error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function deleteBlocker(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id } = req.params
    const { id: userId, role } = req.user

    const blocker = await prisma.blocker.findUnique({
      where: { id },
      include: {
        project: { select: { ownerId: true } },
      },
    })

    if (!blocker) {
      res.status(404).json({ error: 'Blocker not found' })
      return
    }

    const isReporter = blocker.reportedById === userId
    const isProjectOwner = blocker.project.ownerId === userId
    const isAdmin = role === 'ADMIN'

    if (!isReporter && !isProjectOwner && !isAdmin) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    await prisma.blocker.delete({ where: { id } })

    res.json({ message: 'Blocker deleted successfully' })
  } catch (err) {
    console.error('deleteBlocker error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
