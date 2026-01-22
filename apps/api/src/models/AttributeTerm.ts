import mongoose, { Schema, Document } from 'mongoose'

export interface IAttributeTerm extends Document {
  attributeId: mongoose.Types.ObjectId
  name: string
  slug: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const attributeTermSchema = new Schema<IAttributeTerm>(
  {
    attributeId: {
      type: Schema.Types.ObjectId,
      ref: 'Attribute',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Compound unique index on attributeId + slug
attributeTermSchema.index({ attributeId: 1, slug: 1 }, { unique: true })

// Auto-generate slug from name if not provided
attributeTermSchema.pre('save', async function (next) {
  if (!this.slug && this.name) {
    const { slugify } = await import('@ecommerce/shared')
    this.slug = slugify(this.name)
  }
  next()
})

export const AttributeTerm = mongoose.models.AttributeTerm || mongoose.model<IAttributeTerm>('AttributeTerm', attributeTermSchema)
