export const JWT_ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
export const BCRYPT_SALT_ROUNDS = 10

export const ORDER_STATUSES = [
  'pending_payment',
  'processing',
  'on_hold',
  'completed',
  'cancelled',
  'refunded',
  'failed',
] as const

export const USER_ROLES = ['admin', 'shop_manager', 'staff', 'customer'] as const

export const PRODUCT_STATUSES = ['draft', 'published', 'private'] as const

export const STOCK_STATUSES = ['in_stock', 'out_of_stock', 'backorder'] as const

export const REVIEW_STATUSES = ['pending', 'approved', 'spam', 'trash'] as const

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
