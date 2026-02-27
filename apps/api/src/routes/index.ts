import { Router } from 'express'
import authRouter from './auth.routes'
import usersRouter from './users.routes'
import projectsRouter from './projects.routes'
import remindersRouter from './reminders.routes'
import blockersRouter from './blockers.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/projects', projectsRouter)
router.use('/reminders', remindersRouter)
router.use('/blockers', blockersRouter)

export default router
