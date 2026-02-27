import { Request, Response } from 'express'
import { prisma } from '@repo/db'
import { ProjectSummary, ProjectDetail } from '@repo/types'

function computeDaysUntilDeadline(deadline: Date | null): number | null {
  if (!deadline) return null
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function toProjectSummary(project: {
  id: string
  name: string
  description: string | null
  status: string
  deadline: Date | null
  ownerId: string
  owner: { id: string; name: string; email: string }
  createdAt: Date
  updatedAt: Date
  _count: { members: number; blockers: number }
}): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status as ProjectSummary['status'],
    deadline: project.deadline ? project.deadline.toISOString() : null,
    daysUntilDeadline: computeDaysUntilDeadline(project.deadline),
    memberCount: project._count.members,
    openBlockerCount: project._count.blockers,
    ownerId: project.ownerId,
    owner: project.owner,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

const projectInclude = {
  owner: {
    select: { id: true, name: true, email: true },
  },
  _count: {
    select: {
      members: true,
      blockers: { where: { status: 'OPEN' as const } },
    },
  },
} as const

export async function listProjects(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id: userId, role } = req.user

    let projects
    if (role === 'ADMIN' || role === 'MANAGER') {
      projects = await prisma.project.findMany({
        include: projectInclude,
        orderBy: { createdAt: 'desc' },
      })
    } else {
      projects = await prisma.project.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: projectInclude,
        orderBy: { createdAt: 'desc' },
      })
    }

    res.json({ projects: projects.map(toProjectSummary) })
  } catch (err) {
    console.error('listProjects error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { role, id: userId } = req.user
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    const { name, description, deadline } = req.body

    const project = await prisma.project.create({
      data: {
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        ownerId: userId,
      },
      include: projectInclude,
    })

    res.status(201).json({ project: toProjectSummary(project) })
  } catch (err) {
    console.error('createProject error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getProjectById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id } = req.params
    const { id: userId, role } = req.user

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        reminders: {
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { remindAt: 'asc' },
        },
        blockers: {
          include: {
            reportedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            members: true,
            blockers: { where: { status: 'OPEN' } },
          },
        },
      },
    })

    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    // Check access for EMPLOYEE/VIEWER
    if (role === 'EMPLOYEE' || role === 'VIEWER') {
      const isMember = project.members.some((m) => m.userId === userId)
      if (!isMember) {
        res.status(403).json({ error: 'Access denied' })
        return
      }
    }

    const detail: ProjectDetail = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status as ProjectDetail['status'],
      deadline: project.deadline ? project.deadline.toISOString() : null,
      daysUntilDeadline: computeDaysUntilDeadline(project.deadline),
      memberCount: project._count.members,
      openBlockerCount: project._count.blockers,
      ownerId: project.ownerId,
      owner: project.owner,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      members: project.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        projectId: m.projectId,
        assignedAt: m.assignedAt.toISOString(),
        user: m.user,
      })),
      reminders: project.reminders.map((r) => ({
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
      blockers: project.blockers.map((b) => ({
        id: b.id,
        projectId: b.projectId,
        reportedById: b.reportedById,
        title: b.title,
        description: b.description,
        status: b.status as 'OPEN' | 'RESOLVED',
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        reportedBy: b.reportedBy,
      })),
    }

    res.json({ project: detail })
  } catch (err) {
    console.error('getProjectById error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id } = req.params
    const { role, id: userId } = req.user

    if (role === 'EMPLOYEE' || role === 'VIEWER') {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    if (role === 'MANAGER' && project.ownerId !== userId) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    const { name, description, deadline, status } = req.body

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(status !== undefined && { status }),
      },
      include: projectInclude,
    })

    res.json({ project: toProjectSummary(updated) })
  } catch (err) {
    console.error('updateProject error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id } = req.params
    const { role, id: userId } = req.user

    if (role === 'EMPLOYEE' || role === 'VIEWER') {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    if (role === 'MANAGER' && project.ownerId !== userId) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    await prisma.project.delete({ where: { id } })

    res.json({ message: 'Project deleted successfully' })
  } catch (err) {
    console.error('deleteProject error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateProjectStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { id } = req.params
    const { role, id: userId } = req.user
    const { status } = req.body

    if (role === 'VIEWER') {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    // EMPLOYEE must be a member of the project
    if (role === 'EMPLOYEE') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: id, userId } },
      })
      if (!membership) {
        res.status(403).json({ error: 'Access denied' })
        return
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { status },
      include: projectInclude,
    })

    res.json({ project: toProjectSummary(updated) })
  } catch (err) {
    console.error('updateProjectStatus error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { role, id: userId } = req.user
    const isAdminOrManager = role === 'ADMIN' || role === 'MANAGER'

    const projectWhere = isAdminOrManager
      ? {}
      : { members: { some: { userId } } }

    const [totalProjects, activeProjects, doneProjects, notStartedProjects, openBlockers, upcomingProjects, myMemberships] =
      await Promise.all([
        prisma.project.count({ where: projectWhere }),
        prisma.project.count({ where: { ...projectWhere, status: 'ACTIVE' } }),
        prisma.project.count({ where: { ...projectWhere, status: 'DONE' } }),
        prisma.project.count({ where: { ...projectWhere, status: 'NOT_STARTED' } }),
        prisma.blocker.count({
          where: {
            status: 'OPEN',
            ...(isAdminOrManager ? {} : { project: { members: { some: { userId } } } }),
          },
        }),
        prisma.project.findMany({
          where: {
            ...projectWhere,
            deadline: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          },
          include: projectInclude,
          orderBy: { deadline: 'asc' },
        }),
        prisma.project.findMany({
          where: { members: { some: { userId } } },
          include: projectInclude,
          orderBy: { createdAt: 'desc' },
        }),
      ])

    res.json({
      totalProjects,
      activeProjects,
      doneProjects,
      notStartedProjects,
      openBlockers,
      upcomingDeadlines: upcomingProjects.map(toProjectSummary),
      myProjects: myMemberships.map(toProjectSummary),
    })
  } catch (err) {
    console.error('getDashboardStats error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
