import express, { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const router = Router()
const __dirname = path.dirname(path.resolve(fileURLToPath(import.meta.url)))

// Create uploads directory structure
const uploadsBaseDir = path.join(process.cwd(), 'uploads')
const uploadDirs = {
  profilePictures: path.join(uploadsBaseDir, 'candidates', 'profile_pictures'),
  cvs: path.join(uploadsBaseDir, 'candidates', 'cvs'),
  jobImages: path.join(uploadsBaseDir, 'jobs'),
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
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'))
  }
}

const pdfFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
  jobImage: multer({
    storage: createStorage(uploadDirs.jobImages),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }),
}

// Helper function to get full URL
const getFileUrl = (filename: string, subpath: string, port: string | number) => {
  return `http://localhost:${port}/uploads/${subpath}/${filename}`
}

// POST Endpoints - Upload
router.post('/candidate/profile_picture', uploaders.profilePicture.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
  }
  const port = process.env.PORT || 5000
  res.json({
    filename: req.file.filename,
    url: getFileUrl(req.file.filename, 'candidates/profile_pictures', port),
  })
})

router.post('/candidate/cv', uploaders.cv.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
  }
  const port = process.env.PORT || 5000
  res.json({
    filename: req.file.filename,
    url: getFileUrl(req.file.filename, 'candidates/cvs', port),
  })
})

router.post('/job/image', uploaders.jobImage.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
  }
  const port = process.env.PORT || 5000
  res.json({
    filename: req.file.filename,
    url: getFileUrl(req.file.filename, 'jobs', port),
  })
})

// GET Endpoints - List files
router.get('/candidates/profile_pictures', (req: Request, res: Response) => {
  fs.readdir(uploadDirs.profilePictures, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read directory' })
    }
    const port = process.env.PORT || 5000
    const filesWithUrls = files.map((file) => ({
      filename: file,
      url: getFileUrl(file, 'candidates/profile_pictures', port),
    }))
    res.json(filesWithUrls)
  })
})

router.get('/candidates/cvs', (req: Request, res: Response) => {
  fs.readdir(uploadDirs.cvs, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read directory' })
    }
    const port = process.env.PORT || 5000
    const filesWithUrls = files.map((file) => ({
      filename: file,
      url: getFileUrl(file, 'candidates/cvs', port),
    }))
    res.json(filesWithUrls)
  })
})

router.get('/jobs', (req: Request, res: Response) => {
  fs.readdir(uploadDirs.jobImages, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read directory' })
    }
    const port = process.env.PORT || 5000
    const filesWithUrls = files.map((file) => ({
      filename: file,
      url: getFileUrl(file, 'jobs', port),
    }))
    res.json(filesWithUrls)
  })
})

// Error handling middleware
router.use((err: any, req: Request, res: Response) => {
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
