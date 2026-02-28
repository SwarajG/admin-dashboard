import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { getMyOrg } from '../controllers/org.controller'

const router = Router()

router.get('/me', authenticate, getMyOrg)

export default router
