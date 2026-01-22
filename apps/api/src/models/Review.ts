import mongoose, { Schema, Document } from 'mongoose'
import { ReviewStatus } from '@ecommerce/shared'

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId
  customerId?: mongoose.Types.ObjectId
  authorName: string
  authorEmail: string
  rating: number
  content: string
  status: ReviewStatus
  isVerifiedOwner: boolean
  replies: {
    content: string
    userId: mongoose.Types.ObjectId
    createdAt: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorEmail: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'spam', 'trash'],
      default: 'pending',
      index: true,
    },
    isVerifiedOwner: {
      type: Boolean,
      default: false,
    },
    replies: [
      {
        content: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Index for product reviews
reviewSchema.index({ productId: 1, status: 1 })
reviewSchema.index({ customerId: 1 })

// Update product rating summary when review is saved
reviewSchema.post('save', async function () {
  const { Product } = await import('./Product')
  const product = await Product.findById(this.productId)

  if (product) {
    // Recalculate average rating and count
    const approvedReviews = await mongoose.models.Review?.find({
      productId: this.productId,
      status: 'approved',
    })

    if (approvedReviews && approvedReviews.length > 0) {
      const totalRating = approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0)
      product.avgRating = totalRating / approvedReviews.length
      product.reviewCount = approvedReviews.length
    } else {
      product.avgRating = 0
      product.reviewCount = 0
    }

    await product.save()
  }
})

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema)
