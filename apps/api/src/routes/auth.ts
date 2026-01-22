import { Router } from 'express'
import * as authController from '../controllers/authController'
import { validate } from '../middleware/validate'
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@ecommerce/shared'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)
router.post('/logout', requireAuth, authController.logout)
router.post('/refresh', authController.refresh)
router.get('/me', requireAuth, authController.getMe)
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword)

export default router
