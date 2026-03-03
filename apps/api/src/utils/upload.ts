import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Optional Vercel Blob Storage (install @vercel/blob package to use)
let blobStorage: any = null
try {
  blobStorage = require('@vercel/blob')
} catch (error) {
  // Blob Storage not installed - will use /tmp (temporary files)
  console.log('ℹ️ @vercel/blob not installed - using temporary file storage')
}

// Get upload directory - use /tmp for Vercel (only writable directory in serverless)
// But we'll upload to Vercel Blob Storage instead of keeping files in /tmp
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

// Check if Vercel Blob Storage is configured
const useBlobStorage = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN)

// Configure multer storage
// On Vercel with Blob Storage: save to /tmp temporarily, then upload to Blob Storage
// On local: save to uploads directory
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
          console.log('✅ Using fallback upload directory:', fallbackDir)
          cb(null, fallbackDir)
        } catch (fallbackError) {
          console.error('❌ Failed to create upload directory:', fallbackError)
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

// Upload file to Vercel Blob Storage
export const uploadToBlobStorage = async (filePath: string, filename: string): Promise<string> => {
  if (!blobStorage) {
    throw new Error('@vercel/blob package is not installed. Install it with: pnpm add @vercel/blob')
  }

  if (!useBlobStorage) {
    throw new Error('Vercel Blob Storage is not configured. Set BLOB_READ_WRITE_TOKEN environment variable.')
  }

  try {
    const fileBuffer = fs.readFileSync(filePath)
    const blob = await blobStorage.put(filename, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    })

    // Clean up temporary file
    try {
      fs.unlinkSync(filePath)
    } catch (unlinkError) {
      console.warn('Failed to delete temporary file:', unlinkError)
    }

    return blob.url
  } catch (error) {
    console.error('Failed to upload to Blob Storage:', error)
    throw error
  }
}

// Get file URL for response
export const getFileUrl = async (filename: string, filePath?: string): Promise<string> => {
  // If on Vercel and Blob Storage is configured, upload the file
  if ((process.env.VERCEL || process.env.VERCEL_ENV) && useBlobStorage && filePath) {
    try {
      const blobUrl = await uploadToBlobStorage(filePath, filename)
      console.log('✅ File uploaded to Vercel Blob Storage:', blobUrl)
      return blobUrl
    } catch (error: any) {
      console.error('❌ Failed to upload to Blob Storage:', error?.message)
      console.warn('⚠️ File is in /tmp and will be deleted. Configure Blob Storage for permanent storage.')
      // Fallback to temporary path (won't work for serving, but at least won't crash)
      return `/uploads/${filename}`
    }
  }
  
  // If on Vercel but Blob Storage not configured, return API route path
  if ((process.env.VERCEL || process.env.VERCEL_ENV) && !useBlobStorage) {
    console.warn('⚠️ WARNING: On Vercel but Blob Storage not configured!')
    console.warn('   Files in /tmp will be deleted and cannot be served.')
    console.warn('   To fix: Install @vercel/blob and set BLOB_READ_WRITE_TOKEN')
    console.warn('   See: docs/VERCEL_IMAGE_STORAGE.md')
    // Return API route path so files can be served via /api/v1/uploads/:filename
    return `/api/v1/uploads/${filename}`
  }
  
  // Local development - return relative path (works with static file serving)
  return `/uploads/${filename}`
}

// Synchronous version for backward compatibility (returns path, not URL)
export const getFileUrlSync = (filename: string): string => {
  if ((process.env.VERCEL || process.env.VERCEL_ENV) && useBlobStorage) {
    // On Vercel with Blob Storage, we need to upload first
    // This sync version can't do that, so return a placeholder
    console.warn('⚠️ Using sync getFileUrl on Vercel - file may not be accessible')
    console.warn('   Use async getFileUrl() instead for Blob Storage upload')
    return `/uploads/${filename}`
  }
  
  return `/uploads/${filename}`
}
