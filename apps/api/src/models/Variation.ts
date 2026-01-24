import mongoose, { Schema, Document } from 'mongoose'
import { StockStatus } from '@ecommerce/shared'

export interface IVariation extends Document {
  productId: mongoose.Types.ObjectId
  sku?: string
  barcode?: string
  image?: string
  regularPrice: number
  salePrice?: number
  saleStart?: Date
  saleEnd?: Date
  stockQty?: number
  stockStatus: StockStatus
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  shippingClass?: string
  description?: string
  attributeSelections: Record<string, string>
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

const variationSchema = new Schema<IVariation>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    barcode: String,
    image: String,
    regularPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    saleStart: Date,
    saleEnd: Date,
    stockQty: {
      type: Number,
      min: 0,
    },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'backorder'],
      default: 'in_stock',
    },
    weight: {
      type: Number,
      min: 0,
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    shippingClass: String,
    description: String,
    attributeSelections: {
      type: Map,
      of: String,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
)

export const Variation = mongoose.models.Variation || mongoose.model<IVariation>('Variation', variationSchema)
