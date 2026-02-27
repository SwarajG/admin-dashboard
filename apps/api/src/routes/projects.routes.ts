import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  assignMemberSchema,
  createReminderSchema,
  createBlockerSchema,
} from '@repo/validators'
import * as projectsController from '../controllers/projects.controller'
import * as membersController from '../controllers/members.controller'
import * as remindersController from '../controllers/reminders.controller'
import * as blockersController from '../controllers/blockers.controller'

const router = Router()

router.use(authenticate)

// Dashboard stats — must be before /:id to avoid conflict
router.get('/dashboard/stats', projectsController.getDashboardStats)

// Projects
router.get('/', projectsController.listProjects)
router.post('/', validate(createProjectSchema), projectsController.createProject)
router.get('/:id', projectsController.getProjectById)
router.patch('/:id', validate(updateProjectSchema), projectsController.updateProject)
router.delete('/:id', projectsController.deleteProject)
router.patch('/:id/status', validate(updateProjectStatusSchema), projectsController.updateProjectStatus)

// Members
router.get('/:id/members', membersController.listMembers)
router.post('/:id/members', validate(assignMemberSchema), membersController.assignMember)
router.delete('/:id/members/:userId', membersController.removeMember)

// Reminders
router.get('/:id/reminders', remindersController.listReminders)
router.post('/:id/reminders', validate(createReminderSchema), remindersController.createReminder)

// Blockers
router.get('/:id/blockers', blockersController.listBlockers)
router.post('/:id/blockers', validate(createBlockerSchema), blockersController.createBlocker)

export default router
