import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// Load environment variables from project root
// Go up two levels from apps/api to project root
const envPath = path.resolve(process.cwd(), '../../.env')
dotenv.config({ path: envPath })
import { User } from '../models/User'
import { Product } from '../models/Product'
import { Category } from '../models/Category'
import { Tag } from '../models/Tag'
import { Attribute } from '../models/Attribute'
import { AttributeTerm } from '../models/AttributeTerm'
import { Variation } from '../models/Variation'
import { Order } from '../models/Order'
import { Coupon } from '../models/Coupon'
import { Review } from '../models/Review'
import { Settings } from '../models/Settings'
import { connectDatabase } from '../config/database'

const seed = async () => {
  try {
    console.log('🌱 Starting seed...')

    // Connect to DB
    await connectDatabase()

    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Tag.deleteMany({}),
      Attribute.deleteMany({}),
      AttributeTerm.deleteMany({}),
      Variation.deleteMany({}),
      Order.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({}),
      Settings.deleteMany({}),
    ])

    // Create users
    console.log('👤 Creating users...')
    // Store plain passwords - the User model pre-save hook will hash them
    const adminPassword = 'admin123'
    const customerPassword = 'customer123'

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'admin',
      isActive: true,
    })

    const shopManager = await User.create({
      name: 'Shop Manager',
      email: 'manager@example.com',
      passwordHash: adminPassword,
      role: 'shop_manager',
      isActive: true,
    })

    const customers = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: customerPassword,
        role: 'customer',
        phone: '+1234567890',
        addresses: {
          billing: {
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postcode: '10001',
            country: 'US',
            phone: '+1234567890',
          },
          shipping: {
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postcode: '10001',
            country: 'US',
            phone: '+1234567890',
          },
        },
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        passwordHash: customerPassword,
        role: 'customer',
        phone: '+0987654321',
      },
    ])

    console.log('✅ Users created with passwords hashed by User model')

    // Create categories
    console.log('📁 Creating categories...')
    const categories = await Category.create([
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets' },
      { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
      { name: 'Books', slug: 'books', description: 'Books and literature' },
      { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Home appliances and kitchenware' },
    ])

    // Create tags
    console.log('🏷️  Creating tags...')
    const tags = await Tag.create([
      { name: 'Sale', slug: 'sale' },
      { name: 'New Arrival', slug: 'new-arrival' },
      { name: 'Featured', slug: 'featured' },
      { name: 'Best Seller', slug: 'best-seller' },
    ])

    // Create attributes
    console.log('🎨 Creating attributes...')
    const sizeAttr = await Attribute.create({
      name: 'Size',
      slug: 'size',
      type: 'select',
      orderBy: 'menu_order',
      hasArchives: true,
    })

    const colorAttr = await Attribute.create({
      name: 'Color',
      slug: 'color',
      type: 'select',
      orderBy: 'menu_order',
      hasArchives: true,
    })

    // Create attribute terms
    console.log('📝 Creating attribute terms...')
    const sizeTerms = await AttributeTerm.create([
      { attributeId: sizeAttr._id, name: 'Small', slug: 's', sortOrder: 1 },
      { attributeId: sizeAttr._id, name: 'Medium', slug: 'm', sortOrder: 2 },
      { attributeId: sizeAttr._id, name: 'Large', slug: 'l', sortOrder: 3 },
      { attributeId: sizeAttr._id, name: 'X-Large', slug: 'xl', sortOrder: 4 },
    ])

    const colorTerms = await AttributeTerm.create([
      { attributeId: colorAttr._id, name: 'Red', slug: 'red', sortOrder: 1 },
      { attributeId: colorAttr._id, name: 'Blue', slug: 'blue', sortOrder: 2 },
      { attributeId: colorAttr._id, name: 'Green', slug: 'green', sortOrder: 3 },
      { attributeId: colorAttr._id, name: 'Black', slug: 'black', sortOrder: 4 },
    ])

    // Create simple products
    console.log('📦 Creating simple products...')
    const simpleProducts = await Product.create([
      {
        title: 'Wireless Mouse',
        slug: 'wireless-mouse',
        status: 'published',
        visibility: 'visible',
        shortDescription: 'Ergonomic wireless mouse with long battery life',
        description: '<p>High-quality wireless mouse perfect for work and gaming.</p>',
        type: 'simple',
        regularPrice: 29.99,
        salePrice: 24.99,
        sku: 'WM-001',
        manageStock: true,
        stockQty: 50,
        stockStatus: 'in_stock',
        categoryIds: [categories[0]._id],
        tagIds: [tags[0]._id, tags[3]._id],
        featuredImage: 'https://via.placeholder.com/300x300?text=Wireless+Mouse',
        featured: true,
      },
      {
        title: 'USB-C Cable',
        slug: 'usb-c-cable',
        status: 'published',
        visibility: 'visible',
        shortDescription: 'Fast charging USB-C cable',
        description: '<p>Durable USB-C cable for charging and data transfer.</p>',
        type: 'simple',
        regularPrice: 12.99,
        sku: 'USB-C-001',
        manageStock: true,
        stockQty: 100,
        stockStatus: 'in_stock',
        categoryIds: [categories[0]._id],
        featuredImage: 'https://via.placeholder.com/300x300?text=USB-C+Cable',
      },
      {
        title: 'The Great Novel',
        slug: 'the-great-novel',
        status: 'published',
        visibility: 'visible',
        shortDescription: 'A captivating story',
        description: '<p>An unforgettable journey through time and space.</p>',
        type: 'simple',
        regularPrice: 19.99,
        sku: 'BOOK-001',
        manageStock: true,
        stockQty: 30,
        stockStatus: 'in_stock',
        categoryIds: [categories[2]._id],
        tagIds: [tags[1]._id],
        featuredImage: 'https://via.placeholder.com/300x300?text=Book',
      },
    ])

    // Create variable product (T-Shirt)
    console.log('👕 Creating variable product with variations...')
    const tshirt = await Product.create({
      title: 'Classic T-Shirt',
      slug: 'classic-tshirt',
      status: 'published',
      visibility: 'visible',
      shortDescription: 'Comfortable cotton t-shirt',
      description: '<p>100% cotton t-shirt available in multiple sizes and colors.</p>',
      type: 'variable',
      regularPrice: 25.00,
      sku: 'TSHIRT-BASE',
      categoryIds: [categories[1]._id],
      tagIds: [tags[1]._id, tags[2]._id],
      featuredImage: 'https://via.placeholder.com/300x300?text=T-Shirt',
      attributes: [
        {
          attributeId: sizeAttr._id,
          name: 'Size',
          values: ['Small', 'Medium', 'Large'],
          usedForVariations: true,
          visibleOnProductPage: true,
          position: 0,
        },
        {
          attributeId: colorAttr._id,
          name: 'Color',
          values: ['Red', 'Blue', 'Black'],
          usedForVariations: true,
          visibleOnProductPage: true,
          position: 1,
        },
      ],
      featured: true,
    })

    // Create variations for T-Shirt
    const variations = []
    const sizes = ['Small', 'Medium', 'Large']
    const colors = ['Red', 'Blue', 'Black']
    let variationIndex = 1

    for (const size of sizes) {
      for (const color of colors) {
        variations.push({
          productId: tshirt._id,
          sku: `TSHIRT-${size.charAt(0)}-${color.charAt(0)}-${variationIndex}`,
          regularPrice: 25.00 + (size === 'Large' ? 2 : 0),
          manageStock: true,
          stockQty: Math.floor(Math.random() * 20) + 10,
          stockStatus: 'in_stock',
          attributeSelections: {
            [sizeAttr._id.toString()]: size,
            [colorAttr._id.toString()]: color,
          },
          status: 'active',
        })
        variationIndex++
      }
    }

    await Variation.create(variations)

    // Create coupons
    console.log('🎟️  Creating coupons...')
    await Coupon.create([
      {
        code: 'WELCOME10',
        type: 'percent',
        amount: 10,
        description: 'Welcome discount for new customers',
        usageLimit: 100,
        usageLimitPerUser: 1,
        minSpend: 50,
      },
      {
        code: 'SAVE20',
        type: 'fixed_cart',
        amount: 20,
        description: 'Save $20 on your order',
        usageLimit: 50,
        minSpend: 100,
      },
    ])

    // Create sample orders
    console.log('🛒 Creating sample orders...')
    const sampleOrder = await Order.create({
      orderNumber: `ORD-${Date.now()}-1`,
      customerId: customers[0]._id,
      customerEmail: customers[0].email,
      customerName: customers[0].name,
      status: 'completed',
      billingAddress: customers[0].addresses!.billing,
      shippingAddress: customers[0].addresses!.shipping,
      items: [
        {
          productId: simpleProducts[0]._id,
          nameSnapshot: simpleProducts[0].title,
          skuSnapshot: simpleProducts[0].sku,
          price: simpleProducts[0].salePrice!,
          qty: 2,
          subtotal: simpleProducts[0].salePrice! * 2,
          total: simpleProducts[0].salePrice! * 2,
        },
      ],
      subtotal: simpleProducts[0].salePrice! * 2,
      discountTotal: 0,
      shippingTotal: 5.00,
      taxTotal: 0,
      grandTotal: simpleProducts[0].salePrice! * 2 + 5.00,
      shippingMethod: {
        method: 'Standard Shipping',
        cost: 5.00,
      },
      payment: {
        provider: 'cod',
        methodTitle: 'Cash on Delivery',
        status: 'completed',
        paidAt: new Date(),
      },
      completedAt: new Date(),
    })

    // Update customer stats
    customers[0].ordersCount = 1
    customers[0].totalSpend = sampleOrder.grandTotal
    customers[0].avgOrderValue = sampleOrder.grandTotal
    await customers[0].save()

    // Create reviews
    console.log('⭐ Creating reviews...')
    await Review.create([
      {
        productId: simpleProducts[0]._id,
        customerId: customers[0]._id,
        authorName: customers[0].name,
        authorEmail: customers[0].email,
        rating: 5,
        content: 'Excellent product! Highly recommend.',
        status: 'approved',
        isVerifiedOwner: true,
      },
      {
        productId: tshirt._id,
        customerId: customers[1]._id,
        authorName: customers[1].name,
        authorEmail: customers[1].email,
        rating: 4,
        content: 'Great quality and fit!',
        status: 'approved',
        isVerifiedOwner: false,
      },
    ])

    // Create settings
    console.log('⚙️  Creating settings...')
    await Settings.create({
      general: {
        storeName: 'Demo E-Commerce Store',
        storeAddress: {
          address1: '123 Commerce Street',
          city: 'New York',
          state: 'NY',
          postcode: '10001',
          country: 'US',
        },
        currency: 'USD',
        enableCoupons: true,
      },
      products: {
        reviewsEnabled: true,
        verifiedOwnerLabel: true,
      },
      inventory: {
        enableStockMgmt: true,
        lowStockThreshold: 5,
        outOfStockThreshold: 0,
      },
      siteVisibility: 'live',
    })

    console.log('✅ Seed completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Users: ${await User.countDocuments()}`)
    console.log(`   - Products: ${await Product.countDocuments()}`)
    console.log(`   - Categories: ${await Category.countDocuments()}`)
    console.log(`   - Tags: ${await Tag.countDocuments()}`)
    console.log(`   - Attributes: ${await Attribute.countDocuments()}`)
    console.log(`   - Variations: ${await Variation.countDocuments()}`)
    console.log(`   - Orders: ${await Order.countDocuments()}`)
    console.log(`   - Coupons: ${await Coupon.countDocuments()}`)
    console.log(`   - Reviews: ${await Review.countDocuments()}`)
    console.log('\n🔑 Admin credentials:')
    console.log('   Email: admin@example.com')
    console.log('   Password: admin123')
    console.log('\n🔑 Shop Manager credentials:')
    console.log('   Email: manager@example.com')
    console.log('   Password: admin123')
    console.log('\n🔑 Customer credentials:')
    console.log('   Email: john@example.com')
    console.log('   Password: customer123')

    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
