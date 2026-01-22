import mongoose, { Schema, Document } from 'mongoose'

export interface ICategory extends Document {
  name: string
  slug: string
  parentId?: mongoose.Types.ObjectId
  description?: string
  image?: string
  displayType: 'default' | 'products' | 'subcategories' | 'both'
  sortOrder: number
  count: number
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    description: String,
    image: String,
    displayType: {
      type: String,
      enum: ['default', 'products', 'subcategories', 'both'],
      default: 'default',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Auto-generate slug from name if not provided
categorySchema.pre('save', async function (next) {
  if (!this.slug && this.name) {
    const { slugify } = await import('@ecommerce/shared')
    this.slug = slugify(this.name)
    
    // Ensure uniqueness
    const count = await mongoose.models.Category?.countDocuments({ slug: this.slug, _id: { $ne: this._id } })
    if (count && count > 0) {
      this.slug = `${this.slug}-${Date.now()}`
    }
  }
  next()
})

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema)
