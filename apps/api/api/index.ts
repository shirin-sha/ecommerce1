import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'path'
import fs from 'fs'
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
  // Log CORS origins in development for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('Allowed CORS origins:', filtered)
  }
  return filtered
}

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins()
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true)
      }
      
      // If no allowed origins configured, reject in production
      if (allowedOrigins.length === 0) {
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ No CORS origins configured in production!')
          return callback(new Error('CORS not configured'))
        }
        // Allow in development only
        console.warn('⚠️ No CORS origins configured, allowing all origins (development only)')
        return callback(null, true)
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        // Log blocked origin for debugging
        if (process.env.NODE_ENV !== 'production') {
          console.warn('❌ CORS blocked origin:', origin)
          console.warn('   Allowed origins:', allowedOrigins)
        }
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Serve static files (uploads) - handle both local and Vercel
const getUploadDir = () => {
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR
  }
  // Vercel: Use /tmp (only writable directory in serverless)
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return '/tmp/uploads'
  }
  // Local development
  return path.join(process.cwd(), 'uploads')
}

const UPLOAD_DIR = getUploadDir()
// Only serve static files if directory exists (don't crash if it doesn't)
try {
  if (fs.existsSync(UPLOAD_DIR)) {
    app.use('/uploads', express.static(UPLOAD_DIR))
    console.log('✅ Static file serving enabled for:', UPLOAD_DIR)
  } else {
    console.warn('⚠️ Upload directory does not exist:', UPLOAD_DIR)
    console.warn('   Static file serving disabled. Files will not be accessible via /uploads')
  }
} catch (error: any) {
  console.warn('⚠️ Could not set up static file serving:', error?.message)
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Debug endpoint to check environment variables (development only)
if (process.env.NODE_ENV !== 'production') {
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
}

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
  try {
    // Log environment variable status on first request (development only)
    if (!process.env._ENV_LOGGED && process.env.NODE_ENV !== 'production') {
      console.log('=== Environment Variables Check ===')
      console.log('MONGO_URI exists:', !!process.env.MONGO_URI)
      console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET)
      console.log('JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET)
      console.log('NODE_ENV:', process.env.NODE_ENV)
      console.log('ADMIN_URL exists:', !!process.env.ADMIN_URL)
      console.log('STOREFRONT_URL exists:', !!process.env.STOREFRONT_URL)
      console.log('===================================')
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
  } catch (error: any) {
    // Catch any unexpected errors and return a proper response
    console.error('❌ Serverless function error:', error)
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error stack:', error?.stack)
    }
    
    // Return error response instead of crashing
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' 
          ? 'An error occurred' 
          : error?.message || 'Unknown error',
        ...(process.env.NODE_ENV !== 'production' && { stack: error?.stack })
      })
    }
  }
}
