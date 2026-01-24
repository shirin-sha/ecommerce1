import mongoose, { Schema, Document } from 'mongoose'
import { ProductStatus, ProductVisibility, StockStatus, ProductType } from '@ecommerce/shared'

export interface IProduct extends Document {
  title: string
  slug: string
  status: ProductStatus
  visibility: ProductVisibility
  featured: boolean
  shortDescription?: string
  description?: string
  featuredImage?: string
  gallery: string[]
  regularPrice: number
  salePrice?: number
  saleStart?: Date
  saleEnd?: Date
  type: ProductType
  sku?: string
  barcode?: string
  soldIndividually?: boolean
  manageStock: boolean
  stockQty?: number
  stockStatus: StockStatus
  lowStockThreshold?: number
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  shippingClass?: string
  categoryIds: mongoose.Types.ObjectId[]
  tagIds: mongoose.Types.ObjectId[]
  attributes: {
    attributeId: mongoose.Types.ObjectId
    name: string
    values: string[]
    usedForVariations: boolean
    visibleOnProductPage: boolean
    position: number
  }[]
  variationIds: mongoose.Types.ObjectId[]
  avgRating: number
  reviewCount: number
  metaTitle?: string
  metaDescription?: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: false, // Will be auto-generated from title if not provided
      unique: true,
      sparse: true, // Allow multiple null values for uniqueness
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'private'],
      default: 'draft',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['visible', 'catalog', 'search', 'hidden'],
      default: 'visible',
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    shortDescription: String,
    description: String,
    featuredImage: String,
    gallery: {
      type: [String],
      default: [],
    },
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
    type: {
      type: String,
      enum: ['simple', 'variable'],
      default: 'simple',
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    barcode: String,
    soldIndividually: {
      type: Boolean,
      default: false,
    },
    manageStock: {
      type: Boolean,
      default: false,
    },
    stockQty: {
      type: Number,
      min: 0,
    },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'backorder'],
      default: 'in_stock',
      index: true,
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
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
    categoryIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        index: true,
      },
    ],
    tagIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    attributes: [
      {
        attributeId: {
          type: Schema.Types.ObjectId,
          ref: 'Attribute',
        },
        name: String,
        values: [String],
        usedForVariations: Boolean,
        visibleOnProductPage: Boolean,
        position: Number,
      },
    ],
    variationIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Variation',
      },
    ],
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    metaTitle: String,
    metaDescription: String,
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
)

// Indexes for performance
productSchema.index({ status: 1, visibility: 1 })
productSchema.index({ categoryIds: 1, status: 1 })
productSchema.index({ featured: 1, status: 1 })
productSchema.index({ 'regularPrice': 1 })
productSchema.index({ createdAt: -1 })

// Auto-generate slug from title if not provided
productSchema.pre('save', async function (next) {
  // Always ensure slug exists - generate from title if missing
  if (!this.slug || this.slug.trim() === '') {
    if (!this.title || this.title.trim() === '') {
      return next(new Error('Product title is required to generate slug'))
    }
    const { slugify } = await import('@ecommerce/shared')
    this.slug = slugify(this.title)
  }
  
  // Ensure uniqueness
  if (this.isNew || this.isModified('slug')) {
    let uniqueSlug = this.slug
    let counter = 1
    let exists = await mongoose.models.Product?.countDocuments({ slug: uniqueSlug, _id: { $ne: this._id } })
    
    while (exists && exists > 0) {
      uniqueSlug = `${this.slug}-${counter}`
      exists = await mongoose.models.Product?.countDocuments({ slug: uniqueSlug, _id: { $ne: this._id } })
      counter++
    }
    
    this.slug = uniqueSlug
  }

  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }

  next()
})

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema)
