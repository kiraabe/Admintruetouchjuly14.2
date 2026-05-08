import { Router } from 'express'
import {
  getAllCandidates,
  getCandidateById,
  searchCandidates,
  filterCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../../db/queries/candidateQueries'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { search, ...filters } = req.query

    let candidates

    if (search && typeof search === 'string') {
      candidates = await searchCandidates(search)
    } else if (Object.keys(filters).length > 0) {
      candidates = await filterCandidates(filters as any)
    } else {
      candidates = await getAllCandidates()
    }

    res.json({ success: true, data: candidates })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch candidates' })
  }
})

router.get('/:candidateId', async (req, res) => {
  try {
    const candidate = await getCandidateById(req.params.candidateId)

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' })
    }

    res.json({ success: true, data: candidate })
  } catch (error) {
    console.error('Error fetching candidate:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch candidate' })
  }
})

router.post('/', async (req, res) => {
  try {
    const candidate = await createCandidate(req.body)
    res.status(201).json({ success: true, data: candidate })
  } catch (error) {
    console.error('Error creating candidate:', error)
    res.status(500).json({ success: false, error: 'Failed to create candidate' })
  }
})

router.put('/:candidateId', async (req, res) => {
  try {
    const candidate = await updateCandidate(req.params.candidateId, req.body)
    res.json({ success: true, data: candidate })
  } catch (error) {
    console.error('Error updating candidate:', error)
    res.status(500).json({ success: false, error: 'Failed to update candidate' })
  }
})

router.delete('/:candidateId', async (req, res) => {
  try {
    const success = await deleteCandidate(req.params.candidateId)

    if (!success) {
      return res.status(404).json({ success: false, error: 'Candidate not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting candidate:', error)
    res.status(500).json({ success: false, error: 'Failed to delete candidate' })
  }
})

export default router
