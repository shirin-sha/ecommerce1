import { Router } from 'express'
import * as checkoutController from '../controllers/checkoutController'
import { validate } from '../middleware/validate'
import { createOrderSchema } from '@ecommerce/shared'

const router = Router()

router.post('/calculate', checkoutController.calculateTotals)
router.post('/create-order', validate(createOrderSchema), checkoutController.createOrder)
router.post('/payment-intent', checkoutController.createPaymentIntent)

export default router
