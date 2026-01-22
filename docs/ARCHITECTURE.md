# E-Commerce Platform - Architecture Specification

> **Production-Grade Single-Vendor E-Commerce Platform**  
> Inspired by WooCommerce workflows, built with modern tech stack

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Monorepo Structure](#monorepo-structure)
4. [Data Model](#data-model)
5. [API Routes](#api-routes)
6. [Admin Routes](#admin-routes)
7. [Storefront Routes](#storefront-routes)
8. [Component Strategy](#component-strategy)
9. [Authentication & Authorization](#authentication--authorization)
10. [Payment Provider Architecture](#payment-provider-architecture)
11. [Email & Notifications](#email--notifications)
12. [Analytics & Tracking](#analytics--tracking)
13. [Environment Variables](#environment-variables)
14. [Development Milestones](#development-milestones)
15. [UI Parity Checklist](#ui-parity-checklist)

---

## Project Overview

### Goals
- **Single-vendor e-commerce platform** with complete order-to-delivery workflow
- **WooCommerce-inspired UX** for admin dashboard (but NOT a WordPress clone)
- **Production-ready** with TypeScript, clean architecture, and modular design
- **Essential features only** - no plugin marketplace, no bloated settings

### Non-Goals
- Multi-vendor marketplace
- Extension/module system
- Advanced settings or status screens (unless critical)
- WordPress/WooCommerce code dependencies

---

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (access + refresh tokens) + bcrypt
- **Validation**: Zod schemas
- **File Upload**: Local storage (dev), pluggable interface for S3/Cloudinary
- **Email**: Nodemailer + simple retry queue (Mongo-based or BullMQ/Redis optional)
- **Rate Limiting**: express-rate-limit
- **Security**: Helmet, CORS, input sanitization

### DevOps
- **Package Manager**: pnpm workspaces
- **Containerization**: Docker + Docker Compose
- **Database**: MongoDB (Docker container for local dev)

---

## Monorepo Structure

```
ecommerce1/
├── apps/
│   ├── api/                    # Backend API (Express + TS + Mongoose)
│   │   ├── src/
│   │   │   ├── config/         # DB, env, constants
│   │   │   ├── models/         # Mongoose schemas
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── controllers/    # Business logic
│   │   │   ├── middleware/     # Auth, RBAC, validation, error handling
│   │   │   ├── services/       # Payment, email, analytics
│   │   │   ├── utils/          # Helpers
│   │   │   └── server.ts       # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── storefront/             # Customer-facing app (React + TS + Vite)
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Route pages
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # API client, utils
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── admin/                  # Admin dashboard (React + TS + Vite)
│       ├── src/
│       │   ├── components/     # Tables, forms, charts
│       │   ├── pages/          # Admin pages (Dashboard, Orders, Products, etc.)
│       │   ├── hooks/
│       │   ├── lib/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                 # Shared types, schemas, utilities
│       ├── src/
│       │   ├── types/          # TypeScript interfaces
│       │   ├── schemas/        # Zod validation schemas
│       │   └── utils/          # Shared utilities
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # This file
│   ├── API.md                  # API documentation
│   ├── SETUP.md                # Setup guide
│   └── woocommerce-reference/  # Reference screenshots
│
├── docker-compose.yml          # MongoDB + API services
├── package.json                # Root package.json (pnpm workspace)
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

---

## Data Model

### User
```typescript
{
  _id: ObjectId
  email: string (unique, indexed)
  name: string
  passwordHash: string
  role: 'admin' | 'shop_manager' | 'staff' | 'customer'
  isActive: boolean (default: true)
  phone?: string
  addresses: {
    billing?: Address
    shipping?: Address
  }
  // Customer-specific stats (denormalized for performance)
  ordersCount: number (default: 0)
  totalSpend: number (default: 0)
  avgOrderValue: number (default: 0)
  lastActiveAt?: Date
  lastLoginAt?: Date
  // Optional 2FA
  twoFactorEnabled: boolean (default: false)
  twoFactorSecret?: string
  createdAt: Date
  updatedAt: Date
}

interface Address {
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
```

### Product
```typescript
{
  _id: ObjectId
  title: string (indexed)
  slug: string (unique, indexed)
  status: 'draft' | 'published' | 'private' (indexed)
  visibility: 'visible' | 'catalog' | 'search' | 'hidden'
  featured: boolean (default: false, indexed)
  
  // Content
  shortDescription?: string
  description?: string (HTML)
  
  // Media
  featuredImage?: string (URL or path)
  gallery: string[] (URLs or paths)
  
  // Pricing
  regularPrice: number
  salePrice?: number
  saleStart?: Date
  saleEnd?: Date
  
  // Inventory
  type: 'simple' | 'variable'
  sku?: string (unique, indexed)
  barcode?: string
  manageStock: boolean (default: false)
  stockQty?: number
  stockStatus: 'in_stock' | 'out_of_stock' | 'backorder' (default: 'in_stock')
  lowStockThreshold?: number
  
  // Shipping
  weight?: number
  dimensions?: { length: number, width: number, height: number }
  shippingClass?: string
  
  // Taxonomy
  categoryIds: ObjectId[] (indexed)
  tagIds: ObjectId[]
  
  // Attributes & Variations
  attributes: {
    attributeId: ObjectId
    name: string
    values: string[]
    usedForVariations: boolean
    visibleOnProductPage: boolean
    position: number
  }[]
  variationIds: ObjectId[] (only for type: 'variable')
  
  // Reviews summary (denormalized)
  avgRating: number (default: 0)
  reviewCount: number (default: 0)
  
  // SEO
  metaTitle?: string
  metaDescription?: string
  
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}
```

### Variation (Product Variation)
```typescript
{
  _id: ObjectId
  productId: ObjectId (indexed)
  sku?: string (unique, indexed)
  image?: string
  
  // Pricing
  regularPrice: number
  salePrice?: number
  saleStart?: Date
  saleEnd?: Date
  
  // Inventory
  stockQty?: number
  stockStatus: 'in_stock' | 'out_of_stock' | 'backorder'
  
  // Shipping
  weight?: number
  dimensions?: { length: number, width: number, height: number }
  
  // Attribute selections (e.g., { "Size": "Large", "Color": "Red" })
  attributeSelections: Record<string, string>
  
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}
```

### Category
```typescript
{
  _id: ObjectId
  name: string
  slug: string (unique, indexed)
  parentId?: ObjectId (indexed)
  description?: string
  image?: string
  displayType: 'default' | 'products' | 'subcategories' | 'both'
  sortOrder: number (default: 0)
  count: number (denormalized, default: 0)
  createdAt: Date
  updatedAt: Date
}
```

### Tag
```typescript
{
  _id: ObjectId
  name: string
  slug: string (unique, indexed)
  description?: string
  count: number (denormalized, default: 0)
  createdAt: Date
  updatedAt: Date
}
```

### Attribute
```typescript
{
  _id: ObjectId
  name: string (e.g., "Size", "Color", "Weight")
  slug: string (unique, indexed)
  type: 'select' (future: 'text', 'color')
  orderBy: 'menu_order' | 'name' | 'id'
  hasArchives: boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

### AttributeTerm
```typescript
{
  _id: ObjectId
  attributeId: ObjectId (indexed)
  name: string (e.g., "Small", "Medium", "Large")
  slug: string (indexed, compound unique with attributeId)
  sortOrder: number (default: 0)
  createdAt: Date
  updatedAt: Date
}
```

### Order
```typescript
{
  _id: ObjectId
  orderNumber: string (unique, indexed)
  status: 'pending_payment' | 'processing' | 'on_hold' | 'completed' | 'cancelled' | 'refunded' | 'failed' (indexed)
  
  // Customer
  customerId?: ObjectId (indexed, nullable for guest orders)
  customerEmail: string (indexed)
  customerName: string
  
  // Addresses
  billingAddress: Address
  shippingAddress: Address
  
  // Items
  items: {
    productId: ObjectId
    variationId?: ObjectId
    nameSnapshot: string
    skuSnapshot?: string
    price: number
    qty: number
    subtotal: number
    total: number
  }[]
  
  // Totals
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
  
  // Coupons
  couponCodes: string[]
  discounts: {
    couponCode: string
    amount: number
  }[]
  
  // Shipping
  shippingMethod: {
    zoneId?: ObjectId
    method: string
    cost: number
  }
  
  // Payment
  payment: {
    provider: string (e.g., 'paypal', 'myfatoorah', 'cod')
    methodTitle: string
    transactionId?: string
    paidAt?: Date
    status: 'pending' | 'completed' | 'failed' | 'refunded'
  }
  
  // Notes
  notes: {
    content: string
    isCustomerNote: boolean
    createdBy: ObjectId
    createdAt: Date
  }[]
  
  // Timeline/Events
  events: {
    type: 'status_change' | 'payment' | 'note' | 'email_sent'
    description: string
    userId?: ObjectId
    createdAt: Date
  }[]
  
  // Analytics
  attribution?: {
    source: string (e.g., 'direct', 'organic', 'referral', 'social')
    medium?: string
    campaign?: string
    referrer?: string
  }
  
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}
```

### Coupon
```typescript
{
  _id: ObjectId
  code: string (unique, uppercase, indexed)
  type: 'percent' | 'fixed_cart'
  amount: number
  description?: string
  
  // Restrictions
  expiryDate?: Date
  usageLimit?: number
  usageLimitPerUser?: number
  minSpend?: number
  maxSpend?: number
  includeProductIds: ObjectId[]
  excludeProductIds: ObjectId[]
  includeCategoryIds: ObjectId[]
  excludeCategoryIds: ObjectId[]
  
  // Usage tracking
  usageCount: number (default: 0)
  usedBy: { userId?: ObjectId, orderIds: ObjectId[] }[]
  
  createdAt: Date
  updatedAt: Date
}
```

### Review
```typescript
{
  _id: ObjectId
  productId: ObjectId (indexed)
  customerId?: ObjectId (indexed, nullable for guest)
  authorName: string
  authorEmail: string
  rating: number (1-5)
  content: string
  status: 'pending' | 'approved' | 'spam' | 'trash' (indexed)
  isVerifiedOwner: boolean (default: false)
  replies: {
    content: string
    userId: ObjectId
    createdAt: Date
  }[]
  createdAt: Date
  updatedAt: Date
}
```

### Settings (Single Document)
```typescript
{
  _id: ObjectId (singleton)
  
  // General
  general: {
    storeName: string
    storeAddress: Address
    currency: string (default: 'USD')
    currencyPosition: 'left' | 'right' | 'left_space' | 'right_space'
    thousandSeparator: string (default: ',')
    decimalSeparator: string (default: '.')
    numDecimals: number (default: 2)
    sellingLocations: string[] (country codes, 'all')
    shippingLocations: string[] (country codes, 'all')
    defaultCustomerLocation: string
    enableTaxes: boolean (default: false)
    enableCoupons: boolean (default: true)
  }
  
  // Products
  products: {
    shopRoute: string (default: '/shop')
    ajaxAddToCart: boolean (default: false)
    weightUnit: 'kg' | 'g' | 'lbs' | 'oz'
    dimensionUnit: 'cm' | 'm' | 'mm' | 'in' | 'yd'
    reviewsEnabled: boolean (default: true)
    verifiedOwnerLabel: boolean (default: true)
    verifiedOwnerOnly: boolean (default: false)
    enableRatings: boolean (default: true)
    ratingsRequired: boolean (default: false)
  }
  
  // Inventory
  inventory: {
    enableStockMgmt: boolean (default: true)
    holdStockMinutes: number (default: 60)
    lowStockThreshold: number (default: 2)
    outOfStockThreshold: number (default: 0)
    notificationEmails: string[]
    hideOutOfStock: boolean (default: false)
    stockDisplayFormat: 'always' | 'low_stock' | 'never'
    enableLowStockNotifications: boolean (default: true)
    enableOutOfStockNotifications: boolean (default: true)
  }
  
  // Shipping
  shipping: {
    zones: {
      _id: ObjectId
      name: string
      regions: string[] (country codes or 'rest_of_world')
      methods: {
        type: 'flat_rate' | 'free_shipping' | 'local_pickup'
        title: string
        cost?: number
        enabled: boolean
      }[]
    }[]
  }
  
  // Payments
  payments: {
    providers: {
      id: string (e.g., 'paypal', 'myfatoorah', 'tap', 'cod')
      enabled: boolean
      title: string
      description?: string
      sandbox: boolean
      credentials: Record<string, string> (e.g., apiKey, merchantId)
    }[]
  }
  
  // Emails
  emails: {
    fromName: string
    fromEmail: string
    templates: {
      newOrder: { enabled: boolean, recipients: string[] }
      cancelledOrder: { enabled: boolean, recipients: string[] }
      failedOrder: { enabled: boolean, recipients: string[] }
      orderOnHold: { enabled: boolean }
      processingOrder: { enabled: boolean }
      completedOrder: { enabled: boolean }
      refundedOrder: { enabled: boolean }
      customerNote: { enabled: boolean }
      resetPassword: { enabled: boolean }
      newAccount: { enabled: boolean }
    }
    style: {
      headerImage?: string
      baseColor: string (default: '#96588a')
      backgroundColor: string (default: '#f7f7f7')
      bodyBackgroundColor: string (default: '#ffffff')
      bodyTextColor: string (default: '#3c3c3c')
      footerText?: string
      footerTextColor: string (default: '#3c3c3c')
    }
  }
  
  // Site Visibility
  siteVisibility: 'coming_soon' | 'live' (default: 'live')
  
  // Tracking / Analytics
  tracking: {
    ga4MeasurementId?: string
    metaPixelId?: string
    tiktokPixelId?: string
  }
  
  updatedAt: Date
}
```

---

## API Routes

All API routes are prefixed with `/api/v1`

### Authentication & Users
```
POST   /api/v1/auth/register              # Register new customer
POST   /api/v1/auth/login                 # Login (customer or admin)
POST   /api/v1/auth/logout                # Logout
POST   /api/v1/auth/refresh               # Refresh access token
GET    /api/v1/auth/me                    # Get current user
POST   /api/v1/auth/forgot-password       # Request password reset
POST   /api/v1/auth/reset-password        # Reset password with token

GET    /api/v1/users                      # List users (admin only)
POST   /api/v1/users                      # Create user (admin only)
GET    /api/v1/users/:id                  # Get user by ID
PATCH  /api/v1/users/:id                  # Update user
DELETE /api/v1/users/:id                  # Disable/delete user (admin)
PATCH  /api/v1/users/:id/role             # Change user role (admin)
```

### Products
```
GET    /api/v1/products                   # List/search products (with filters)
POST   /api/v1/products                   # Create product (admin)
GET    /api/v1/products/:id               # Get product by ID
PATCH  /api/v1/products/:id               # Update product (admin)
DELETE /api/v1/products/:id               # Delete product (admin)
POST   /api/v1/products/:id/images        # Upload product images (admin)
DELETE /api/v1/products/:id/images/:index # Remove product image (admin)

# Variations
GET    /api/v1/products/:id/variations           # List variations
POST   /api/v1/products/:id/variations           # Create variation
POST   /api/v1/products/:id/variations/generate  # Generate variations from attributes
PATCH  /api/v1/products/:id/variations/:varId    # Update variation
DELETE /api/v1/products/:id/variations/:varId    # Delete variation
```

### Categories, Tags, Attributes
```
GET    /api/v1/categories                 # List categories
POST   /api/v1/categories                 # Create category (admin)
GET    /api/v1/categories/:id             # Get category
PATCH  /api/v1/categories/:id             # Update category (admin)
DELETE /api/v1/categories/:id             # Delete category (admin)
POST   /api/v1/categories/:id/image       # Upload category image (admin)

GET    /api/v1/tags                       # List tags
POST   /api/v1/tags                       # Create tag (admin)
GET    /api/v1/tags/:id                   # Get tag
PATCH  /api/v1/tags/:id                   # Update tag (admin)
DELETE /api/v1/tags/:id                   # Delete tag (admin)

GET    /api/v1/attributes                 # List attributes
POST   /api/v1/attributes                 # Create attribute (admin)
GET    /api/v1/attributes/:id             # Get attribute
PATCH  /api/v1/attributes/:id             # Update attribute (admin)
DELETE /api/v1/attributes/:id             # Delete attribute (admin)

GET    /api/v1/attributes/:id/terms       # List attribute terms
POST   /api/v1/attributes/:id/terms       # Create term (admin)
PATCH  /api/v1/attributes/:id/terms/:termId  # Update term (admin)
DELETE /api/v1/attributes/:id/terms/:termId  # Delete term (admin)
```

### Cart
```
GET    /api/v1/cart                       # Get cart (session or user)
POST   /api/v1/cart/items                 # Add item to cart
PATCH  /api/v1/cart/items/:itemId         # Update item quantity
DELETE /api/v1/cart/items/:itemId         # Remove item from cart
DELETE /api/v1/cart                       # Clear cart
POST   /api/v1/cart/apply-coupon          # Apply coupon code
DELETE /api/v1/cart/remove-coupon/:code   # Remove coupon
```

### Checkout & Orders
```
POST   /api/v1/checkout/calculate         # Calculate totals (shipping, tax, discounts)
POST   /api/v1/checkout/create-order      # Create order from cart
POST   /api/v1/checkout/payment-intent    # Create payment intent/token (for payment provider)

GET    /api/v1/orders                     # List orders (customer: own, admin: all)
GET    /api/v1/orders/:id                 # Get order details
PATCH  /api/v1/orders/:id/status          # Update order status (admin)
POST   /api/v1/orders/:id/notes           # Add note to order
POST   /api/v1/orders/:id/refund          # Process refund (admin)
POST   /api/v1/orders/:id/resend-email    # Resend order email (admin)
```

### Customers (Admin)
```
GET    /api/v1/customers                  # List customers with stats
GET    /api/v1/customers/:id              # Get customer details + order history
PATCH  /api/v1/customers/:id              # Update customer
```

### Coupons
```
GET    /api/v1/coupons                    # List coupons (admin)
POST   /api/v1/coupons                    # Create coupon (admin)
GET    /api/v1/coupons/:id                # Get coupon (admin)
PATCH  /api/v1/coupons/:id                # Update coupon (admin)
DELETE /api/v1/coupons/:id                # Delete coupon (admin)
POST   /api/v1/coupons/validate           # Validate coupon code (storefront)
```

### Reviews
```
GET    /api/v1/reviews                    # List reviews (with filters)
POST   /api/v1/reviews                    # Create review (customer)
GET    /api/v1/reviews/:id                # Get review
PATCH  /api/v1/reviews/:id                # Moderate review (admin: approve/spam/trash)
DELETE /api/v1/reviews/:id                # Delete review (admin)
POST   /api/v1/reviews/:id/reply          # Reply to review (admin)
```

### Reports
```
GET    /api/v1/reports/orders             # Orders report (date range, CSV export)
GET    /api/v1/reports/customers          # Customers report
GET    /api/v1/reports/stock              # Stock report (low/out/most stocked)
GET    /api/v1/reports/coupons            # Coupons usage report
```

### Analytics
```
GET    /api/v1/analytics/overview         # Overview KPIs + charts
GET    /api/v1/analytics/revenue          # Revenue analytics (with date comparison)
GET    /api/v1/analytics/orders           # Orders analytics (with attribution)
GET    /api/v1/analytics/products         # Products analytics
GET    /api/v1/analytics/categories       # Categories analytics
GET    /api/v1/analytics/coupons          # Coupons analytics
GET    /api/v1/analytics/stock            # Stock analytics
```

### Settings
```
GET    /api/v1/settings                   # Get all settings (admin)
PATCH  /api/v1/settings/general           # Update general settings (admin)
PATCH  /api/v1/settings/products          # Update products settings (admin)
PATCH  /api/v1/settings/inventory         # Update inventory settings (admin)
PATCH  /api/v1/settings/shipping          # Update shipping settings (admin)
PATCH  /api/v1/settings/payments          # Update payment settings (admin)
PATCH  /api/v1/settings/emails            # Update email settings (admin)
PATCH  /api/v1/settings/site-visibility   # Update site visibility (admin)
PATCH  /api/v1/settings/tracking          # Update tracking settings (admin)
```

### Payment Webhooks
```
POST   /api/v1/webhooks/paypal            # PayPal webhook handler
POST   /api/v1/webhooks/myfatoorah        # MyFatoorah webhook handler
POST   /api/v1/webhooks/tap               # Tap webhook handler
# ... (other payment providers)
```

---

## Admin Routes

All admin routes are under `/admin` and protected by auth + RBAC middleware.

### Dashboard & Home
```
/admin                              # Dashboard home (KPIs, charts, leaderboards)
```

### Orders
```
/admin/orders                       # Orders list (with filters, status tabs, bulk actions)
/admin/orders/:id                   # Order details (view, edit, status change, notes, refund)
```

### Customers
```
/admin/customers                    # Customers list (with stats: orders, spend, AOV, last active)
/admin/customers/:id                # Customer detail + order history
```

### Products
```
/admin/products                     # Products list (with filters)
/admin/products/new                 # Add new product
/admin/products/:id/edit            # Edit product
/admin/products/categories          # Manage categories
/admin/products/tags                # Manage tags
/admin/products/attributes          # Manage attributes
/admin/products/attributes/:id/terms # Manage attribute terms
```

### Reviews
```
/admin/reviews                      # Reviews moderation (tabs: All, Pending, Approved, Spam, Trash)
```

### Marketing
```
/admin/marketing/coupons            # Coupons list + create/edit
```

### Reports (Classic)
```
/admin/reports/orders               # Orders report with date range, chart, export CSV
/admin/reports/customers            # Customers report
/admin/reports/stocks               # Stock report (low/out/most stocked)
```

### Analytics (Modern)
```
/admin/analytics/overview           # Analytics overview (KPIs, charts, leaderboards)
/admin/analytics/revenue            # Revenue analytics (date comparison, table, download)
/admin/analytics/orders             # Orders analytics (with attribution column)
/admin/analytics/products           # Products analytics
/admin/analytics/categories         # Categories analytics
/admin/analytics/coupons            # Coupons analytics
/admin/analytics/stock              # Stock analytics
```

### Settings
```
/admin/settings/general             # General settings (store address, currency, taxes, coupons)
/admin/settings/products            # Products settings (shop page, units, reviews)
/admin/settings/inventory           # Inventory settings (stock mgmt, thresholds, notifications)
/admin/settings/shipping            # Shipping zones & methods
/admin/settings/payments            # Payment methods (enable/disable, configure)
/admin/settings/emails              # Email templates & sender options
/admin/settings/site-visibility     # Coming soon vs Live toggle
```

### Users
```
/admin/users                        # Users list (with role, 2FA status, last login)
```

---

## Storefront Routes

Customer-facing routes for shopping experience.

```
/                                   # Homepage
/shop                               # Products browse (search, filter, sort, pagination)
/products/:slug                     # Product detail page (gallery, variations, add to cart)
/cart                               # Shopping cart
/checkout                           # Checkout flow (address, shipping, payment)
/order-confirmation/:orderId        # Order confirmation page
/my-account                         # Customer account dashboard
/my-account/orders                  # Order history
/my-account/orders/:id              # Order details
/my-account/addresses               # Manage addresses
/my-account/profile                 # Edit profile
/login                              # Login page
/register                           # Register page
/forgot-password                    # Forgot password
/reset-password/:token              # Reset password with token
```

---

## Component Strategy

### Admin Components

#### Layout Components
- `AdminLayout` - Main layout with sidebar + header
- `Sidebar` - Left sidebar navigation (collapsible)
- `Header` - Top header with search, notifications, user menu

#### Table Components
- `DataTable` - Reusable table with TanStack Table (sorting, filtering, pagination)
- `BulkActions` - Bulk actions dropdown
- `TableFilters` - Filter dropdowns for tables
- `StatusBadge` - Status pill component (green, red, yellow, etc.)

#### Form Components
- `FormInput` - Text input with label + error
- `FormSelect` - Dropdown select
- `FormTextarea` - Textarea with label
- `FormCheckbox` - Checkbox with label
- `FormRadio` - Radio button
- `DateRangePicker` - Date range selector (for analytics)
- `ProductForm` - Complex product add/edit form
- `VariationForm` - Variation fields form
- `CategoryForm` - Category add/edit form
- `CouponForm` - Coupon add/edit form

#### Chart Components
- `LineChart` - Line chart for analytics
- `BarChart` - Bar chart
- `DonutChart` - Donut/pie chart
- `KPICard` - Card showing single metric with % change

#### Other Components
- `Modal` - Reusable modal/dialog
- `ConfirmDialog` - Confirmation dialog
- `ImageUpload` - Image upload with preview
- `RichTextEditor` - Rich text editor for product descriptions (Tiptap or similar)

### Storefront Components

#### Layout Components
- `StorefrontLayout` - Main layout with header + footer
- `Header` - Top navigation with logo, menu, search, cart icon
- `Footer` - Footer with links, social icons

#### Product Components
- `ProductCard` - Product card for grid/list view
- `ProductGallery` - Image gallery with zoom
- `ProductVariations` - Variation selector (dropdowns)
- `AddToCartButton` - Add to cart button with loading state
- `ReviewsList` - Product reviews list
- `ReviewForm` - Submit review form

#### Cart & Checkout Components
- `CartItem` - Single cart item row
- `CartSummary` - Cart totals summary
- `CouponInput` - Coupon code input
- `CheckoutForm` - Multi-step checkout form
- `AddressForm` - Address fields form
- `ShippingMethodSelector` - Radio buttons for shipping methods
- `PaymentMethodSelector` - Radio buttons for payment methods

---

## Authentication & Authorization

### JWT Strategy
- **Access Token**: Short-lived (15 min), stored in memory (React state)
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie
- **Flow**: On access token expiry, automatically refresh using refresh token

### Password Security
- Hashing: bcrypt with salt rounds = 10
- Password requirements: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number

### Roles & Permissions

| Role          | Permissions                                                                 |
|---------------|-----------------------------------------------------------------------------|
| **customer**  | View products, create orders, manage own profile/addresses, leave reviews   |
| **staff**     | View orders, update order status, view customers, add products              |
| **shop_manager** | All staff permissions + manage products, coupons, settings (except users) |
| **admin**     | Full access to all resources including users, settings, analytics           |

### RBAC Middleware
```typescript
// middleware/auth.ts
requireAuth()           // Ensures user is authenticated
requireRole(['admin', 'shop_manager'])  // Ensures user has one of specified roles
```

---

## Payment Provider Architecture

### Interface Design
```typescript
interface PaymentProvider {
  id: string
  name: string
  
  // Create payment intent/session
  createPayment(order: Order, settings: any): Promise<{
    redirectUrl?: string
    paymentToken?: string
    transactionId: string
  }>
  
  // Handle webhook from provider
  handleWebhook(req: Request): Promise<{
    orderId: string
    status: 'completed' | 'failed'
    transactionId: string
  }>
  
  // Optional: refund
  refund?(order: Order, amount: number, settings: any): Promise<{
    success: boolean
    refundId: string
  }>
}
```

### Implemented Providers
1. **PayPal** - PayPal Standard (redirect flow)
2. **MyFatoorah** (or **Tap**) - Local provider example (sandbox support)
3. **Cash on Delivery** - Simple COD method
4. **Stubs** for future: PayTabs, KNET (easy to add later)

### Provider Registration
```typescript
// services/payment/providers/index.ts
const providers: Record<string, PaymentProvider> = {
  paypal: new PayPalProvider(),
  myfatoorah: new MyFatoorahProvider(),
  cod: new CODProvider(),
}

export const getPaymentProvider = (id: string): PaymentProvider => {
  if (!providers[id]) throw new Error(`Payment provider ${id} not found`)
  return providers[id]
}
```

---

## Email & Notifications

### Email Strategy
- **Service**: Nodemailer with SMTP config (from env)
- **Templates**: HTML templates with token replacement (e.g., `{{customerName}}`, `{{orderNumber}}`)
- **Queue**: Simple retry queue in MongoDB (or BullMQ/Redis for production)

### Email Templates
| Template           | Recipient          | Trigger                          |
|--------------------|--------------------|----------------------------------|
| New Order          | Admin              | Order created                    |
| Cancelled Order    | Admin              | Order status → cancelled         |
| Failed Order       | Admin              | Payment failed                   |
| Order On-Hold      | Customer           | Order status → on_hold           |
| Processing Order   | Customer           | Order status → processing        |
| Completed Order    | Customer           | Order status → completed         |
| Refunded Order     | Customer           | Refund processed                 |
| Customer Note      | Customer           | Admin adds customer note         |
| Reset Password     | Customer           | Password reset requested         |
| New Account        | Customer           | Registration completed           |

### Email Styling
Configurable from Settings > Emails:
- Header image
- Base color, background color, body background, body text color
- Footer text + footer text color

---

## Analytics & Tracking

### Attribution Tracking
- Store UTM params + referrer in cookie on storefront visit
- Pass attribution data into order at checkout
- Display in Orders analytics table (Attribution column)

### Client-Side Events (GA4, Meta Pixel, TikTok Pixel)
Inject tracking scripts from settings, fire events:
- `view_item` - Product detail page
- `add_to_cart` - Add to cart button clicked
- `begin_checkout` - Checkout page loaded
- `purchase` - Order confirmation page

### Server-Side Purchase Event
Optional webhook forwarding to GA4/Meta for reliability (avoids ad blockers)

### Date Range & Comparison
- All analytics pages support date range selector (custom, last 7 days, last month, etc.)
- "Compare to previous period" toggle
- Show % change for each KPI

---

## Environment Variables

### Backend (.env)
```bash
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/ecommerce

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# SMTP Email
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB

# Payment Providers
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_SANDBOX=true

MYFATOORAH_API_KEY=your-myfatoorah-api-key
MYFATOORAH_SANDBOX=true

# Optional: Redis (for queue)
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api/v1
```

---

## Development Milestones

### Milestone 1: Foundation (Week 1)
- ✅ Monorepo setup with pnpm workspaces
- ✅ TypeScript configs for all apps/packages
- ✅ Docker Compose for MongoDB
- ✅ Express API scaffold with error handling
- ✅ Mongoose connection + basic User model
- ✅ JWT auth (register/login/refresh) + RBAC middleware
- ✅ Shared package with types + zod schemas
- ✅ React apps scaffold (Vite + Tailwind + shadcn/ui)

### Milestone 2: Core Commerce (Week 2)
- ✅ Product CRUD API + model (simple products)
- ✅ Category, Tag, Attribute, AttributeTerm models + APIs
- ✅ Variable products + Variations model + generate variations API
- ✅ Product list API with filters (category, tag, search, sort, pagination)
- ✅ Admin: Products list page with DataTable
- ✅ Admin: Add/Edit product form (WooCommerce-style with sidebar)
- ✅ Admin: Categories, Tags, Attributes management pages
- ✅ File upload service (images)

### Milestone 3: Orders & Customers (Week 3)
- ✅ Cart service (session-based + user-based)
- ✅ Order model + create order API
- ✅ Checkout API (calculate totals, apply coupons, create order)
- ✅ Admin: Orders list page (filters, status tabs, bulk actions)
- ✅ Admin: Order detail page (status update, notes, timeline)
- ✅ Admin: Customers list page (with stats: orders, spend, AOV)
- ✅ Admin: Customer detail page + order history
- ✅ Storefront: Cart page
- ✅ Storefront: Checkout flow (address, shipping, payment)

### Milestone 4: Coupons, Reviews, Settings (Week 4)
- ✅ Coupon model + CRUD APIs
- ✅ Apply coupon logic in cart/checkout
- ✅ Admin: Coupons list + create/edit pages
- ✅ Review model + moderation APIs
- ✅ Admin: Reviews moderation page (approve/spam/trash)
- ✅ Storefront: Reviews display + submit form
- ✅ Settings model (singleton) + CRUD APIs
- ✅ Admin: Settings pages (General, Products, Inventory, Shipping, Payments, Emails, Site Visibility)

### Milestone 5: Analytics & Reports (Week 5)
- ✅ Reports APIs (Orders, Customers, Stock)
- ✅ Admin: Reports pages with charts + CSV export
- ✅ Analytics APIs (Overview, Revenue, Orders, Products, Categories, Coupons, Stock)
- ✅ Admin: Analytics pages with date range picker + compare previous period
- ✅ Admin: Dashboard home with KPIs + charts + leaderboards
- ✅ Attribution tracking (UTM/referrer storage)

### Milestone 6: Payments & Storefront Polish (Week 6)
- ✅ Payment provider interface
- ✅ PayPal provider implementation
- ✅ MyFatoorah (or Tap) provider implementation
- ✅ COD provider
- ✅ Payment webhooks
- ✅ Storefront: Product browse page (search, filter, sort, pagination)
- ✅ Storefront: Product detail page (gallery, variations, add to cart)
- ✅ Storefront: Order confirmation + My Account pages
- ✅ Storefront: Customer auth (login/register/forgot/reset)
- ✅ Tracking scripts injection (GA4, Meta Pixel, TikTok Pixel)
- ✅ Event tracking (view_item, add_to_cart, begin_checkout, purchase)

### Milestone 7: Polish, Testing, Docs (Week 7)
- ✅ Email service + templates + queue
- ✅ Email notifications for all order status changes
- ✅ Seed script for demo data
- ✅ Admin: Users list + role management
- ✅ SEO basics (meta tags, sitemap, robots.txt)
- ✅ Rate limiting, security headers (Helmet)
- ✅ Integration tests for critical flows (checkout, order creation)
- ✅ Documentation (README, SETUP.md, API.md)
- ✅ Docker Compose for full stack
- ✅ Final cleanup + polish

---

## UI Parity Checklist

This checklist ensures we match the WooCommerce reference screenshots for admin UX.

### Dashboard / Home
- [ ] KPI tiles: Orders, Stock, Reviews
- [ ] Stats overview: Today vs Month to date
- [ ] Inbox section (optional: skip for MVP)
- [ ] Store management quick links (Marketing, Add products, etc.)

### Orders
- [ ] Table columns: Order #, Date, Status, Billing, Ship to, Total, Actions, Origin
- [ ] Status badges (Processing, Cancelled, Failed, etc.)
- [ ] Bulk actions dropdown
- [ ] Filter by registered customer
- [ ] Search bar
- [ ] Pagination
- [ ] Order detail page: Status update, Notes, Timeline, Refund button, Resend email

### Customers
- [ ] Table columns: Name, Username, Last active, Date registered, Email, Orders, Total spend, AOV, Country/Region, City
- [ ] Download button
- [ ] Filter: All Customers dropdown
- [ ] Search bar
- [ ] Customer detail page: Profile + order history

### Products
- [ ] List view: Image, Name, SKU, Stock, Price, Categories, Tags, Date, Status
- [ ] Add New, Import, Export buttons
- [ ] Filters: Category, Product type, Stock status
- [ ] Search bar
- [ ] Bulk actions
- [ ] Add/Edit page: Product name, Rich text editor, AIOSEO section, Right sidebar (Publish, Categories, Tags, Gallery, Image)
- [ ] Product data tabs: General, Inventory, Shipping, Linked Products, Attributes
- [ ] Variable product: Attributes tab with "Generate variations" button, Variations list

### Categories
- [ ] "Add new category" form: Name, Slug, Parent, Description, Image, Display type
- [ ] Categories table: Image, Name (hierarchical), Description, Slug, Count
- [ ] Bulk actions
- [ ] Search

### Tags
- [ ] "Add new tag" form: Name, Slug, Description
- [ ] Tags table: Name, Description, Slug, Count

### Attributes
- [ ] "Add new attribute" form: Name, Slug, Type, Order by, Enable archives
- [ ] Attributes list: Name with terms count, Configure terms link

### Reviews
- [ ] Tabs: All, Pending, Approved, Spam, Trash
- [ ] Table: Type, Author (with avatar), Rating (stars), Review content, Product, Submitted date
- [ ] Actions: Approve, Reply, Quick Edit, Edit, Spam, Trash
- [ ] Bulk actions

### Reports - Orders
- [ ] Date selector: Year, Last month, This month, Last 7 days, Custom
- [ ] KPI boxes: Total sales, Net sales, Orders placed, Items purchased, Refunded orders, Shipping, Coupons used
- [ ] Line chart with date comparison
- [ ] Export CSV button

### Reports - Customers
- [ ] Donut chart: Customer sales vs Guest sales
- [ ] Bar + line chart: Customer trends

### Reports - Stock
- [ ] Tabs: Low in stock, Out of stock, Most stocked
- [ ] Table: Product, Parent, Units in stock, Stock status, Actions

### Analytics - Overview
- [ ] Date range selector with "vs Previous period" toggle
- [ ] Performance KPI cards: Total sales, Net sales, Orders, Avg order value, Products sold, etc.
- [ ] Charts: Net sales, Orders (with date comparison)
- [ ] Leaderboards: Top categories, Top products

### Analytics - Revenue
- [ ] Date range selector
- [ ] KPI cards: Gross sales, Returns, Coupons, Net sales, Taxes, Shipping, Total sales
- [ ] Line chart with date comparison
- [ ] Revenue table with dates
- [ ] Download button

### Analytics - Orders
- [ ] Date range selector with "Show: All sellers" dropdown
- [ ] KPI cards: Orders, Net sales, Avg order value, Avg items per order
- [ ] Line chart with date comparison
- [ ] Orders table: Date, Order #, Status, Customer, Customer type, Product(s), Items sold, Coupon(s), Net sales, Attribution
- [ ] Download button

### Analytics - Products
- [ ] Date range selector with "Show: All products" dropdown
- [ ] KPI cards: Items sold, Net sales, Orders
- [ ] Line chart with date comparison
- [ ] Products table: Product title, SKU, Items sold, Net sales, Orders, Category, Variations, Status, Stock
- [ ] Compare checkbox
- [ ] Download button

### Analytics - Categories
- [ ] Same layout as Products but for categories
- [ ] Show parent/child hierarchy

### Analytics - Coupons
- [ ] KPI cards: Discounted orders, Amount
- [ ] Chart showing usage
- [ ] Coupons table: Coupon code, Orders, Amount discounted, Created, Expires, Type

### Analytics - Stock
- [ ] "Show: All products" dropdown
- [ ] Stock table: Product/Variation, SKU, Status, Stock
- [ ] Pagination

### Marketing - Coupons
- [ ] "Add coupon" button
- [ ] Bulk actions, Filter by type
- [ ] Table: Code, Coupon type, Coupon amount, Description, Product IDs, Usage/Limit, Expiry date
- [ ] Pagination

### Settings - General
- [ ] Tabs: General, Products, Shipping, Payments, Emails, Site visibility
- [ ] Store Address section
- [ ] General options: Selling/Shipping locations, Default location, Enable taxes/coupons
- [ ] Currency options: Currency, Position, Separators, Decimals
- [ ] Save changes button

### Settings - Products
- [ ] Shop pages: Shop page dropdown, Add to cart behavior
- [ ] Measurements: Weight unit, Dimensions unit
- [ ] Reviews: Enable reviews, Verified owner label, Verified only, Star ratings

### Settings - Products - Inventory
- [ ] Manage stock checkbox
- [ ] Hold stock (minutes)
- [ ] Notifications: Enable low/out of stock, Notification recipients
- [ ] Thresholds: Low stock, Out of stock
- [ ] Out of stock visibility checkbox
- [ ] Stock display format dropdown

### Settings - Shipping
- [ ] Shipping zones table: Zone name, Region(s), Shipping method(s)
- [ ] Add zone button
- [ ] Example: Kuwait zone, Rest of world zone

### Settings - Payments
- [ ] Payment methods table: Method (with drag handle), Enabled toggle, Description, Manage button
- [ ] Examples: Direct bank transfer, Check, COD, PayPal, Knet

### Settings - Emails
- [ ] Email notifications table: Email (checkbox), Content type, Recipient(s), Manage button
- [ ] Email sender options: From name, From address
- [ ] Email template: Header image, Base color, Background color, Body colors, Footer text

### Settings - Site Visibility
- [ ] Radio buttons: Coming soon, Live
- [ ] Save changes button

### Users
- [ ] "Add New User" button
- [ ] Bulk actions, Change role dropdown
- [ ] Table: Username, Name, Email, Role, Posts, 2FA Status, Last Login
- [ ] Pagination

---

## Next Steps

1. **Review and approve** this architecture specification
2. **Scaffold monorepo** with pnpm workspaces
3. **Begin Milestone 1** (Foundation)
4. **Iterate** through milestones, committing frequently
5. **Keep a running TODO** checklist (using `todo_write` tool)

---

**End of Architecture Specification**

Generated: January 22, 2026
