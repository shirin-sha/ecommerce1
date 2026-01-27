import { Request, Response } from 'express'
import { getFileUrl } from '../utils/upload'

export const uploadProductImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
    }

    const fileUrl = getFileUrl(req.file.filename)

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
