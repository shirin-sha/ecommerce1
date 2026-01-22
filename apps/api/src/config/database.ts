import mongoose from 'mongoose'

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce'

    await mongoose.connect(mongoUri)

    console.log('✅ MongoDB connected successfully')

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected')
    })
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    throw error
  }
}

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect()
  console.log('MongoDB disconnected')
}
