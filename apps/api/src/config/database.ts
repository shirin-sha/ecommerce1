import mongoose from 'mongoose'

// Cache the connection to reuse in serverless environments
let cachedConnection: typeof mongoose | null = null

export const connectDatabase = async (): Promise<void> => {
  try {
    // Reuse existing connection if available (for serverless)
    if (cachedConnection && mongoose.connection.readyState === 1) {
      return
    }

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce'
    
    // Log connection attempt (without exposing full URI)
    console.log('Attempting to connect to MongoDB...')
    console.log('MONGO_URI is set:', !!process.env.MONGO_URI)
    if (!process.env.MONGO_URI) {
      console.error('⚠️ MONGO_URI environment variable is not set!')
      console.error('Using fallback:', mongoUri)
    }

    // If connection exists but is not ready, close it first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    })

    cachedConnection = conn

    console.log('✅ MongoDB connected successfully')

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
      cachedConnection = null
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected')
      cachedConnection = null
    })
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    cachedConnection = null
    throw error
  }
}

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect()
  console.log('MongoDB disconnected')
}
