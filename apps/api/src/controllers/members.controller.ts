import { Request, Response } from 'express'
import { prisma } from '@repo/db'

export async function listMembers(req: Request, res: Response): Promise<void> {
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

    // Check access: EMPLOYEE/VIEWER must be a member
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      })
      if (!membership) {
        res.status(403).json({ error: 'Access denied' })
        return
      }
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { assignedAt: 'asc' },
    })

    res.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        projectId: m.projectId,
        assignedAt: m.assignedAt.toISOString(),
        user: m.user,
      })),
    })
  } catch (err) {
    console.error('listMembers error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function assignMember(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id: projectId } = req.params
    const { id: requesterId, role } = req.user
    const { userId } = req.body

    if (role !== 'ADMIN' && role !== 'MANAGER') {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    // MANAGER must own the project
    if (role === 'MANAGER' && project.ownerId !== requesterId) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    const userToAdd = await prisma.user.findUnique({ where: { id: userId } })
    if (!userToAdd) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    })
    if (existing) {
      res.status(409).json({ error: 'User is already a member of this project' })
      return
    }

    const member = await prisma.projectMember.create({
      data: { projectId, userId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    res.status(201).json({
      member: {
        id: member.id,
        userId: member.userId,
        projectId: member.projectId,
        assignedAt: member.assignedAt.toISOString(),
        user: member.user,
      },
    })
  } catch (err) {
    console.error('assignMember error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id: projectId, userId } = req.params
    const { id: requesterId, role } = req.user

    if (role !== 'ADMIN' && role !== 'MANAGER') {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    // MANAGER must own the project
    if (role === 'MANAGER' && project.ownerId !== requesterId) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    // Cannot remove the project owner
    if (project.ownerId === userId) {
      res.status(400).json({ error: 'Cannot remove the project owner' })
      return
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    })
    if (!membership) {
      res.status(404).json({ error: 'Member not found' })
      return
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    })

    res.json({ message: 'Member removed successfully' })
  } catch (err) {
    console.error('removeMember error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
