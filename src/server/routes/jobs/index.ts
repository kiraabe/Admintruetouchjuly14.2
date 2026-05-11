import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

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
router.post('/', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { title, description, author, image_url, expire_date, status } = req.body

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
        image_url || null,
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
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { title, description, author, image_url, expire_date, status } = req.body

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
        image_url,
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
