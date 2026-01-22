import { Router } from 'express'
import * as reviewController from '../controllers/reviewController'
import { requireAuth, requireShopManager } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createReviewSchema } from '@ecommerce/shared'

const router = Router()

// Public routes
router.get('/', reviewController.getReviews)
router.get('/:id', reviewController.getReview)
router.post('/', validate(createReviewSchema), reviewController.createReview)

// Protected routes (Admin/Shop Manager)
router.patch('/:id', requireAuth, requireShopManager, reviewController.moderateReview)
router.delete('/:id', requireAuth, requireShopManager, reviewController.deleteReview)
router.post('/:id/reply', requireAuth, requireShopManager, reviewController.replyToReview)

export default router
