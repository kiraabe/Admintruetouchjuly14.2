import { Router, type Request, type Response } from 'express'
import { validateAdminSession, validatePartnershipSession } from '../../middleware/partnershipAuth'
import pool from '../../db/config'
import jwt from 'jsonwebtoken'
import {
  getAllStandardRequests,
  getStandardRequestById,
  getStandardRequestsByPartnership,
  getStandardRequestWithCandidates,
  searchStandardRequests,
  filterStandardRequests,
  createStandardRequest,
  updateStandardRequest,
  deleteStandardRequest,
  ensureStandardRequestTableExists,
} from '../../db/queries/standardRequestQueries'

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
    await ensureStandardRequestTableExists()

    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    let userPartnershipId: string | null = null
    let isPartnershipUser = false

    if (token) {
      try {
        const jwt = require('jsonwebtoken')
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.role === 'partnership' && decoded.user_id) {
          isPartnershipUser = true
          userPartnershipId = await getPartnershipIdByUserId(decoded.user_id)
        }
      } catch (e) {
        // Token validation failed, continue as unauthenticated
      }
    }

    const { search, page: pageStr, limit: limitStr, partnership_id, ...filters } = req.query
    const page = Math.max(1, parseInt(pageStr as string) || 1)
    const limit = Math.min(100, parseInt(limitStr as string) || 10)
    const offset = (page - 1) * limit

    let requests

    // Partnership users can only see their own requests
    if (isPartnershipUser && userPartnershipId) {
      if (search && typeof search === 'string') {
        requests = await searchStandardRequests(search)
        requests = requests.filter(r => r.partnership_id === userPartnershipId)
      } else if (Object.keys(filters).length > 0) {
        requests = await filterStandardRequests({ ...filters, partnership_id: userPartnershipId })
      } else {
        requests = await getStandardRequestsByPartnership(userPartnershipId)
      }
    } else {
      // Admin users see all requests
      if (partnership_id && typeof partnership_id === 'string') {
        requests = await getStandardRequestsByPartnership(partnership_id)
      } else if (search && typeof search === 'string') {
        requests = await searchStandardRequests(search)
      } else if (Object.keys(filters).length > 0) {
        requests = await filterStandardRequests({ ...filters, partnership_id })
      } else {
        requests = await getAllStandardRequests()
      }
    }

    const total = requests?.length || 0
    const paginatedData = requests?.slice(offset, offset + limit) || []

    res.json({ success: true, data: paginatedData, total, page, limit })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching standard requests:', errorMsg)
    res.status(500).json({ success: false, error: 'Failed to fetch standard requests', details: errorMsg })
  }
})

router.get('/:requestId', async (req, res) => {
  try {
    await ensureStandardRequestTableExists()

    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    let userPartnershipId: string | null = null
    let isPartnershipUser = false

    if (token) {
      try {
        const jwt = require('jsonwebtoken')
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.role === 'partnership' && decoded.user_id) {
          isPartnershipUser = true
          userPartnershipId = await getPartnershipIdByUserId(decoded.user_id)
        }
      } catch (e) {
        // Token validation failed, continue as unauthenticated
      }
    }

    const request = await getStandardRequestWithCandidates(req.params.requestId)

    if (!request) {
      return res.status(404).json({ success: false, error: 'Standard request not found' })
    }

    // Partnership users can only access their own requests
    if (isPartnershipUser && request.partnership_id !== userPartnershipId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this request' })
    }

    res.json({ success: true, data: request })
  } catch (error) {
    console.error('Error fetching standard request:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch standard request' })
  }
})

router.post('/', validateAdminSession, async (req: Request, res: Response) => {
  try {
    await ensureStandardRequestTableExists()
    const { candidateIds = [], ...data } = req.body

    const request = await createStandardRequest(data, candidateIds)
    res.status(201).json({ success: true, data: request })
  } catch (error) {
    console.error('Error creating standard request:', error)
    const message = error instanceof Error ? error.message : 'Failed to create standard request'
    const statusCode = message.includes('required') ? 400 : 500
    res.status(statusCode).json({ success: false, error: message })
  }
})

router.post('/own/create', validatePartnershipSession, async (req: Request, res: Response) => {
  try {
    await ensureStandardRequestTableExists()
    const userId = (req as any).user.user_id
    const partnershipId = await getPartnershipIdByUserId(userId)

    if (!partnershipId) {
      return res.status(403).json({ success: false, error: 'Forbidden: No partnership found for this user' })
    }

    const { candidateIds = [], ...data } = req.body
    const partnershipResult = await pool.query(
      'SELECT company_name FROM partnerships WHERE partner_id = $1',
      [partnershipId],
    )
    const partnershipName = partnershipResult.rows[0]?.company_name

    const requestData = {
      ...data,
      company_name: partnershipName || data.company_name,
      partnership_id: partnershipId,
    }

    const request = await createStandardRequest(requestData, candidateIds)

    // Create admin notification for new standard request
    try {
      const partnershipResult = await pool.query(
        'SELECT company_name FROM partnerships WHERE partner_id = $1',
        [partnershipId]
      )
      const partnershipName = partnershipResult.rows[0]?.company_name || 'Partnership'

      await pool.query(`
        INSERT INTO notifications (
          target, description, type, status, location, location_label, user_id, related_entity_id, related_entity_type
        )
        SELECT $1, $2, $3, $4, $5, $6, user_id, $7, $8
        FROM users
        WHERE LOWER(TRIM(authority::text)) LIKE '%admin%'
          AND is_active = true
      `, [
        'Standard Request',
        `New standard request from ${partnershipName} for ${data.position || 'position'} (${candidateIds.length || data.number_of_employees} candidate(s))`,
        1,
        'Pending',
        'admin',
        'Standard Request',
        request.request_id,
        'standard_request'
      ])
    } catch (notifError) {
      console.error('Error creating admin notification:', notifError)
      // Continue - don't fail the request if notification creation fails
    }

    res.status(201).json({ success: true, data: request })
  } catch (error) {
    console.error('Error creating standard request:', error)
    const message = error instanceof Error ? error.message : 'Failed to create standard request'
    const statusCode = message.includes('required') ? 400 : 500
    res.status(statusCode).json({ success: false, error: message })
  }
})

