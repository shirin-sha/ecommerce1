import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { connectDatabase } from '../src/config/database'
import { errorHandler } from '../src/middleware/errorHandler'
import authRoutes from '../src/routes/auth'
import productRoutes from '../src/routes/products'
import categoryRoutes from '../src/routes/categories'
import tagRoutes from '../src/routes/tags'
import attributeRoutes from '../src/routes/attributes'
import cartRoutes from '../src/routes/cart'
import checkoutRoutes from '../src/routes/checkout'
import orderRoutes from '../src/routes/orders'
import customerRoutes from '../src/routes/customers'
import couponRoutes from '../src/routes/coupons'
import reviewRoutes from '../src/routes/reviews'
import settingsRoutes from '../src/routes/settings'
import analyticsRoutes from '../src/routes/analytics'
import reportsRoutes from '../src/routes/reports'

const app = express()

// Get allowed origins from environment
const getAllowedOrigins = () => {
  const origins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    process.env.STOREFRONT_URL,
  ]
  
  // Add Vercel preview URLs if available
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`)
  }
  if (process.env.VERCEL_BRANCH_URL) {
    origins.push(`https://${process.env.VERCEL_BRANCH_URL}`)
  }
  
  // In development, allow localhost
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000')
  }
  
  const filtered = origins.filter(Boolean) as string[]
  console.log('Allowed CORS origins:', filtered)
  return filtered
}

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins()
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.length === 0) {
        return callback(null, true)
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        console.warn('CORS blocked origin:', origin)
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Debug endpoint to check environment variables (remove in production if needed)
app.get('/debug/env', (req, res) => {
  // Don't expose sensitive values, just check if they exist
  res.json({
    hasMONGO_URI: !!process.env.MONGO_URI,
    hasJWT_SECRET: !!process.env.JWT_SECRET,
    hasJWT_REFRESH_SECRET: !!process.env.JWT_REFRESH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    hasADMIN_URL: !!process.env.ADMIN_URL,
    hasSTOREFRONT_URL: !!process.env.STOREFRONT_URL,
    // Show first few chars of MONGO_URI for debugging (safe)
    MONGO_URI_preview: process.env.MONGO_URI ? 
      `${process.env.MONGO_URI.substring(0, 20)}...` : 'NOT SET',
    timestamp: new Date().toISOString()
  })
})

// API routes
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'E-Commerce API',
    version: '1.0.0',
  })
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/products', productRoutes)
app.use('/api/v1/categories', categoryRoutes)
app.use('/api/v1/tags', tagRoutes)
app.use('/api/v1/attributes', attributeRoutes)
app.use('/api/v1/cart', cartRoutes)
app.use('/api/v1/checkout', checkoutRoutes)
app.use('/api/v1/orders', orderRoutes)
app.use('/api/v1/customers', customerRoutes)
app.use('/api/v1/coupons', couponRoutes)
app.use('/api/v1/reviews', reviewRoutes)
app.use('/api/v1/settings', settingsRoutes)
app.use('/api/v1/analytics', analyticsRoutes)
app.use('/api/v1/reports', reportsRoutes)

// Error handler
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// Initialize database connection (cached for serverless)
let dbConnected = false

const connectDB = async () => {
  if (!dbConnected) {
    try {
      await connectDatabase()
      dbConnected = true
      console.log('Database connection established')
    } catch (error) {
      console.error('Database connection failed:', error)
      // Reset flag to retry on next request
      dbConnected = false
      // Don't throw - let the request proceed (health check should work)
    }
  }
}

// Vercel serverless function handler
export default async (req: any, res: any) => {
  // Log environment variable status on first request (for debugging)
  if (!process.env._ENV_LOGGED) {
    console.log('=== Environment Variables Check ===')
    console.log('MONGO_URI exists:', !!process.env.MONGO_URI)
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET)
    console.log('JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET)
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('ADMIN_URL exists:', !!process.env.ADMIN_URL)
    console.log('STOREFRONT_URL exists:', !!process.env.STOREFRONT_URL)
    if (process.env.MONGO_URI) {
      console.log('MONGO_URI starts with:', process.env.MONGO_URI.substring(0, 20))
    }
    console.log('===================================')
    // Mark as logged to avoid spam
    process.env._ENV_LOGGED = 'true'
  }
  
  try {
    // Connect to database (non-blocking - won't fail the request if DB is down)
    await connectDB()
  } catch (error) {
    // Log error but don't block the request
    // Health check should still work even if DB is down
    console.error('Database connection warning:', error)
  }
  
  // Handle the request
  return app(req, res)
}
