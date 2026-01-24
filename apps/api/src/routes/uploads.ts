import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAuth, requireShopManager } from '../middleware/auth'

const router = Router()

const uploadDir = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const safeExt = ext && ext.length <= 10 ? ext : ''
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb: multer.FileFilterCallback) => {
    const ok = /^image\//.test(file.mimetype)
    if (!ok) {
      console.error('File filter rejected:', file.mimetype, file.originalname)
    }
    cb(ok ? null : new Error('Only image uploads are allowed') as any)
  },
})

// POST /api/v1/uploads/image
router.post('/image', requireAuth, requireShopManager, (req, res, next) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err.code, err.message)
        return res.status(400).json({ 
          success: false, 
          error: err.message,
          code: err.code 
        })
      }
      console.error('Upload error:', err.message)
      return res.status(400).json({ 
        success: false, 
        error: err.message 
      })
    }
    next()
  })
}, (req, res) => {
  const file = req.file
  if (!file) {
    // Log request details for debugging
    console.error('Upload failed - no file received')
    console.error('Request headers:', req.headers)
    console.error('Content-Type:', req.headers['content-type'])
    console.error('Request body keys:', Object.keys(req.body || {}))
    console.error('Request files:', req.files)
    return res.status(400).json({ 
      success: false, 
      error: 'No file uploaded',
      details: 'Make sure the form field is named "file" and Content-Type is multipart/form-data'
    })
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`
  const url = `${baseUrl}/uploads/${file.filename}`

  return res.status(201).json({
    success: true,
    data: {
      url,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    },
  })
})

export default router

