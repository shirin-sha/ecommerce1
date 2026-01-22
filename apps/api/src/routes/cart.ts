import { Router } from 'express'
import * as cartController from '../controllers/cartController'
import { validate } from '../middleware/validate'
import { addToCartSchema } from '@ecommerce/shared'

const router = Router()

router.get('/', cartController.getCart)
router.post('/items', validate(addToCartSchema), cartController.addToCart)
router.post('/apply-coupon', cartController.applyCoupon)
router.delete('/remove-coupon/:code', cartController.removeCoupon)

export default router
