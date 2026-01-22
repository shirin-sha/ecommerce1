import mongoose, { Schema, Document } from 'mongoose'

export interface ITag extends Document {
  name: string
  slug: string
  description?: string
  count: number
  createdAt: Date
  updatedAt: Date
}

const tagSchema = new Schema<ITag>(
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
    description: String,
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
tagSchema.pre('save', async function (next) {
  if (!this.slug && this.name) {
    const { slugify } = await import('@ecommerce/shared')
    this.slug = slugify(this.name)
    
    // Ensure uniqueness
    const count = await mongoose.models.Tag?.countDocuments({ slug: this.slug, _id: { $ne: this._id } })
    if (count && count > 0) {
      this.slug = `${this.slug}-${Date.now()}`
    }
  }
  next()
})

export const Tag = mongoose.models.Tag || mongoose.model<ITag>('Tag', tagSchema)
