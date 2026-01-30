import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Determine upload directory based on environment
// Vercel: Use /tmp (only writable directory in serverless)
// Local: Use ./uploads
const getUploadDir = () => {
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR
  }
  // Check if we're on Vercel (serverless environment)
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return '/tmp/uploads'
  }
  // Local development
  return path.join(process.cwd(), 'uploads')
}

const UPLOAD_DIR = getUploadDir()
const PRODUCT_IMAGES_DIR = path.join(UPLOAD_DIR, 'products')

// Lazy directory creation - only create when needed, handle errors gracefully
const ensureUploadDir = () => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    }
    if (!fs.existsSync(PRODUCT_IMAGES_DIR)) {
      fs.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true })
    }
  } catch (error: any) {
    // Log error but don't crash - uploads will fail gracefully
    console.warn('⚠️ Could not create upload directory:', error.message)
    console.warn('   Upload directory:', UPLOAD_DIR)
    console.warn('   This is normal on Vercel if using /tmp')
  }
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before saving (lazy creation)
    ensureUploadDir()
    cb(null, PRODUCT_IMAGES_DIR)
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '-')
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`)
  },
})

// File filter - only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'))
  }
}

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
})

// Get public URL for uploaded file
export const getFileUrl = (filename: string): string => {
  // Return relative path that will be served as static file
  return `/uploads/products/${filename}`
}

// Delete file from disk
export const deleteFile = (filepath: string): void => {
  const fullPath = path.join(PRODUCT_IMAGES_DIR, path.basename(filepath))
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }
}
