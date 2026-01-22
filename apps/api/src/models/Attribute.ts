import mongoose, { Schema, Document } from 'mongoose'

export interface IAttribute extends Document {
  name: string
  slug: string
  type: 'select'
  orderBy: 'menu_order' | 'name' | 'id'
  hasArchives: boolean
  createdAt: Date
  updatedAt: Date
}

const attributeSchema = new Schema<IAttribute>(
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
    type: {
      type: String,
      enum: ['select'],
      default: 'select',
    },
    orderBy: {
      type: String,
      enum: ['menu_order', 'name', 'id'],
      default: 'menu_order',
    },
    hasArchives: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Auto-generate slug from name if not provided
attributeSchema.pre('save', async function (next) {
  if (!this.slug && this.name) {
    const { slugify } = await import('@ecommerce/shared')
    this.slug = slugify(this.name)
    
    // Ensure uniqueness
    const count = await mongoose.models.Attribute?.countDocuments({ slug: this.slug, _id: { $ne: this._id } })
    if (count && count > 0) {
      this.slug = `${this.slug}-${Date.now()}`
    }
  }
  next()
})

export const Attribute = mongoose.models.Attribute || mongoose.model<IAttribute>('Attribute', attributeSchema)
