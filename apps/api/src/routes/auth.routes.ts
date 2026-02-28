import { Router } from 'express'
import passport from 'passport'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { registerSchema, loginSchema } from '@repo/validators'
import * as authController from '../controllers/auth.controller'

const router = Router()

router.get('/setup-status', authController.setupStatus)
router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)
router.post('/logout', authController.logout)
router.get('/me', authenticate, authController.getMe)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`,
    session: false,
  }),
  authController.handleGoogleCallback
)

export default router
