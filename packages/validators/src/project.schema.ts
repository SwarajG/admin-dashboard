import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  deadline: z.string().optional().nullable(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  deadline: z.string().optional().nullable(),
  status: z.enum(['NOT_STARTED', 'ACTIVE', 'DONE']).optional(),
})

export const updateProjectStatusSchema = z.object({
  status: z.enum(['NOT_STARTED', 'ACTIVE', 'DONE']),
})

export const assignMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusSchema>
export type AssignMemberInput = z.infer<typeof assignMemberSchema>
