import { Router, type Request, type Response } from 'express'
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

router.get('/', async (req, res) => {
  try {
    await ensureSpecialRequestTableExists()

    const { search, page: pageStr, limit: limitStr, ...filters } = req.query
    const page = Math.max(1, parseInt(pageStr as string) || 1)
    const limit = Math.min(100, parseInt(limitStr as string) || 10)
    const offset = (page - 1) * limit

    let requests

    if (search && typeof search === 'string') {
      requests = await searchSpecialRequests(search)
    } else if (Object.keys(filters).length > 0) {
      requests = await filterSpecialRequests(filters as any)
    } else {
      requests = await getAllSpecialRequests()
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
    const request = await getSpecialRequestById(req.params.requestId)

    if (!request) {
      return res.status(404).json({ success: false, error: 'Special request not found' })
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
    const data = req.body

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
