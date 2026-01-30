import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

// Address schema
export const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postcode: z.string().min(1, 'Postcode is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().optional(),
})

// Product schemas
export const createProductSchema = z.object({
  title: z.string().min(1, 'Product title is required'),
  slug: z.string().optional(),
  status: z.enum(['draft', 'published', 'private']).default('draft'),
  visibility: z.enum(['visible', 'catalog', 'search', 'hidden']).default('visible'),
  featured: z.boolean().default(false),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  featuredImage: z.string().url().optional(),
  gallery: z.array(z.string().url()).optional().default([]),
  regularPrice: z.number().min(0, 'Price must be positive'),
  salePrice: z.number().min(0).optional(),
  saleStart: z.string().datetime().optional(),
  saleEnd: z.string().datetime().optional(),
  type: z.enum(['simple', 'variable']).default('simple'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  soldIndividually: z.boolean().default(false),
  manageStock: z.boolean().default(false),
  stockQty: z.number().int().min(0).optional(),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'backorder']).default('in_stock'),
  lowStockThreshold: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  dimensions: z
    .object({
      length: z.number().min(0).optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
    })
    .optional(),
  shippingClass: z.string().optional(),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  attributes: z
    .array(
      z.object({
        attributeId: z.string(),
        name: z.string(),
        values: z.array(z.string()),
        usedForVariations: z.boolean().default(false),
        visibleOnProductPage: z.boolean().default(true),
        position: z.number().int().default(0),
      })
    )
    .optional()
    .default([]),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

// Update schema - all fields optional
// Title is optional for updates - empty strings are allowed (will be handled in controller)
// Attributes schema is more lenient for updates to handle various data formats
export const updateProductSchema = createProductSchema.partial().extend({
  title: z.string().or(z.literal('')).optional(),
  attributes: z
    .array(
      z.object({
        attributeId: z.union([z.string(), z.any()]).optional(), // Allow string or any (for object conversion)
        name: z.string().optional(), // Make name optional
        values: z.array(z.union([z.string(), z.any()])).optional().default([]), // Allow any values and make optional
        usedForVariations: z.boolean().optional().default(false),
        visibleOnProductPage: z.boolean().optional().default(true),
        position: z.number().int().optional().default(0),
      })
    )
    .optional()
    .default([]),
})

// Schema for saving only attributes (like WooCommerce)
export const saveAttributesSchema = z.object({
  attributes: z
    .array(
      z.object({
        attributeId: z.string(),
        name: z.string(),
        values: z.array(z.string()),
        usedForVariations: z.boolean().default(false),
        visibleOnProductPage: z.boolean().default(true),
        position: z.number().int().default(0),
      })
    )
    .optional()
    .default([]),
  type: z.enum(['simple', 'variable']).optional(), // Also save product type
})

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  displayType: z.enum(['default', 'products', 'subcategories', 'both']).default('default'),
  sortOrder: z.number().int().default(0),
})

export const updateCategorySchema = createCategorySchema.partial()

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
})

export const updateTagSchema = createTagSchema.partial()

// Attribute schemas
export const createAttributeSchema = z.object({
  name: z.string().min(1, 'Attribute name is required'),
  slug: z.string().optional(),
  type: z.enum(['select', 'colour', 'image', 'button', 'radio']).default('select'),
  orderBy: z.enum(['menu_order', 'name', 'id']).default('menu_order'),
  hasArchives: z.boolean().default(true),
})

export const updateAttributeSchema = createAttributeSchema.partial()

export const createAttributeTermSchema = z.object({
  name: z.string().min(1, 'Term name is required'),
  slug: z.string().optional(),
  sortOrder: z.number().int().default(0),
})

export const updateAttributeTermSchema = createAttributeTermSchema.partial()

// Coupon schemas
export const createCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').toUpperCase(),
  type: z.enum(['percent', 'fixed_cart']),
  amount: z.number().min(0, 'Amount must be positive'),
  description: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  usageLimit: z.number().int().min(1).optional(),
  usageLimitPerUser: z.number().int().min(1).optional(),
  minSpend: z.number().min(0).optional(),
  maxSpend: z.number().min(0).optional(),
  includeProductIds: z.array(z.string()).default([]),
  excludeProductIds: z.array(z.string()).default([]),
  includeCategoryIds: z.array(z.string()).default([]),
  excludeCategoryIds: z.array(z.string()).default([]),
})

export const updateCouponSchema = createCouponSchema.partial()

// Review schemas
export const createReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10, 'Review must be at least 10 characters'),
  authorName: z.string().min(1, 'Name is required'),
  authorEmail: z.string().email('Invalid email'),
})

// Cart schemas
export const addToCartSchema = z.object({
  productId: z.string(),
  variationId: z.string().optional(),
  qty: z.number().int().min(1).default(1),
})

export const updateCartItemSchema = z.object({
  qty: z.number().int().min(0),
})

// Checkout schema
export const createOrderSchema = z.object({
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  shippingMethodId: z.string(),
  paymentMethodId: z.string(),
  customerNotes: z.string().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
export type CreateAttributeInput = z.infer<typeof createAttributeSchema>
export type UpdateAttributeInput = z.infer<typeof updateAttributeSchema>
export type CreateAttributeTermInput = z.infer<typeof createAttributeTermSchema>
export type UpdateAttributeTermInput = z.infer<typeof updateAttributeTermSchema>
export type CreateCouponInput = z.infer<typeof createCouponSchema>
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
