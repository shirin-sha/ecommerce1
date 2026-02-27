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

// Product schemas have been removed while product APIs/forms are being redesigned.

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
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
