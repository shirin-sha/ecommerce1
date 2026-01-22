import { Router } from 'express'
import * as couponController from '../controllers/couponController'
import { requireAuth, requireShopManager } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createCouponSchema, updateCouponSchema } from '@ecommerce/shared'

const router = Router()

// Public route
router.post('/validate', couponController.validateCoupon)

// Protected routes (Admin/Shop Manager)
router.get('/', requireAuth, requireShopManager, couponController.getCoupons)
router.get('/:id', requireAuth, requireShopManager, couponController.getCoupon)
router.post('/', requireAuth, requireShopManager, validate(createCouponSchema), couponController.createCoupon)
router.patch('/:id', requireAuth, requireShopManager, validate(updateCouponSchema), couponController.updateCoupon)
router.delete('/:id', requireAuth, requireShopManager, couponController.deleteCoupon)

export default router
