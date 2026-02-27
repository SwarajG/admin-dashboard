export type ProjectStatus = 'NOT_STARTED' | 'ACTIVE' | 'DONE'
export type BlockerStatus = 'OPEN' | 'RESOLVED'

export interface ProjectMemberDto {
  id: string
  userId: string
  projectId: string
  assignedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface ReminderDto {
  id: string
  projectId: string
  createdById: string
  title: string
  message: string | null
  remindAt: string
  isSent: boolean
  createdAt: string
  createdBy?: {
    id: string
    name: string
    email: string
  }
}

export interface BlockerDto {
  id: string
  projectId: string
  reportedById: string
  title: string
  description: string | null
  status: BlockerStatus
  createdAt: string
  updatedAt: string
  reportedBy?: {
    id: string
    name: string
    email: string
  }
}

export interface ProjectSummary {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  deadline: string | null
  daysUntilDeadline: number | null
  memberCount: number
  openBlockerCount: number
  ownerId: string
  owner: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface ProjectDetail extends ProjectSummary {
  members: ProjectMemberDto[]
  reminders: ReminderDto[]
  blockers: BlockerDto[]
}

export interface CreateProjectInput {
  name: string
  description?: string
  deadline?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  deadline?: string
  status?: ProjectStatus
}

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  doneProjects: number
  notStartedProjects: number
  openBlockers: number
  upcomingDeadlines: ProjectSummary[]
  myProjects: ProjectSummary[]
}
