# API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

All protected routes require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

### Auth Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Returns:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

---

## Products

### List Products
```http
GET /products?page=1&limit=20&status=published&search=keyword
```

Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `status` - Filter by status (draft, published, private)
- `type` - Filter by type (simple, variable)
- `categoryIds` - Filter by category (comma-separated IDs)
- `tagIds` - Filter by tags (comma-separated IDs)
- `search` - Search in title/description
- `featured` - Filter featured products (true/false)
- `stockStatus` - Filter by stock status

### Get Product
```http
GET /products/:id
GET /products/slug/:slug
```

### Create Product (Admin)
```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Product Name",
  "slug": "product-name",
  "type": "simple",
  "status": "published",
  "visibility": "visible",
  "shortDescription": "...",
  "description": "...",
  "regularPrice": 99.99,
  "salePrice": 79.99,
  "sku": "PROD-001",
  "manageStock": true,
  "stockQty": 100,
  "categoryIds": ["..."],
  "tagIds": ["..."],
  "featuredImage": "...",
  "gallery": ["..."]
}
```

### Update Product (Admin)
```http
PATCH /products/:id
Authorization: Bearer <token>
```

### Delete Product (Admin)
```http
DELETE /products/:id
Authorization: Bearer <token>
```

---

## Product Variations

### Generate Variations (Admin)
```http
POST /products/:productId/variations/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "attributes": [
    {
      "attributeId": "...",
      "values": ["Small", "Medium", "Large"]
    }
  ]
}
```

### List Variations
```http
GET /products/:productId/variations
```

### Get Variation
```http
GET /products/:productId/variations/:variationId
```

### Create Variation (Admin)
```http
POST /products/:productId/variations
Authorization: Bearer <token>
```

### Update Variation (Admin)
```http
PATCH /products/:productId/variations/:variationId
Authorization: Bearer <token>
```

### Delete Variation (Admin)
```http
DELETE /products/:productId/variations/:variationId
Authorization: Bearer <token>
```

---

## Categories

### List Categories
```http
GET /categories?page=1&limit=20
```

### Get Category
```http
GET /categories/:id
GET /categories/slug/:slug
```

### Create Category (Admin)
```http
POST /categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Electronics",
  "slug": "electronics",
  "parentId": null,
  "description": "...",
  "image": "...",
  "displayType": "default",
  "sortOrder": 0
}
```

### Update Category (Admin)
```http
PATCH /categories/:id
Authorization: Bearer <token>
```

### Delete Category (Admin)
```http
DELETE /categories/:id
Authorization: Bearer <token>
```

---

## Tags, Attributes

Similar endpoints for Tags and Attributes follow the same pattern as Categories.

---

## Orders

### List Orders (Admin/Customer)
```http
GET /orders?page=1&limit=20&status=completed
Authorization: Bearer <token>
```

Customers can only see their own orders. Admins see all orders.

### Get Order
```http
GET /orders/:id
Authorization: Bearer <token>
```

### Update Order Status (Admin)
```http
PATCH /orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "processing"
}
```

### Add Order Note (Admin)
```http
POST /orders/:id/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Note content",
  "isCustomerNote": false
}
```

### Process Refund (Admin)
```http
POST /orders/:id/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 99.99,
  "reason": "Customer request"
}
```

---

## Cart & Checkout

### Get Cart
```http
GET /cart
POST /cart
Content-Type: application/json

{
  "items": [
    {
      "productId": "...",
      "variationId": "...",
      "qty": 2
    }
  ],
  "couponCode": "SAVE20"
}
```

### Calculate Checkout Totals
```http
POST /checkout/calculate
Content-Type: application/json

{
  "items": [...],
  "shippingMethodId": "...",
  "couponCode": "..."
}
```

### Create Order
```http
POST /checkout/create-order
Content-Type: application/json

{
  "items": [...],
  "billingAddress": {...},
  "shippingAddress": {...},
  "shippingMethodId": "...",
  "paymentMethodId": "cod",
  "couponCode": "...",
  "customerNotes": "..."
}
```

---

## Customers

### List Customers (Admin)
```http
GET /customers?page=1&limit=25&search=john
Authorization: Bearer <token>
```

### Get Customer (Admin)
```http
GET /customers/:id
Authorization: Bearer <token>
```

Returns customer details + order history.

---

## Coupons

### Validate Coupon (Public)
```http
POST /coupons/validate
Content-Type: application/json

{
  "code": "SAVE20",
  "items": [...]
}
```

### List Coupons (Admin)
```http
GET /coupons
Authorization: Bearer <token>
```

### Create Coupon (Admin)
```http
POST /coupons
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "SAVE20",
  "type": "percent",
  "amount": 20,
  "description": "...",
  "expiryDate": "2024-12-31",
  "usageLimit": 100,
  "usageLimitPerUser": 1,
  "minSpend": 100
}
```

---

## Reviews

### List Reviews
```http
GET /reviews?productId=...&page=1&limit=20
```

Public endpoint returns only approved reviews.

### Create Review
```http
POST /reviews
Content-Type: application/json

{
  "productId": "...",
  "rating": 5,
  "content": "Great product!",
  "authorName": "John Doe",
  "authorEmail": "john@example.com"
}
```

### Moderate Review (Admin)
```http
PATCH /reviews/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved"
}
```

Statuses: `pending`, `approved`, `spam`, `trash`

---

## Analytics & Reports

### Overview Analytics (Admin)
```http
GET /analytics/overview?dateFrom=2024-01-01&dateTo=2024-01-31&comparePeriod=true
Authorization: Bearer <token>
```

Returns KPIs: revenue, orders, AOV with comparisons.

### Product Analytics (Admin)
```http
GET /analytics/products?dateFrom=...&dateTo=...
Authorization: Bearer <token>
```

Returns top selling products with revenue and quantity sold.

### Category Analytics (Admin)
```http
GET /analytics/categories?dateFrom=...&dateTo=...
Authorization: Bearer <token>
```

### Stock Analytics (Admin)
```http
GET /analytics/stock
Authorization: Bearer <token>
```

Returns stock summary + low stock + out of stock products.

### Orders Report (Admin)
```http
GET /reports/orders?dateFrom=...&dateTo=...&groupBy=day
Authorization: Bearer <token>
```

### Customers Report (Admin)
```http
GET /reports/customers?dateFrom=...&dateTo=...
Authorization: Bearer <token>
```

### Stock Report (Admin)
```http
GET /reports/stock?status=low_stock
Authorization: Bearer <token>
```

---

## Settings

### Get Settings (Admin)
```http
GET /settings
Authorization: Bearer <token>
```

### Update Settings (Admin)
```http
PATCH /settings/general
PATCH /settings/products
PATCH /settings/inventory
PATCH /settings/shipping
PATCH /settings/payments
PATCH /settings/emails
PATCH /settings/site-visibility
PATCH /settings/tracking
Authorization: Bearer <token>
Content-Type: application/json

{
  "general": {...},
  "products": {...},
  ...
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Auth endpoints: 5 requests per 15 minutes
- General endpoints: 100 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```
