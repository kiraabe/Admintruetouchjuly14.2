import { Router, type Request, type Response } from 'express'
import pool from '../../db/config'
import {
  getAllSpecialRequests,
  getSpecialRequestById,
  searchSpecialRequests,
  filterSpecialRequests,
  createSpecialRequest,
  updateSpecialRequest,
  deleteSpecialRequest,
  ensureSpecialRequestTableExists,
} from '../../db/queries/specialRequestQueries'

const router = Router()

async function getPartnershipIdByUserId(userId: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT partnership_id FROM users WHERE user_id = $1`,
    [userId]
  )
  return result.rows[0]?.partnership_id || null
}

router.get('/', async (req, res) => {
  try {
    await ensureSpecialRequestTableExists()

    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    let userPartnershipId: string | null = null
    let userRole: string | null = null
    let userId: string | null = null

    if (token) {
      try {
        const jwt = require('jsonwebtoken')
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userId = decoded.user_id
        userRole = decoded.role
        if (decoded.role === 'partnership' && decoded.user_id) {
          userPartnershipId = await getPartnershipIdByUserId(decoded.user_id)
        }
      } catch (e) {
        // Token validation failed, continue as unauthenticated
      }
    }

    const { search, page: pageStr, limit: limitStr, ...filters } = req.query
    const page = Math.max(1, parseInt(pageStr as string) || 1)
    const limit = Math.min(100, parseInt(limitStr as string) || 10)
    const offset = (page - 1) * limit

    let requests

    // Admin users can see all special requests
    if (userRole === 'admin') {
      if (search && typeof search === 'string') {
        requests = await searchSpecialRequests(search)
      } else if (Object.keys(filters).length > 0) {
        requests = await filterSpecialRequests(filters as any)
      } else {
        requests = await getAllSpecialRequests()
      }
    } else if (userRole === 'partnership' && userPartnershipId) {
      // Partnership users can only see their own special requests
      const enhancedFilters = { ...filters, partnership_id: userPartnershipId }

      if (search && typeof search === 'string') {
        requests = await searchSpecialRequests(search)
        requests = requests.filter((r: any) => r.partnership_id === userPartnershipId)
      } else if (Object.keys(filters).length > 0) {
        requests = await filterSpecialRequests(enhancedFilters as any)
      } else {
        requests = await filterSpecialRequests({ partnership_id: userPartnershipId } as any)
      }
    } else {
      // Unauthenticated users get empty response
      requests = []
    }

    const total = requests?.length || 0
    const paginatedData = requests?.slice(offset, offset + limit) || []

    res.json({ success: true, data: paginatedData, total, page, limit })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching special requests:', errorMsg)
    res.status(500).json({ success: false, error: 'Failed to fetch special requests', details: errorMsg })
  }
})

router.get('/:requestId', async (req, res) => {
  try {
    await ensureSpecialRequestTableExists()
    const userId = (req as any).user.user_id
    const partnerId = await getPartnershipIdByUserId(userId)

    if (!partnerId) {
      return res.status(403).json({ success: false, error: 'Forbidden: No partnership found for this user' })
    }

    const request = await getSpecialRequestById(req.params.requestId)

    if (!request) {
      return res.status(404).json({ success: false, error: 'Special request not found' })
    }

    if (request.partnership_id !== partnerId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot access this request' })
    }

    res.json({ success: true, data: request })
  } catch (error) {
    console.error('Error fetching special request:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch special request' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    await ensureSpecialRequestTableExists()
    const userId = (req as any).user.user_id
    const partnerId = await getPartnershipIdByUserId(userId)

    if (!partnerId) {
      return res.status(403).json({ success: false, error: 'Forbidden: No partnership found for this user' })
    }

    const data = { ...req.body, partnership_id: partnerId }

    const request = await createSpecialRequest(data)
    res.status(201).json({ success: true, data: request })
  } catch (error) {
    console.error('Error creating special request:', error)
    const message = error instanceof Error ? error.message : 'Failed to create special request'
    const statusCode = message.includes('required') ? 400 : 500
    res.status(statusCode).json({ success: false, error: message })
  }
})

router.put('/:requestId', async (req: Request, res: Response) => {
  try {
    await ensureSpecialRequestTableExists()
    const userId = (req as any).user.user_id
    const partnerId = await getPartnershipIdByUserId(userId)

    if (!partnerId) {
      return res.status(403).json({ success: false, error: 'Forbidden: No partnership found for this user' })
    }

    const existingRequest = await getSpecialRequestById(req.params.requestId)
    if (!existingRequest) {
      return res.status(404).json({ success: false, error: 'Special request not found' })
    }

    if (existingRequest.partnership_id !== partnerId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot modify this request' })
    }

    const data = req.body

    const request = await updateSpecialRequest(req.params.requestId, data)
    if (!request) {
      return res.status(404).json({ success: false, error: 'Special request not found' })
    }
    res.json({ success: true, data: request })
  } catch (error) {
    console.error('Error updating special request:', error)
    const message = error instanceof Error ? error.message : 'Failed to update special request'
    res.status(500).json({ success: false, error: message })
  }
})

router.delete('/:requestId', async (req, res) => {
  try {
    await ensureSpecialRequestTableExists()
    const userId = (req as any).user.user_id
    const partnerId = await getPartnershipIdByUserId(userId)

    if (!partnerId) {
      return res.status(403).json({ success: false, error: 'Forbidden: No partnership found for this user' })
    }

    const existingRequest = await getSpecialRequestById(req.params.requestId)
    if (!existingRequest) {
      return res.status(404).json({ success: false, error: 'Special request not found' })
    }

    if (existingRequest.partnership_id !== partnerId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot delete this request' })
    }

    const success = await deleteSpecialRequest(req.params.requestId)

    if (!success) {
      return res.status(404).json({ success: false, error: 'Special request not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting special request:', error)
    res.status(500).json({ success: false, error: 'Failed to delete special request' })
  }
})

export default router
