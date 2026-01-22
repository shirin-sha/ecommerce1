import mongoose, { Schema, Document } from 'mongoose'
import { OrderStatus, PaymentStatus, Address } from '@ecommerce/shared'

export interface IOrder extends Document {
  orderNumber: string
  status: OrderStatus
  customerId?: mongoose.Types.ObjectId
  customerEmail: string
  customerName: string
  billingAddress: Address
  shippingAddress: Address
  items: {
    productId: mongoose.Types.ObjectId
    variationId?: mongoose.Types.ObjectId
    nameSnapshot: string
    skuSnapshot?: string
    price: number
    qty: number
    subtotal: number
    total: number
  }[]
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
  couponCodes: string[]
  discounts: {
    couponCode: string
    amount: number
  }[]
  shippingMethod: {
    zoneId?: mongoose.Types.ObjectId
    method: string
    cost: number
  }
  payment: {
    provider: string
    methodTitle: string
    transactionId?: string
    paidAt?: Date
    status: PaymentStatus
  }
  notes: {
    content: string
    isCustomerNote: boolean
    createdBy: mongoose.Types.ObjectId
    createdAt: Date
  }[]
  events: {
    type: 'status_change' | 'payment' | 'note' | 'email_sent'
    description: string
    userId?: mongoose.Types.ObjectId
    createdAt: Date
  }[]
  attribution?: {
    source: string
    medium?: string
    campaign?: string
    referrer?: string
  }
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending_payment', 'processing', 'on_hold', 'completed', 'cancelled', 'refunded', 'failed'],
      default: 'pending_payment',
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    customerEmail: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    billingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      company: String,
      address1: { type: String, required: true },
      address2: String,
      city: { type: String, required: true },
      state: String,
      postcode: { type: String, required: true },
      country: { type: String, required: true },
      phone: String,
    },
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      company: String,
      address1: { type: String, required: true },
      address2: String,
      city: { type: String, required: true },
      state: String,
      postcode: { type: String, required: true },
      country: { type: String, required: true },
      phone: String,
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variationId: { type: Schema.Types.ObjectId, ref: 'Variation' },
        nameSnapshot: { type: String, required: true },
        skuSnapshot: String,
        price: { type: Number, required: true, min: 0 },
        qty: { type: Number, required: true, min: 1 },
        subtotal: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    couponCodes: {
      type: [String],
      default: [],
    },
    discounts: [
      {
        couponCode: String,
        amount: { type: Number, min: 0 },
      },
    ],
    shippingMethod: {
      zoneId: { type: Schema.Types.ObjectId, ref: 'ShippingZone' },
      method: { type: String, required: true },
      cost: { type: Number, required: true, min: 0 },
    },
    payment: {
      provider: { type: String, required: true },
      methodTitle: { type: String, required: true },
      transactionId: String,
      paidAt: Date,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
    },
    notes: [
      {
        content: { type: String, required: true },
        isCustomerNote: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    events: [
      {
        type: {
          type: String,
          enum: ['status_change', 'payment', 'note', 'email_sent'],
          required: true,
        },
        description: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    attribution: {
      source: String,
      medium: String,
      campaign: String,
      referrer: String,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
)

// Indexes for performance
orderSchema.index({ customerId: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ orderNumber: 1 })
orderSchema.index({ customerEmail: 1 })

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const { generateOrderNumber } = await import('@ecommerce/shared')
    this.orderNumber = generateOrderNumber()
  }

  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date()
  }

  // Add event when status changes
  if (this.isModified('status') && !this.isNew) {
    this.events.push({
      type: 'status_change',
      description: `Order status changed to ${this.status}`,
      createdAt: new Date(),
    })
  }

  next()
})

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema)
