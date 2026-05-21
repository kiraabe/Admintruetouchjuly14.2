import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

let pool: any = null

async function initPool() {
  if (!pool) {
    try {
      const poolModule = await import('../../db/config')
      pool = poolModule.default
    } catch (err) {
      console.error('Failed to load db config:', err)
      throw new Error('Database connection not available')
    }
  }
  return pool
}

// GET all licenses
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const result = await dbPool.query(
      'SELECT * FROM licenses ORDER BY created_at DESC'
    )
    res.json({ success: true, data: result.rows })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching licenses:', errorMsg)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

// GET single license
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const result = await dbPool.query(
      'SELECT * FROM licenses WHERE id = $1',
      [req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'License not found' })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

// POST create license
router.post('/', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const {
      license_number,
      company_name,
      business_type,
      issue_date,
      expiry_date,
      status,
      issued_by,
      notes,
    } = req.body

    if (!license_number || !company_name) {
      return res
        .status(400)
        .json({ success: false, error: 'License number and company name are required' })
    }

    const id = uuidv4()
    const result = await dbPool.query(
      `INSERT INTO licenses (
        id, license_number, company_name, business_type, issue_date,
        expiry_date, status, issued_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        id,
        license_number,
        company_name,
        business_type || null,
        issue_date || null,
        expiry_date || null,
        status || 'pending',
        issued_by || null,
        notes || null,
      ]
    )

    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error creating license:', errorMsg)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

// PUT update license
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const {
      license_number,
      company_name,
      business_type,
      issue_date,
      expiry_date,
      status,
      issued_by,
      notes,
    } = req.body

    const result = await dbPool.query(
      `UPDATE licenses SET
        license_number = $1, company_name = $2, business_type = $3,
        issue_date = $4, expiry_date = $5, status = $6, issued_by = $7,
        notes = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [
        license_number,
        company_name,
        business_type,
        issue_date || null,
        expiry_date || null,
        status,
        issued_by,
        notes,
        req.params.id,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'License not found' })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error updating license:', errorMsg)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

// DELETE license
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const result = await dbPool.query(
      'DELETE FROM licenses WHERE id = $1 RETURNING *',
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'License not found' })
    }

    res.json({ success: true, message: 'License deleted', data: result.rows[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error deleting license:', errorMsg)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

export default router
