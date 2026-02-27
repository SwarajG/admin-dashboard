import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { updateBlockerSchema } from '@repo/validators'
import * as blockersController from '../controllers/blockers.controller'

const router = Router()

router.use(authenticate)
router.patch('/:id', validate(updateBlockerSchema), blockersController.updateBlocker)
router.delete('/:id', blockersController.deleteBlocker)

export default router
