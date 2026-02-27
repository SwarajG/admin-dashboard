import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { updateReminderSchema } from '@repo/validators'
import * as remindersController from '../controllers/reminders.controller'

const router = Router()

router.use(authenticate)
router.patch('/:id', validate(updateReminderSchema), remindersController.updateReminder)
router.delete('/:id', remindersController.deleteReminder)

export default router
