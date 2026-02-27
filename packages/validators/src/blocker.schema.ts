import { z } from 'zod'

export const createBlockerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
})

export const updateBlockerSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(['OPEN', 'RESOLVED']).optional(),
})

export type CreateBlockerInput = z.infer<typeof createBlockerSchema>
export type UpdateBlockerInput = z.infer<typeof updateBlockerSchema>
