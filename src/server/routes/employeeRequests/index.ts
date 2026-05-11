import { Router, type Request, type Response } from 'express'
import pool from '../../db/config.ts'
import {
  getAllEmployeeRequests,
  getEmployeeRequestById,
  searchEmployeeRequests,
  filterEmployeeRequests,
  createEmployeeRequest,
  updateEmployeeRequest,
  deleteEmployeeRequest,
} from '../../db/queries/employeeRequestQueries.ts'

const router = Router()

// Ensure table exists
async function ensureTableExists() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_requests (
        id SERIAL PRIMARY KEY,
        request_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        request_type VARCHAR(50) DEFAULT 'Standard',
        company_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        position VARCHAR(255) NOT NULL,
        number_of_employees INT NOT NULL,
        start_date DATE,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pending',
        requirements TEXT,
        notes TEXT,
        salary_range VARCHAR(255),
        required_skills TEXT,
        work_city VARCHAR(255),
        urgency VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (error) {
    console.error('Failed to ensure employee_requests table exists:', error)
  }
}

router.get('/', async (req, res) => {
  try {
    console.log('GET /api/employee-requests - fetching requests')

    // Ensure table exists before querying
    await ensureTableExists()

    const { search, page: pageStr, limit: limitStr, ...filters } = req.query
    const page = Math.max(1, parseInt(pageStr as string) || 1)
    const limit = Math.min(100, parseInt(limitStr as string) || 10)
    const offset = (page - 1) * limit

    let requests

    try {
      if (search && typeof search === 'string') {
        console.log('Searching with term:', search)
        requests = await searchEmployeeRequests(search)
      } else if (Object.keys(filters).length > 0) {
        console.log('Filtering with:', filters)
        requests = await filterEmployeeRequests(filters as any)
      } else {
        console.log('Fetching all employee requests')
        requests = await getAllEmployeeRequests()
      }
      console.log('Successfully fetched', requests.length, 'employee requests')
    } catch (queryError) {
      console.error('Database query error:', queryError)
      throw new Error(`Database error: ${queryError instanceof Error ? queryError.message : String(queryError)}`)
    }

    const total = requests?.length || 0
    const paginatedData = requests?.slice(offset, offset + limit) || []

    res.json({ success: true, data: paginatedData, total, page, limit })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching employee requests:', errorMsg, error)
    res.status(500).json({ success: false, error: 'Failed to fetch employee requests', details: errorMsg })
  }
})

router.get('/:requestId', async (req, res) => {
  try {
    await ensureTableExists()
    const request = await getEmployeeRequestById(req.params.requestId)

    if (!request) {
      return res.status(404).json({ success: false, error: 'Employee request not found' })
    }

    res.json({ success: true, data: request })
  } catch (error) {
    console.error('Error fetching employee request:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch employee request' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    await ensureTableExists()
    const data = req.body

    const request = await createEmployeeRequest(data)
    res.status(201).json({ success: true, data: request })
  } catch (error) {
    console.error('Error creating employee request:', error)
    const message = error instanceof Error ? error.message : 'Failed to create employee request'
    const statusCode = message.includes('required') ? 400 : 500
    res.status(statusCode).json({ success: false, error: message })
  }
})

router.put('/:requestId', async (req: Request, res: Response) => {
  try {
    await ensureTableExists()
    const data = req.body

    const request = await updateEmployeeRequest(req.params.requestId, data)
    if (!request) {
      return res.status(404).json({ success: false, error: 'Employee request not found' })
    }
    res.json({ success: true, data: request })
  } catch (error) {
    console.error('Error updating employee request:', error)
    const message = error instanceof Error ? error.message : 'Failed to update employee request'
    res.status(500).json({ success: false, error: message })
  }
})

router.delete('/:requestId', async (req, res) => {
  try {
    await ensureTableExists()
    const success = await deleteEmployeeRequest(req.params.requestId)

    if (!success) {
      return res.status(404).json({ success: false, error: 'Employee request not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee request:', error)
    res.status(500).json({ success: false, error: 'Failed to delete employee request' })
  }
})

export default router
