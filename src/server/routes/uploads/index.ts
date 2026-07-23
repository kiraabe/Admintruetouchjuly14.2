import express from 'express'
import type { NextFunction, Request, Response, Router as ExpressRouter } from 'express'
import multer from 'multer'
import type { File } from 'multer'
import path from 'path'
import fs from 'fs'

declare global {
  namespace Express {
    interface Request {
      file?: File
      files?: File[]
    }
  }
}

const router = express.Router()

// Create uploads directory structure
const uploadsBaseDir = path.join(process.cwd(), 'uploads')
const uploadDirs = {
  profilePictures: path.join(uploadsBaseDir, 'candidates', 'profile_pictures'),
  cvs: path.join(uploadsBaseDir, 'candidates', 'cvs'),
  blogImages: path.join(uploadsBaseDir, 'blogs'),
  testimonialAvatars: path.join(uploadsBaseDir, 'testimonials'),
}

Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Multer storage configurations
const createStorage = (subdir: string) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, subdir)
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now()
      const originalName = file.originalname.replace(/\s+/g, '-')
      cb(null, `${timestamp}-${originalName}`)
    },
  })

// File filters
const imageFilter = (req: Request, file: File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'))
  }
}

const pdfFilter = (req: Request, file: File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'))
  }
}

// Uploaders
const uploaders = {
  profilePicture: multer({
    storage: createStorage(uploadDirs.profilePictures),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }),
  cv: multer({
    storage: createStorage(uploadDirs.cvs),
    fileFilter: pdfFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
  }),
  blogImage: multer({
    storage: createStorage(uploadDirs.blogImages),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }),
  testimonialAvatar: multer({
    storage: createStorage(uploadDirs.testimonialAvatars),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }),
}

// Helper function to get file URL (returns relative path for frontend use)
const getFileUrl = (filename: string, subpath: string) => {
  return `/uploads/${subpath}/${filename}`
}

// Helper function to get relative path from uploads folder
const getRelativePath = (filename: string, subpath: string) => {
  return `${subpath}/${filename}`
}

// POST Endpoints - Upload
router.post('/candidate/profile_picture', (req: Request, res: Response, next) => {
  uploaders.profilePicture.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }
    const path = getRelativePath(req.file.filename, 'candidates/profile_pictures')
    res.json({
      filename: req.file.filename,
      path: path,
      url: getFileUrl(req.file.filename, 'candidates/profile_pictures'),
    })
  })
})

const handleBlogImageUpload = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
  }
  const relativePath = getRelativePath(req.file.filename, 'blogs')
  res.json({
    filename: req.file.filename,
    path: relativePath,
    url: getFileUrl(req.file.filename, 'blogs'),
  })
}

router.post('/blog/featured-image', uploaders.blogImage.single('file'), handleBlogImageUpload)
router.post('/blog/author-avatar', uploaders.blogImage.single('file'), handleBlogImageUpload)
router.post('/testimonial/avatar', uploaders.testimonialAvatar.single('file'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })
  const relativePath = getRelativePath(req.file.filename, 'testimonials')
  res.json({ filename: req.file.filename, path: relativePath, url: getFileUrl(req.file.filename, 'testimonials') })
})

router.post('/candidate/cv', (req: Request, res: Response, next) => {
  uploaders.cv.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }
    const path = getRelativePath(req.file.filename, 'candidates/cvs')
    res.json({
      filename: req.file.filename,
      path: path,
      url: getFileUrl(req.file.filename, 'candidates/cvs'),
    })
  })
})

// GET Endpoints - List files
router.get('/candidates/profile_pictures', (req: Request, res: Response) => {
  fs.readdir(uploadDirs.profilePictures, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read directory' })
    }
    const filesWithUrls = files.map((file) => ({
      filename: file,
      url: getFileUrl(file, 'candidates/profile_pictures'),
    }))
    res.json(filesWithUrls)
  })
})

router.get('/candidates/cvs', (req: Request, res: Response) => {
  fs.readdir(uploadDirs.cvs, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read directory' })
    }
    const filesWithUrls = files.map((file) => ({
      filename: file,
      url: getFileUrl(file, 'candidates/cvs'),
    }))
    res.json(filesWithUrls)
  })
})

// Download endpoints
router.get('/download/cv/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename

  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(403).json({ error: 'Invalid filename' })
  }

  console.log(`Download request for: ${filename}`)

  // Try multiple locations where CV files might be stored
  const locations = [
    path.join(uploadDirs.cvs, filename), // uploads/candidates/cvs/{filename}
    path.join(uploadsBaseDir, 'candidates', filename), // uploads/candidates/{filename}
  ]

  let filepath = ''
  for (const loc of locations) {
    console.log(`Checking: ${loc}`)
    if (fs.existsSync(loc)) {
      filepath = loc
      console.log(`Found at: ${filepath}`)
      break
    }
  }

  if (!filepath) {
    console.log(`File not found in any location`)
    return res.status(404).json({ error: 'File not found' })
  }

  try {
    // Set proper headers for download
    const cleanFilename = path.basename(filename)
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`)
    res.setHeader('Content-Type', 'application/octet-stream')
    res.download(filepath, cleanFilename, (err) => {
      if (err) {
        console.error('Download error:', err)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' })
        }
      }
    })
  } catch (error) {
    console.error('Error serving file:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

router.get('/candidate/cv/:filename', (req: Request, res: Response) => {
  // Redirect to download endpoint
  res.redirect(`/api/uploads/download/cv/${req.params.filename}`)
})

router.get('/candidate/profile_picture/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename

  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(403).json({ error: 'Invalid filename' })
  }

  // Try the candidates directory (where files are actually stored)
  let filepath = path.join(uploadsBaseDir, 'candidates', filename)

  console.log(`Download request for: ${filename}`)
  console.log(`Looking for file at: ${filepath}`)

  if (!fs.existsSync(filepath)) {
    console.log(`File not found at ${filepath}`)
    return res.status(404).json({ error: 'File not found' })
  }

  console.log(`File found, serving: ${filepath}`)
  res.download(filepath)
})

// Error handling middleware
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the limit' })
    }
  } else if (err && err.message) {
    return res.status(400).json({ error: err.message })
  }
  res.status(500).json({ error: 'Upload failed' })
})

export default router
