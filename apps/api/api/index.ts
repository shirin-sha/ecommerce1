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
  ]
  
  // Add Vercel preview URLs if available
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`)
  }
  if (process.env.VERCEL_BRANCH_URL) {
    origins.push(`https://${process.env.VERCEL_BRANCH_URL}`)
  }
  
  return origins.filter(Boolean) as string[]
}

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: getAllowedOrigins(),
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
    } catch (error) {
      console.error('Database connection failed:', error)
      // Don't throw - let the request fail gracefully
    }
  }
}

// Vercel serverless function handler
export default async (req: any, res: any) => {
  await connectDB()
  return app(req, res)
}
