// User & Auth types
export type UserRole = 'admin' | 'shop_manager' | 'staff' | 'customer'

export interface User {
  _id: string
  email: string
  name: string
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
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state?: string
  postcode: string
  country: string
  phone?: string
}

// Product types
export type ProductType = 'simple' | 'variable'
export type ProductStatus = 'draft' | 'published' | 'private'
export type ProductVisibility = 'visible' | 'catalog' | 'search' | 'hidden'
export type StockStatus = 'in_stock' | 'out_of_stock' | 'backorder'

export interface Product {
  _id: string
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
  categoryIds: string[]
  tagIds: string[]
  attributes: ProductAttribute[]
  variationIds: string[]
  avgRating: number
  reviewCount: number
  metaTitle?: string
  metaDescription?: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface ProductAttribute {
  attributeId: string
  name: string
  values: string[]
  usedForVariations: boolean
  visibleOnProductPage: boolean
  position: number
}

export interface Variation {
  _id: string
  productId: string
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

// Category, Tag, Attribute types
export interface Category {
  _id: string
  name: string
  slug: string
  parentId?: string
  description?: string
  image?: string
  displayType: 'default' | 'products' | 'subcategories' | 'both'
  sortOrder: number
  count: number
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  _id: string
  name: string
  slug: string
  description?: string
  count: number
  createdAt: Date
  updatedAt: Date
}

export interface Attribute {
  _id: string
  name: string
  slug: string
  type: 'select'
  orderBy: 'menu_order' | 'name' | 'id'
  hasArchives: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AttributeTerm {
  _id: string
  attributeId: string
  name: string
  slug: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

// Order types
export type OrderStatus =
  | 'pending_payment'
  | 'processing'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface Order {
  _id: string
  orderNumber: string
  status: OrderStatus
  customerId?: string
  customerEmail: string
  customerName: string
  billingAddress: Address
  shippingAddress: Address
  items: OrderItem[]
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
  couponCodes: string[]
  discounts: OrderDiscount[]
  shippingMethod: {
    zoneId?: string
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
  notes: OrderNote[]
  events: OrderEvent[]
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

export interface OrderItem {
  productId: string
  variationId?: string
  nameSnapshot: string
  skuSnapshot?: string
  price: number
  qty: number
  subtotal: number
  total: number
}

export interface OrderDiscount {
  couponCode: string
  amount: number
}

export interface OrderNote {
  content: string
  isCustomerNote: boolean
  createdBy: string
  createdAt: Date
}

export interface OrderEvent {
  type: 'status_change' | 'payment' | 'note' | 'email_sent'
  description: string
  userId?: string
  createdAt: Date
}

// Coupon types
export type CouponType = 'percent' | 'fixed_cart'

export interface Coupon {
  _id: string
  code: string
  type: CouponType
  amount: number
  description?: string
  expiryDate?: Date
  usageLimit?: number
  usageLimitPerUser?: number
  minSpend?: number
  maxSpend?: number
  includeProductIds: string[]
  excludeProductIds: string[]
  includeCategoryIds: string[]
  excludeCategoryIds: string[]
  usageCount: number
  usedBy: Array<{
    userId?: string
    orderIds: string[]
  }>
  createdAt: Date
  updatedAt: Date
}

// Review types
export type ReviewStatus = 'pending' | 'approved' | 'spam' | 'trash'

export interface Review {
  _id: string
  productId: string
  customerId?: string
  authorName: string
  authorEmail: string
  rating: number
  content: string
  status: ReviewStatus
  isVerifiedOwner: boolean
  replies: ReviewReply[]
  createdAt: Date
  updatedAt: Date
}

export interface ReviewReply {
  content: string
  userId: string
  createdAt: Date
}

// Settings types
export interface Settings {
  _id: string
  general: GeneralSettings
  products: ProductSettings
  inventory: InventorySettings
  shipping: ShippingSettings
  payments: PaymentSettings
  emails: EmailSettings
  siteVisibility: 'coming_soon' | 'live'
  tracking: TrackingSettings
  updatedAt: Date
}

export interface GeneralSettings {
  storeName: string
  storeAddress: Address
  currency: string
  currencyPosition: 'left' | 'right' | 'left_space' | 'right_space'
  thousandSeparator: string
  decimalSeparator: string
  numDecimals: number
  sellingLocations: string[]
  shippingLocations: string[]
  defaultCustomerLocation: string
  enableTaxes: boolean
  enableCoupons: boolean
}

export interface ProductSettings {
  shopRoute: string
  ajaxAddToCart: boolean
  weightUnit: 'kg' | 'g' | 'lbs' | 'oz'
  dimensionUnit: 'cm' | 'm' | 'mm' | 'in' | 'yd'
  reviewsEnabled: boolean
  verifiedOwnerLabel: boolean
  verifiedOwnerOnly: boolean
  enableRatings: boolean
  ratingsRequired: boolean
}

export interface InventorySettings {
  enableStockMgmt: boolean
  holdStockMinutes: number
  lowStockThreshold: number
  outOfStockThreshold: number
  notificationEmails: string[]
  hideOutOfStock: boolean
  stockDisplayFormat: 'always' | 'low_stock' | 'never'
  enableLowStockNotifications: boolean
  enableOutOfStockNotifications: boolean
}

export interface ShippingSettings {
  zones: ShippingZone[]
}

export interface ShippingZone {
  _id: string
  name: string
  regions: string[]
  methods: ShippingMethod[]
}

export interface ShippingMethod {
  type: 'flat_rate' | 'free_shipping' | 'local_pickup'
  title: string
  cost?: number
  enabled: boolean
}

export interface PaymentSettings {
  providers: PaymentProvider[]
}

export interface PaymentProvider {
  id: string
  enabled: boolean
  title: string
  description?: string
  sandbox: boolean
  credentials: Record<string, string>
}

export interface EmailSettings {
  fromName: string
  fromEmail: string
  templates: EmailTemplates
  style: EmailStyle
}

export interface EmailTemplates {
  newOrder: { enabled: boolean; recipients: string[] }
  cancelledOrder: { enabled: boolean; recipients: string[] }
  failedOrder: { enabled: boolean; recipients: string[] }
  orderOnHold: { enabled: boolean }
  processingOrder: { enabled: boolean }
  completedOrder: { enabled: boolean }
  refundedOrder: { enabled: boolean }
  customerNote: { enabled: boolean }
  resetPassword: { enabled: boolean }
  newAccount: { enabled: boolean }
}

export interface EmailStyle {
  headerImage?: string
  baseColor: string
  backgroundColor: string
  bodyBackgroundColor: string
  bodyTextColor: string
  footerText?: string
  footerTextColor: string
}

export interface TrackingSettings {
  ga4MeasurementId?: string
  metaPixelId?: string
  tiktokPixelId?: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