router.put('/:requestId', async (req: Request, res: Response) => {
  try {
    await ensureStandardRequestTableExists()

    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    let userRole = 'guest'
    let userPartnershipId: string | null = null
    let userId: string | null = null

    if (token) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userRole = decoded.role || 'guest'
        userId = decoded.user_id
        if (userId) {
          userPartnershipId = await getPartnershipIdByUserId(userId)
        }
      } catch (e) {
        // Token validation failed
      }
    }

    if (userRole !== 'admin' && userRole !== 'partnership') {
      return res.status(401).json({ success: false, error: 'Unauthorized: Valid token required' })
    }

    const existingRequest = await getStandardRequestById(req.params.requestId)
    if (!existingRequest) {
      return res.status(404).json({ success: false, error: 'Standard request not found' })
    }

    // Partnership users can only update their own requests
    if (userRole === 'partnership' && existingRequest.partnership_id !== userPartnershipId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this request' })
    }

    const data = req.body
    const request = await updateStandardRequest(req.params.requestId, data)
    if (!request) {
      return res.status(404).json({ success: false, error: 'Standard request not found' })
    }
    res.json({ success: true, data: request })
  } catch (error) {
    console.error('Error updating standard request:', error)
    const message = error instanceof Error ? error.message : 'Failed to update standard request'
    res.status(500).json({ success: false, error: message })
  }
})

router.put('/own/:requestId', validatePartnershipSession, async (req: Request, res: Response) => {
  try {
    await ensureStandardRequestTableExists()
    const userId = (req as any).user.user_id
    const userPartnershipId = await getPartnershipIdByUserId(userId)

    if (!userPartnershipId) {
      return res.status(403).json({ success: false, error: 'Forbidden: No partnership found for this user' })
    }

    const existingRequest = await getStandardRequestById(req.params.requestId)
    if (!existingRequest) {
      return res.status(404).json({ success: false, error: 'Standard request not found' })
    }

    if (existingRequest.partnership_id !== userPartnershipId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this request' })
    }

    const data = req.body
    const request = await updateStandardRequest(req.params.requestId, data)
    if (!request) {
      return res.status(404).json({ success: false, error: 'Standard request not found' })
    }
    res.json({ success: true, data: request })
  } catch (error) {
    console.error('Error updating standard request:', error)
    const message = error instanceof Error ? error.message : 'Failed to update standard request'
    res.status(500).json({ success: false, error: message })
  }
})

router.delete('/:requestId', async (req, res) => {
  try {
    await ensureStandardRequestTableExists()

    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    let userRole = 'guest'
    let userPartnershipId: string | null = null
    let userId: string | null = null

    if (token) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userRole = decoded.role || 'guest'
        userId = decoded.user_id
        if (userId) {
          userPartnershipId = await getPartnershipIdByUserId(userId)
        }
      } catch (e) {
        // Token validation failed
      }
    }

    if (userRole !== 'admin' && userRole !== 'partnership') {
      return res.status(401).json({ success: false, error: 'Unauthorized: Valid token required' })
    }

    const existingRequest = await getStandardRequestById(req.params.requestId)
    if (!existingRequest) {
      return res.status(404).json({ success: false, error: 'Standard request not found' })
    }

    // Partnership users can only delete their own requests
    if (userRole === 'partnership' && existingRequest.partnership_id !== userPartnershipId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this request' })
    }

    const success = await deleteStandardRequest(req.params.requestId)
    if (!success) {
      return res.status(404).json({ success: false, error: 'Standard request not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting standard request:', error)
    res.status(500).json({ success: false, error: 'Failed to delete standard request' })
  }
})

router.delete('/own/:requestId', validatePartnershipSession, async (req, res) => {
  try {
    await ensureStandardRequestTableExists()
    const userId = (req as any).user.user_id
    const userPartnershipId = await getPartnershipIdByUserId(userId)

    if (!userPartnershipId) {
      return res.status(403).json({ success: false, error: 'Forbidden: No partnership found for this user' })
    }

    const existingRequest = await getStandardRequestById(req.params.requestId)
    if (!existingRequest) {
      return res.status(404).json({ success: false, error: 'Standard request not found' })
    }

    if (existingRequest.partnership_id !== userPartnershipId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this request' })
    }

    const success = await deleteStandardRequest(req.params.requestId)

    if (!success) {
      return res.status(404).json({ success: false, error: 'Standard request not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting standard request:', error)
    res.status(500).json({ success: false, error: 'Failed to delete standard request' })
  }
})

export default router
