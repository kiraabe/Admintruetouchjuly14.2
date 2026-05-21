import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'

const router = Router()

// Define upload directories for different file types
const uploadDirs = {
  candidates: path.join(process.cwd(), 'uploads', 'candidates'),
  profiles: path.join(process.cwd(), 'uploads', 'profiles'),
  partnerships: path.join(process.cwd(), 'uploads', 'partnerships'),
  jobs: path.join(process.cwd(), 'uploads', 'jobs'),
  documents: path.join(process.cwd(), 'uploads', 'documents'),
  images: path.join(process.cwd(), 'uploads', 'images'),
}

// Ensure all directories exist
Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// File type validators
const fileValidators: Record<string, (mimeType: string, fileName: string) => boolean> = {
  candidates: (mimeType: string, fileName: string) => {
    const ext = path.extname(fileName).toLowerCase()
    const imageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const docMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    return imageMimes.includes(mimeType) || docMimes.includes(mimeType) || ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
  },
  profiles: (mimeType: string) => mimeType.startsWith('image/'),
  partnerships: (mimeType: string) => mimeType.startsWith('image/') || mimeType === 'application/pdf',
  jobs: (mimeType: string) => mimeType === 'application/pdf' || mimeType.startsWith('image/'),
  documents: (mimeType: string) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    return validTypes.includes(mimeType)
  },
  images: (mimeType: string) => mimeType.startsWith('image/'),
}

// Max file sizes (in bytes)
const maxFileSizes: Record<string, number> = {
  candidates: 10 * 1024 * 1024, // 10 MB
  profiles: 5 * 1024 * 1024, // 5 MB
  partnerships: 8 * 1024 * 1024, // 8 MB
  jobs: 5 * 1024 * 1024, // 5 MB
  documents: 15 * 1024 * 1024, // 15 MB
  images: 10 * 1024 * 1024, // 10 MB
}

// Create multer instances for each category
const createUploader = (category: keyof typeof uploadDirs) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirs[category])
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex')
      const ext = path.extname(file.originalname)
      const name = path.basename(file.originalname, ext).replace(/\s+/g, '-').toLowerCase()
      cb(null, `${name}-${uniqueSuffix}${ext}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: maxFileSizes[category] },
    fileFilter: (req, file, cb) => {
      const validator = fileValidators[category]
      if (validator && !validator(file.mimetype, file.originalname)) {
        cb(new Error(`Invalid file type for ${category}. Allowed types: ${category === 'candidates' ? 'images, PDF, DOC, DOCX, TXT' : category === 'profiles' ? 'images' : category === 'documents' ? 'PDF, DOC, DOCX, TXT' : 'images and PDF'}`))
      } else {
        cb(null, true)
      }
    },
  })
}

const uploaders = {
  candidates: createUploader('candidates'),
  profiles: createUploader('profiles'),
  partnerships: createUploader('partnerships'),
  jobs: createUploader('jobs'),
  documents: createUploader('documents'),
  images: createUploader('images'),
}

// Upload file endpoint
router.post('/upload/:category', (req: Request, res: Response) => {
  const { category } = req.params

  if (!Object.keys(uploaders).includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Allowed: ${Object.keys(uploaders).join(', ')}`,
    })
  }

  const uploader = uploaders[category as keyof typeof uploaders]

  uploader.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? `File too large. Max size: ${maxFileSizes[category] / (1024 * 1024)}MB` : err.message
      return res.status(400).json({ success: false, error: message })
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message })
    }

    const file = (req as any).file
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file provided' })
    }

    const fileUrl = `/uploads/${category}/${file.filename}`
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: fileUrl,
      },
    })
  })
})

// List files in a category
router.get('/list/:category', (req: Request, res: Response) => {
  const { category } = req.params

  if (!Object.keys(uploadDirs).includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Allowed: ${Object.keys(uploadDirs).join(', ')}`,
    })
  }

  try {
    const dir = uploadDirs[category as keyof typeof uploadDirs]
    const files = fs.readdirSync(dir)

    const fileList = files.map((filename) => {
      const filePath = path.join(dir, filename)
      const stats = fs.statSync(filePath)
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        url: `/uploads/${category}/${filename}`,
      }
    })

    res.json({
      success: true,
      category,
      count: fileList.length,
      files: fileList,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to list files'
    res.status(500).json({
      success: false,
      error: errorMsg,
    })
  }
})

// Get file info
router.get('/info/:category/:filename', (req: Request, res: Response) => {
  const { category, filename } = req.params

  if (!Object.keys(uploadDirs).includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Allowed: ${Object.keys(uploadDirs).join(', ')}`,
    })
  }

  try {
    const filePath = path.join(uploadDirs[category as keyof typeof uploadDirs], filename)

    // Security: prevent directory traversal
    if (!filePath.startsWith(uploadDirs[category as keyof typeof uploadDirs])) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' })
    }

    const stats = fs.statSync(filePath)
    res.json({
      success: true,
      file: {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        url: `/uploads/${category}/${filename}`,
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to get file info'
    res.status(500).json({
      success: false,
      error: errorMsg,
    })
  }
})

// Delete file
router.delete('/delete/:category/:filename', (req: Request, res: Response) => {
  const { category, filename } = req.params

  if (!Object.keys(uploadDirs).includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Allowed: ${Object.keys(uploadDirs).join(', ')}`,
    })
  }

  try {
    const filePath = path.join(uploadDirs[category as keyof typeof uploadDirs], filename)

    // Security: prevent directory traversal
    if (!filePath.startsWith(uploadDirs[category as keyof typeof uploadDirs])) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' })
    }

    fs.unlinkSync(filePath)
    res.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to delete file'
    res.status(500).json({
      success: false,
      error: errorMsg,
    })
  }
})

// Bulk upload (multiple files)
router.post('/upload-bulk/:category', (req: Request, res: Response) => {
  const { category } = req.params

  if (!Object.keys(uploaders).includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Allowed: ${Object.keys(uploaders).join(', ')}`,
    })
  }

  const uploader = uploaders[category as keyof typeof uploaders]

  uploader.array('files', 10)(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? `File too large. Max size: ${maxFileSizes[category] / (1024 * 1024)}MB` : err.message
      return res.status(400).json({ success: false, error: message })
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message })
    }

    const files = (req as any).files
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided' })
    }

    const uploadedFiles = (files as any[]).map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url: `/uploads/${category}/${file.filename}`,
    }))

    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles,
    })
  })
})

// Server stats
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats: Record<string, any> = {}

    Object.entries(uploadDirs).forEach(([category, dir]) => {
      try {
        const files = fs.readdirSync(dir)
        let totalSize = 0
        files.forEach((file) => {
          const filePath = path.join(dir, file)
          const fileStats = fs.statSync(filePath)
          totalSize += fileStats.size
        })
        stats[category] = {
          fileCount: files.length,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        }
      } catch (err) {
        stats[category] = { error: 'Failed to read directory' }
      }
    })

    res.json({
      success: true,
      stats,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to get stats'
    res.status(500).json({
      success: false,
      error: errorMsg,
    })
  }
})

export default router
