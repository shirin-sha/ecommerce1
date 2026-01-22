import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import path from 'path'
import { connectDatabase } from './config/database'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import categoryRoutes from './routes/categories'
import tagRoutes from './routes/tags'
import attributeRoutes from './routes/attributes'
import cartRoutes from './routes/cart'
import checkoutRoutes from './routes/checkout'
import orderRoutes from './routes/orders'
import customerRoutes from './routes/customers'
import couponRoutes from './routes/coupons'
import reviewRoutes from './routes/reviews'
import settingsRoutes from './routes/settings'
import analyticsRoutes from './routes/analytics'
import reportsRoutes from './routes/reports'

// Load environment variables from project root
// Go up two levels from apps/api to project root
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') })

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', process.env.ADMIN_URL || 'http://localhost:3001'],
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
    docs: '/api/v1/docs',
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

// Error handler (must be last)
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase()

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 API: http://localhost:${PORT}/api/v1`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  process.exit(0)
})
