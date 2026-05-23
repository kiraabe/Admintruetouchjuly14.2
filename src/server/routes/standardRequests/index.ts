import { Router, type Request, type Response } from 'express'
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
} from '../../db/queries/standardRequestQueries.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    await ensureStandardRequestTableExists()

    const { search, page: pageStr, limit: limitStr, partnership_id, ...filters } = req.query
    const page = Math.max(1, parseInt(pageStr as string) || 1)
    const limit = Math.min(100, parseInt(limitStr as string) || 10)
    const offset = (page - 1) * limit

    let requests

    if (partnership_id && typeof partnership_id === 'string') {
      requests = await getStandardRequestsByPartnership(partnership_id)
    } else if (search && typeof search === 'string') {
      requests = await searchStandardRequests(search)
    } else if (Object.keys(filters).length > 0) {
      requests = await filterStandardRequests({ ...filters, partnership_id })
    } else {
      requests = await getAllStandardRequests()
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
    const request = await getStandardRequestWithCandidates(req.params.requestId)

    if (!request) {
      return res.status(404).json({ success: false, error: 'Standard request not found' })
    }

    res.json({ success: true, data: request })
  } catch (error) {
    console.error('Error fetching standard request:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch standard request' })
  }
})

router.post('/', async (req: Request, res: Response) => {
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

router.put('/:requestId', async (req: Request, res: Response) => {
  try {
    await ensureStandardRequestTableExists()
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
