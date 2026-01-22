import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'
import { UserRole, Address } from '@ecommerce/shared'

export interface IUser extends Document {
  email: string
  name: string
  passwordHash: string
  role: UserRole
  isActive: boolean
  phone?: string
  addresses?: {
    billing?: Address
    shipping?: Address
  }
  ordersCount: number
  totalSpend: number
  avgOrderValue: number
  lastActiveAt?: Date
  lastLoginAt?: Date
  twoFactorEnabled: boolean
  twoFactorSecret?: string
  refreshTokens: string[]
  createdAt: Date
  updatedAt: Date
  comparePassword(password: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'shop_manager', 'staff', 'customer'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: String,
    addresses: {
      billing: {
        firstName: String,
        lastName: String,
        company: String,
        address1: String,
        address2: String,
        city: String,
        state: String,
        postcode: String,
        country: String,
        phone: String,
      },
      shipping: {
        firstName: String,
        lastName: String,
        company: String,
        address1: String,
        address2: String,
        city: String,
        state: String,
        postcode: String,
        country: String,
        phone: String,
      },
    },
    ordersCount: {
      type: Number,
      default: 0,
    },
    totalSpend: {
      type: Number,
      default: 0,
    },
    avgOrderValue: {
      type: Number,
      default: 0,
    },
    lastActiveAt: Date,
    lastLoginAt: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: String,
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
  }
)

// Index for customer stats queries
userSchema.index({ role: 1, totalSpend: -1 })
userSchema.index({ role: 1, ordersCount: -1 })

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash)
}

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema)
