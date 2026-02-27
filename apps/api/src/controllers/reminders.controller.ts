import { Request, Response } from 'express'
import { prisma } from '@repo/db'

export async function listReminders(req: Request, res: Response): Promise<void> {
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

    const reminders = await prisma.reminder.findMany({
      where: { projectId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { remindAt: 'asc' },
    })

    res.json({
      reminders: reminders.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        createdById: r.createdById,
        title: r.title,
        message: r.message,
        remindAt: r.remindAt.toISOString(),
        isSent: r.isSent,
        createdAt: r.createdAt.toISOString(),
        createdBy: r.createdBy,
      })),
    })
  } catch (err) {
    console.error('listReminders error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function createReminder(req: Request, res: Response): Promise<void> {
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

    const { title, message, remindAt } = req.body

    const reminder = await prisma.reminder.create({
      data: {
        projectId,
        createdById: userId,
        title,
        message,
        remindAt: new Date(remindAt),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    res.status(201).json({
      reminder: {
        id: reminder.id,
        projectId: reminder.projectId,
        createdById: reminder.createdById,
        title: reminder.title,
        message: reminder.message,
        remindAt: reminder.remindAt.toISOString(),
        isSent: reminder.isSent,
        createdAt: reminder.createdAt.toISOString(),
        createdBy: reminder.createdBy,
      },
    })
  } catch (err) {
    console.error('createReminder error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateReminder(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id } = req.params
    const { id: userId, role } = req.user

    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        project: { select: { ownerId: true } },
      },
    })

    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' })
      return
    }

    const isCreator = reminder.createdById === userId
    const isProjectOwner = reminder.project.ownerId === userId
    const isAdmin = role === 'ADMIN'

    if (!isCreator && !isProjectOwner && !isAdmin) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    const { title, message, remindAt } = req.body

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(message !== undefined && { message }),
        ...(remindAt !== undefined && { remindAt: new Date(remindAt), isSent: false }),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    res.json({
      reminder: {
        id: updated.id,
        projectId: updated.projectId,
        createdById: updated.createdById,
        title: updated.title,
        message: updated.message,
        remindAt: updated.remindAt.toISOString(),
        isSent: updated.isSent,
        createdAt: updated.createdAt.toISOString(),
        createdBy: updated.createdBy,
      },
    })
  } catch (err) {
    console.error('updateReminder error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function deleteReminder(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id } = req.params
    const { id: userId, role } = req.user

    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        project: { select: { ownerId: true } },
      },
    })

    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' })
      return
    }

    const isCreator = reminder.createdById === userId
    const isProjectOwner = reminder.project.ownerId === userId
    const isAdmin = role === 'ADMIN'

    if (!isCreator && !isProjectOwner && !isAdmin) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    await prisma.reminder.delete({ where: { id } })

    res.json({ message: 'Reminder deleted successfully' })
  } catch (err) {
    console.error('deleteReminder error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
