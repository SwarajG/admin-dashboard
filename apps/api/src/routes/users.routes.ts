import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/rbac.middleware'
import { validate } from '../middleware/validate.middleware'
import { updateUserRoleSchema, updateUserStatusSchema } from '@repo/validators'
import * as usersController from '../controllers/users.controller'

const router = Router()

router.use(authenticate, requireAdmin)
router.get('/', usersController.listUsers)
router.get('/:id', usersController.getUserById)
router.patch('/:id/role', validate(updateUserRoleSchema), usersController.updateUserRole)
router.patch('/:id/status', validate(updateUserStatusSchema), usersController.updateUserStatus)

export default router
