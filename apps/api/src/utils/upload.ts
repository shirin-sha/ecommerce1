import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Get upload directory - use /tmp for Vercel (only writable directory in serverless)
const getUploadDir = () => {
  // Check if we're on Vercel
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return '/tmp/uploads'
  }
  
  // Use environment variable if set
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR
  }
  
  // Default for local development
  return path.join(process.cwd(), 'uploads')
}

const UPLOAD_DIR = getUploadDir()

// Configure multer storage with lazy directory creation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create directory only when needed (lazy creation)
    try {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true })
      }
      cb(null, UPLOAD_DIR)
    } catch (error: any) {
      // If directory creation fails, try /tmp as fallback (for Vercel)
      if (error.code === 'ENOENT' || error.code === 'EACCES') {
        const fallbackDir = '/tmp/uploads'
        try {
          if (!fs.existsSync(fallbackDir)) {
            fs.mkdirSync(fallbackDir, { recursive: true })
          }
          console.log('âœ… Using fallback upload directory:', fallbackDir)
          cb(null, fallbackDir)
        } catch (fallbackError) {
          console.error('âŒ Failed to create upload directory:', fallbackError)
          cb(error, UPLOAD_DIR)
        }
      } else {
        cb(error, UPLOAD_DIR)
      }
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  },
})

// Create multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // Default 5MB
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'))
    }
  },
})

// Get file URL for response
export const getFileUrl = (filename: string): string => {
  // On Vercel, files in /tmp are temporary and can't be served directly
  // You would need to upload to S3/Cloudinary/etc. for production
  // For now, return a placeholder or use a CDN
  
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    // On Vercel, you should upload to external storage (S3, Cloudinary, etc.)
    // For now, return a path that indicates the file was uploaded
    // In production, replace this with your CDN/storage URL
    console.warn('âš ï¸ File uploaded to /tmp - files are temporary on Vercel!')
    console.warn('   Consider using S3, Cloudinary, or similar for production')
    return `/uploads/${filename}`
  }
  
  // Local development - return relative path
  return `/uploads/${filename}`
}
