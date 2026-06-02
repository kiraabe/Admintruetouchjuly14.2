import { Router, type Request, type Response } from 'express'
import { validatePartnershipSession } from '../../middleware/partnershipAuth'
import { getPartnershipIdByUserId } from '../../db/queries/partnershipQueries'
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
import jwt from 'jsonwebtoken'

const router = Router()

router.get('/', async (req, res) => {
  try {
    await ensureSpecialRequestTableExists()

    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    let userRole = 'guest'
    let userPartnershipId: string | null = null

    if (token) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userRole = decoded.role || 'guest'
        if (decoded.user_id) {
          userPartnershipId = await getPartnershipIdByUserId(decoded.user_id)
        }
      } catch (e) {
        // Token validation failed, continue as guest
      }
    }

    const { search, page: pageStr, limit: limitStr, ...filters } = req.query
    const page = Math.max(1, parseInt(pageStr as string) || 1)
    const limit = Math.min(100, parseInt(limitStr as string) || 10)
    const offset = (page - 1) * limit

    let requests

    // Admin users see all requests
    if (userRole === 'admin') {
      if (search && typeof search === 'string') {
        requests = await searchSpecialRequests(search)
      } else if (Object.keys(filters).length > 0) {
        requests = await filterSpecialRequests({ ...filters } as any)
      } else {
        requests = await getAllSpecialRequests()
      }
    }
    // Partnership users see only their partnership requests
    else if (userRole === 'partnership' && userPartnershipId) {
      if (search && typeof search === 'string') {
        requests = await searchSpecialRequests(search)
        requests = requests.filter((r: any) => r.partnership_id === userPartnershipId)
      } else if (Object.keys(filters).length > 0) {
        requests = await filterSpecialRequests({ ...filters, partnership_id: userPartnershipId } as any)
      } else {
        requests = await filterSpecialRequests({ partnership_id: userPartnershipId } as any)
      }
    }
    // No token or invalid role
    else {
      return res.status(401).json({ success: false, error: 'Unauthorized: Valid token required' })
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

    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    let userRole = 'guest'
    let userPartnershipId: string | null = null

    if (token) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userRole = decoded.role || 'guest'
        if (decoded.user_id) {
          userPartnershipId = await getPartnershipIdByUserId(decoded.user_id)
        }
      } catch (e) {
        // Token validation failed
      }
    }

    const request = await getSpecialRequestById(req.params.requestId)

    if (!request) {
      return res.status(404).json({ success: false, error: 'Special request not found' })
    }

    // Admin users can access any request
    if (userRole === 'admin') {
      return res.json({ success: true, data: request })
    }

    // Partnership users can only access their own requests
    if (userRole === 'partnership' && userPartnershipId && request.partnership_id === userPartnershipId) {
      return res.json({ success: true, data: request })
    }

    res.status(403).json({ success: false, error: 'Forbidden: You cannot access this request' })
  } catch (error) {
    console.error('Error fetching special request:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch special request' })
  }
})

router.post('/', validatePartnershipSession, async (req: Request, res: Response) => {
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

    const existingRequest = await getSpecialRequestById(req.params.requestId)
    if (!existingRequest) {
      return res.status(404).json({ success: false, error: 'Special request not found' })
    }

    // Partnership users can only update their own requests
    if (userRole === 'partnership' && existingRequest.partnership_id !== userPartnershipId) {
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

    const existingRequest = await getSpecialRequestById(req.params.requestId)
    if (!existingRequest) {
      return res.status(404).json({ success: false, error: 'Special request not found' })
    }

    // Partnership users can only delete their own requests
    if (userRole === 'partnership' && existingRequest.partnership_id !== userPartnershipId) {
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
