import { Router, type Request, type Response } from 'express'
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

router.get('/', async (req, res) => {
  try {
    const { search, ...filters } = req.query

    let requests

    if (search && typeof search === 'string') {
      requests = await searchEmployeeRequests(search)
    } else if (Object.keys(filters).length > 0) {
      requests = await filterEmployeeRequests(filters as any)
    } else {
      requests = await getAllEmployeeRequests()
    }

    res.json({ success: true, data: requests || [] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching employee requests:', errorMsg, error)
    res.status(500).json({ success: false, error: 'Failed to fetch employee requests', details: errorMsg })
  }
})

router.get('/:requestId', async (req, res) => {
  try {
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
