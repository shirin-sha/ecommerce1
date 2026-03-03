import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Get upload directory
// - If UPLOAD_DIR is set, use that
// - Otherwise default to a local "uploads" folder in the project
const getUploadDir = () => {
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR
  }
  return path.join(process.cwd(), 'uploads')
}

const UPLOAD_DIR = getUploadDir()

// Configure multer storage (always write to UPLOAD_DIR)
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
        console.error('❌ Failed to create upload directory:', error)
        cb(error, UPLOAD_DIR)
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
// Always return a relative path under /uploads so the frontend can prepend the correct host.
export const getFileUrl = async (filename: string, _filePath?: string): Promise<string> => {
  return `/uploads/${filename}`
}

// Synchronous version for backward compatibility (returns path, not URL)
export const getFileUrlSync = (filename: string): string => {
  return `/uploads/${filename}`
}
