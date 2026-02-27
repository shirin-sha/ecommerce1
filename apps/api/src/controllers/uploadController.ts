import { Request, Response } from 'express'
import path from 'path'
import { getFileUrl } from '../utils/upload'

export const uploadProductImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
    }

    // Get the full path to the uploaded file
    const filePath = path.join(req.file.destination, req.file.filename)
    
    // Upload to Blob Storage if on Vercel, or return local path
    const fileUrl = await getFileUrl(req.file.filename, filePath)

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image',
    })
  }
}
