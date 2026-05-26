import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import pool from '../../db/config.js'

const router = Router()

// Configure multer for job images - allow missing files
const jobsDir = path.join(process.cwd(), 'uploads', 'jobs')
if (!fs.existsSync(jobsDir)) {
  fs.mkdirSync(jobsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, jobsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'job-' + uniqueSuffix + path.extname(file.originalname))
  },
})

// Custom multer to handle both with and without files
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

// Middleware to handle optional file upload
const uploadMiddleware = (req: Request, res: Response, next: Function) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File size too large' })
      }
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message })
    }
    next()
  })
}

// GET all jobs
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbPool = pool
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, parseInt(req.query.limit as string) || 10)
    const offset = (page - 1) * limit

    const countResult = await dbPool.query('SELECT COUNT(*) as count FROM jobs')
    const total = parseInt(countResult.rows[0].count, 10)

    const result = await dbPool.query(
      'SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    )
    res.json({ success: true, data: result.rows, total, page, limit })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching jobs:', errorMsg)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

// GET single job
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = pool
    const result = await dbPool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

// Helper to save data URL image to disk
function saveDataUrlImage(dataUrl: string): string | null {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      console.log('Invalid data URL format')
      return null
    }

    // More flexible regex to handle different MIME types
    const matches = dataUrl.match(/^data:image\/([a-z]+);base64,(.+)$/i)
    if (!matches || !matches[2]) {
      console.log('Failed to parse data URL')
      return null
    }

    const [, ext, base64Data] = matches
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const filename = `job-${uniqueSuffix}.${ext}`
    const filepath = path.join(jobsDir, filename)

    console.log('Saving image to:', filepath, 'size:', base64Data.length)
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'))
    const relativePath = `jobs/${filename}`
    console.log('Image saved successfully, returning relative path:', relativePath)
    return relativePath
  } catch (error) {
    console.error('Error saving image:', error)
    return null
  }
}

// POST create job
router.post('/', async (req: Request, res: Response) => {
  try {
    const dbPool = pool

    let { title, description, author, expire_date, status, image_url } = req.body

    // Ensure values are strings and trim them
    title = (title && typeof title === 'string') ? title.trim() : title
    description = (description && typeof description === 'string') ? description.trim() : description
    author = (author && typeof author === 'string') ? author.trim() : 'admin'
    expire_date = (expire_date && typeof expire_date === 'string') ? expire_date.trim() : expire_date
    status = (status && typeof status === 'string') ? status.trim() : 'active'

    // Handle data URL images
    let finalImageUrl: string | null = null
    if (image_url) {
      if (image_url.startsWith('data:image/')) {
        console.log('Converting data URL image (length:', image_url.length, ')')
        const savedPath = saveDataUrlImage(image_url)
        finalImageUrl = savedPath
        console.log('Converted to:', finalImageUrl, 'length:', finalImageUrl?.length || 0)
        if (!finalImageUrl) {
          console.warn('Failed to save image, using null instead of data URL')
          finalImageUrl = null
        }
      } else if (image_url.length <= 255) {
        // Only use existing URL if it's not too long
        finalImageUrl = image_url
        console.log('Using existing image URL:', finalImageUrl)
      } else {
        console.warn('Image URL too long:', image_url.length, 'chars, using null')
        finalImageUrl = null
      }
    }

    if (!title || !description || !expire_date) {
      return res
        .status(400)
        .json({ success: false, error: 'Title, description, and expire date are required' })
    }

    const id = uuidv4()
    console.log('[JOB CREATE] Saving image to PostgreSQL:', finalImageUrl)
    const result = await dbPool.query(
      `INSERT INTO jobs (
        id, title, description, author, image_url, expire_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        id,
        title,
        description,
        author,
        finalImageUrl,
        expire_date,
        status,
      ]
    )

    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error creating job:', errorMsg)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

// PUT update job
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = pool

    let { title, description, author, image_url, expire_date, status } = req.body

    // Ensure values are strings and trim them
    title = (title && typeof title === 'string') ? title.trim() : title
    description = (description && typeof description === 'string') ? description.trim() : description
    author = (author && typeof author === 'string') ? author.trim() : 'admin'
    expire_date = (expire_date && typeof expire_date === 'string') ? expire_date.trim() : expire_date
    status = (status && typeof status === 'string') ? status.trim() : 'active'

    // Handle data URL images
    let finalImageUrl: string | null = null
    if (image_url) {
      if (image_url.startsWith('data:image/')) {
        console.log('Converting data URL image (length:', image_url.length, ')')
        const savedPath = saveDataUrlImage(image_url)
        finalImageUrl = savedPath
        console.log('Converted to:', finalImageUrl, 'length:', finalImageUrl?.length || 0)
        if (!finalImageUrl) {
          console.warn('Failed to save image, using null instead of data URL')
          finalImageUrl = null
        }
      } else if (image_url.length <= 255) {
        // Only use existing URL if it's not too long
        finalImageUrl = image_url
        console.log('Using existing image URL:', finalImageUrl)
      } else {
        console.warn('Image URL too long:', image_url.length, 'chars, using null')
        finalImageUrl = null
      }
    }

    // Ensure required fields are present
    if (!title || !description || !expire_date) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and expire date are required'
      })
    }

    console.log('[JOB UPDATE] Saving image to PostgreSQL:', finalImageUrl)
    const result = await dbPool.query(
      `UPDATE jobs SET
        title = $1, description = $2, author = $3,
        image_url = $4, expire_date = $5, status = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *`,
      [
        title,
        description,
        author,
        finalImageUrl,
        expire_date,
        status,
        req.params.id,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error updating job:', errorMsg)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

// DELETE job
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = pool
    const result = await dbPool.query(
      'DELETE FROM jobs WHERE id = $1 RETURNING *',
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' })
    }

    res.json({ success: true, message: 'Job deleted', data: result.rows[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error deleting job:', errorMsg)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

export default router
