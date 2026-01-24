# Product Types in E-Commerce Platform

## Overview

This document explains how product types are handled in our e-commerce platform, inspired by WooCommerce.

## Product Types Supported

### 1. Simple Product ✅ (Implemented)

**What it is:**
- A standard physical product with a fixed price
- No variations (e.g., a book, a USB cable, a specific item)

**Use cases:**
- Single items with no size/color options
- Digital products (future: downloadable)
- Services (future: virtual)

**Features:**
- Fixed price (regular + sale price)
- Stock management
- SKU
- Shipping dimensions and weight
- Categories and tags

**Example:**
- Product: "USB-C Cable"
- Price: $12.99
- No variations needed

---

### 2. Variable Product ✅ (Implemented)

**What it is:**
- A product with multiple variations (e.g., different sizes, colors)
- Each variation can have its own price, SKU, and stock
- Base product acts as a container for variations

**Use cases:**
- Clothing (S, M, L, XL sizes)
- Products with color options
- Products with material options
- Any product with multiple options

**Features:**
- Base price (used as default for variations)
- Attributes (Size, Color, Material, etc.)
- Variations (combinations of attributes)
- Each variation has its own:
  - Price
  - SKU
  - Stock quantity
  - Image (optional)

**Example:**
- Product: "Classic T-Shirt"
- Attributes:
  - Size: Small, Medium, Large
  - Color: Red, Blue, Black
- Variations: 9 total (3 sizes × 3 colors)
- Each variation: Different price, SKU, stock

**How it works:**
1. Create product with type "Variable"
2. Define attributes (Size, Color, etc.)
3. Create variations (combinations of attributes)
4. Set price, SKU, stock for each variation

---

### 3. Grouped Product ❌ (Not Implemented)

**What it is (WooCommerce):**
- A collection of related products sold together
- Customers can add individual items from the group
- Example: "Camera Bundle" containing camera, case, memory card

**Status:** Not currently implemented, but can be added in the future.

---

### 4. External/Affiliate Product ❌ (Not Implemented)

**What it is (WooCommerce):**
- Product sold on an external website
- Link to external product page
- No checkout on your site

**Status:** Not currently implemented, but can be added in the future.

---

## How Product Types Work in Admin

### Product Edit Page Structure

The admin interface uses a **tabbed interface** similar to WooCommerce:

1. **General Tab**
   - Product type selector (dropdown at top)
   - Virtual/Downloadable checkboxes (Simple only, coming soon)
   - Pricing (Regular + Sale price)
   - SKU
   - Product type info banner

2. **Inventory Tab**
   - Stock management toggle
   - Stock quantity
   - Stock status
   - Low stock threshold

3. **Shipping Tab**
   - Weight
   - Dimensions (Length, Width, Height)
   - Shipping class

4. **Attributes Tab**
   - Define product attributes
   - For variable products: Used to create variations
   - For simple products: Display additional info

5. **Advanced Tab**
   - Purchase note
   - Menu order
   - Other advanced settings

### Product Type Selection

**Location:** Top of "Product Data" section

**Options:**
- Simple product
- Variable product

**Visual Indicators:**
- Info banner explaining the selected type
- Different fields shown/hidden based on type
- Helpful tooltips and explanations

### Key Differences: Simple vs Variable

| Feature | Simple Product | Variable Product |
|---------|---------------|------------------|
| **Pricing** | Direct price on product | Base price + variation prices |
| **Stock** | Managed at product level | Managed at variation level |
| **SKU** | Single SKU | Base SKU + variation SKUs |
| **Attributes** | Display only | Used to create variations |
| **Variations** | N/A | Required (created from attributes) |

---

## Implementation Details

### Database Schema

```typescript
type ProductType = 'simple' | 'variable'

interface Product {
  type: ProductType
  // ... other fields
  attributes: ProductAttribute[]  // Used for variations
  variationIds: string[]          // Only for variable products
}
```

### API Endpoints

- `GET /api/v1/products` - Filter by type: `?type=simple` or `?type=variable`
- `POST /api/v1/products` - Create product (specify type)
- `GET /api/v1/products/:id/variations` - Get variations (variable products only)

### Frontend Handling

**Storefront:**
- Simple products: Direct "Add to Cart"
- Variable products: Show attribute selectors, then "Add to Cart" with selected variation

**Admin:**
- Product type selector in edit form
- Conditional fields based on type
- Variations management (for variable products)

---

## Best Practices

### When to Use Simple Products

✅ Use when:
- Product has no variations
- Single price point
- Simple inventory management

**Examples:**
- Books
- Electronics (specific model)
- Accessories
- Services

### When to Use Variable Products

✅ Use when:
- Product has multiple options (size, color, etc.)
- Different prices for different options
- Need to track stock per variation

**Examples:**
- Clothing (sizes, colors)
- Shoes (sizes, colors)
- Customizable products

---

## Future Enhancements

### Planned Features

1. **Virtual Products**
   - Non-physical products (services, subscriptions)
   - No shipping required

2. **Downloadable Products**
   - Digital products (software, ebooks)
   - File downloads after purchase

3. **Grouped Products**
   - Bundle products together
   - Sell related items as a group

4. **External Products**
   - Affiliate products
   - Link to external sites

---

## WooCommerce Comparison

| Feature | WooCommerce | Our Platform | Status |
|---------|------------|--------------|--------|
| Simple Product | ✅ | ✅ | Implemented |
| Variable Product | ✅ | ✅ | Implemented |
| Grouped Product | ✅ | ❌ | Not implemented |
| External Product | ✅ | ❌ | Not implemented |
| Virtual Product | ✅ | ⏳ | Coming soon |
| Downloadable Product | ✅ | ⏳ | Coming soon |

---

## Troubleshooting

### Common Issues

**Q: Can I change a product from Simple to Variable?**
A: Yes, but you'll need to:
1. Change the type
2. Add attributes
3. Create variations
4. Set prices for each variation

**Q: Do variable products need a base price?**
A: Yes, the base price is used as a default. Individual variations can override it.

**Q: Can I have a simple product with attributes?**
A: Yes, but attributes on simple products are for display only (won't create variations).

---

## Related Documentation

- [API Documentation](./API.md) - Product endpoints
- [Architecture](./ARCHITECTURE.md) - System architecture
- [Project Status](./PROJECT_STATUS.md) - Current implementation status
