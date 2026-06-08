import { Router, type Request, type Response } from 'express'
import pool from '../../db/config'
import { validatePartnershipSession } from '../../middleware/partnershipAuth'
import { getPartnershipIdByUserId } from '../../db/queries/partnershipQueries'
import {
  getAllEmployeeRequests,
  getEmployeeRequestById,
  searchEmployeeRequests,
  filterEmployeeRequests,
  createEmployeeRequest,
  updateEmployeeRequest,
  deleteEmployeeRequest,
} from '../../db/queries/employeeRequestQueries'

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
        partnership_id UUID REFERENCES partnerships(partner_id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Add partnership_id column if it doesn't exist
    await pool.query(`
      ALTER TABLE employee_requests
      ADD COLUMN IF NOT EXISTS partnership_id UUID REFERENCES partnerships(partner_id) ON DELETE SET NULL
    `)
  } catch (error) {
    console.error('Failed to ensure employee_requests table exists:', error)
  }
}

router.get('/', validatePartnershipSession, async (req, res) => {
  try {
    console.log('GET /api/employee-requests - fetching requests')

    // Ensure table exists before querying
    await ensureTableExists()

    const userId = (req as any).user.user_id
    const userRole = (req as any).user.role
    let partnerId = null

    if (userRole === 'admin') {
      // Admins can see all requests
      partnerId = null
    } else {
      // Partnership users can only see their own partnership's requests
      partnerId = await getPartnershipIdByUserId(userId)
      if (!partnerId) {
        return res.status(403).json({ success: false, error: 'Forbidden: No partnership found for this user' })
      }
    }

    const { search, page: pageStr, limit: limitStr, ...filters } = req.query
    const page = Math.max(1, parseInt(pageStr as string) || 1)
    const limit = Math.min(100, parseInt(limitStr as string) || 10)
    const offset = (page - 1) * limit

    // Add partnership filter only for non-admin users
    const enhancedFilters = partnerId ? { ...filters, partnership_id: partnerId } : filters

    let requests

    try {
      if (search && typeof search === 'string') {
        console.log('Searching with term:', search)
        requests = await searchEmployeeRequests(search)
        // Filter results by partnership if not admin
        if (partnerId) {
          requests = requests.filter((r: any) => r.partnership_id === partnerId)
        }
      } else if (Object.keys(enhancedFilters).length > 0) {
        console.log('Filtering with:', enhancedFilters)
        requests = await filterEmployeeRequests(enhancedFilters as any)
      } else {
        console.log('Fetching all employee requests' + (partnerId ? ' for partnership: ' + partnerId : ''))
        requests = partnerId
          ? await filterEmployeeRequests({ partnership_id: partnerId } as any)
          : await getAllEmployeeRequests()
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

router.get('/:requestId', validatePartnershipSession, async (req, res) => {
  try {
    await ensureTableExists()
    const userId = (req as any).user.user_id
    const userRole = (req as any).user.role

    const request = await getEmployeeRequestById(req.params.requestId)

    if (!request) {
      return res.status(404).json({ success: false, error: 'Employee request not found' })
    }

    // Admins can access any request, partnerships can only access their own
    if (userRole !== 'admin') {
      const partnerId = await getPartnershipIdByUserId(userId)
      if (!partnerId || request.partnership_id !== partnerId) {
        return res.status(403).json({ success: false, error: 'Forbidden: You cannot access this request' })
      }
    }

    res.json({ success: true, data: request })
  } catch (error) {
    console.error('Error fetching employee request:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch employee request' })
  }
})

router.post('/', validatePartnershipSession, async (req: Request, res: Response) => {
  try {
    await ensureTableExists()
    const userId = (req as any).user.user_id
    const userRole = (req as any).user.role
    let partnerId = req.body.partnership_id

    if (userRole !== 'admin') {
      // Partnership users must create requests for their own partnership
      partnerId = await getPartnershipIdByUserId(userId)
      if (!partnerId) {
        return res.status(403).json({ success: false, error: 'Forbidden: No partnership found for this user' })
      }
    } else if (!partnerId) {
      // Admins must specify partnership_id
      return res.status(400).json({ success: false, error: 'partnership_id is required for admin users' })
    }

    const data = { ...req.body, partnership_id: partnerId }

    const request = await createEmployeeRequest(data)
    res.status(201).json({ success: true, data: request })
  } catch (error) {
    console.error('Error creating employee request:', error)
    const message = error instanceof Error ? error.message : 'Failed to create employee request'
    const statusCode = message.includes('required') ? 400 : 500
    res.status(statusCode).json({ success: false, error: message })
  }
})

router.put('/:requestId', validatePartnershipSession, async (req: Request, res: Response) => {
  try {
    await ensureTableExists()
    const userId = (req as any).user.user_id
    const userRole = (req as any).user.role

    const existingRequest = await getEmployeeRequestById(req.params.requestId)
    if (!existingRequest) {
      return res.status(404).json({ success: false, error: 'Employee request not found' })
    }

    // Admins can update any request, partnerships can only update their own
    if (userRole !== 'admin') {
      const partnerId = await getPartnershipIdByUserId(userId)
      if (!partnerId || existingRequest.partnership_id !== partnerId) {
        return res.status(403).json({ success: false, error: 'Forbidden: You cannot modify this request' })
      }
    }

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

router.delete('/:requestId', validatePartnershipSession, async (req, res) => {
  try {
    await ensureTableExists()
    const userId = (req as any).user.user_id
    const userRole = (req as any).user.role

    const existingRequest = await getEmployeeRequestById(req.params.requestId)
    if (!existingRequest) {
      return res.status(404).json({ success: false, error: 'Employee request not found' })
    }

    // Admins can delete any request, partnerships can only delete their own
    if (userRole !== 'admin') {
      const partnerId = await getPartnershipIdByUserId(userId)
      if (!partnerId || existingRequest.partnership_id !== partnerId) {
        return res.status(403).json({ success: false, error: 'Forbidden: You cannot delete this request' })
      }
    }

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
