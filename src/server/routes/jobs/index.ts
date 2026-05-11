import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// Configure multer for job images
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

let pool: any = null

async function initPool() {
  if (!pool) {
    try {
      const poolModule = await import('../../db/config.ts')
      pool = poolModule.default
    } catch (err) {
      console.error('Failed to load db config:', err)
      throw new Error('Database connection not available')
    }
  }
  return pool
}

// GET all jobs
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const result = await dbPool.query(
      'SELECT * FROM jobs ORDER BY created_at DESC'
    )
    res.json({ success: true, data: result.rows })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching jobs:', errorMsg)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

// GET single job
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
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

// POST create job
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { title, description, author, expire_date, status } = req.body
    const imageUrl = req.file ? `/uploads/jobs/${req.file.filename}` : null

    if (!title || !description || !expire_date) {
      return res
        .status(400)
        .json({ success: false, error: 'Title, description, and expire date are required' })
    }

    const id = uuidv4()
    const result = await dbPool.query(
      `INSERT INTO jobs (
        id, title, description, author, image_url, expire_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        id,
        title,
        description,
        author || 'admin',
        imageUrl,
        expire_date,
        status || 'active',
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
router.put('/:id', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { title, description, author, image_url, expire_date, status } = req.body

    // Use new image if provided, otherwise keep existing
    let imageUrlToUse = image_url
    if (req.file) {
      imageUrlToUse = `/uploads/jobs/${req.file.filename}`
    }

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
        imageUrlToUse,
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
    const dbPool = await initPool()
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
