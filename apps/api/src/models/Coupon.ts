import mongoose, { Schema, Document } from 'mongoose'
import { CouponType } from '@ecommerce/shared'

export interface ICoupon extends Document {
  code: string
  type: CouponType
  amount: number
  description?: string
  expiryDate?: Date
  usageLimit?: number
  usageLimitPerUser?: number
  minSpend?: number
  maxSpend?: number
  includeProductIds: mongoose.Types.ObjectId[]
  excludeProductIds: mongoose.Types.ObjectId[]
  includeCategoryIds: mongoose.Types.ObjectId[]
  excludeCategoryIds: mongoose.Types.ObjectId[]
  usageCount: number
  usedBy: Array<{
    userId?: mongoose.Types.ObjectId
    orderIds: mongoose.Types.ObjectId[]
  }>
  createdAt: Date
  updatedAt: Date
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['percent', 'fixed_cart'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: String,
    expiryDate: Date,
    usageLimit: {
      type: Number,
      min: 1,
    },
    usageLimitPerUser: {
      type: Number,
      min: 1,
    },
    minSpend: {
      type: Number,
      min: 0,
    },
    maxSpend: {
      type: Number,
      min: 0,
    },
    includeProductIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    excludeProductIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    includeCategoryIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    excludeCategoryIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        orderIds: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Index for expiry date queries
couponSchema.index({ expiryDate: 1 })

export const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema)
