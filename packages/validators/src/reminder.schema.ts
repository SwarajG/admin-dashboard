import { z } from 'zod'

export const createReminderSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().max(1000).optional(),
  remindAt: z.string().datetime({ offset: true }),
})

export const updateReminderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  message: z.string().max(1000).optional().nullable(),
  remindAt: z.string().datetime({ offset: true }).optional(),
})

export type CreateReminderInput = z.infer<typeof createReminderSchema>
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>
