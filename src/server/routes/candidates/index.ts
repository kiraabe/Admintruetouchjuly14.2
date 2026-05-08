import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import {
  getAllCandidates,
  getCandidateById,
  searchCandidates,
  filterCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../../db/queries/candidateQueries.ts'

const router = Router()

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'candidates')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const name = file.fieldname === 'profilePicture' ? 'profile' : 'resume'
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profilePicture') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true)
      } else {
        cb(new Error('Profile picture must be an image file'))
      }
    } else if (file.fieldname === 'resume') {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (validTypes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error('Resume must be PDF, DOC, DOCX, or TXT'))
      }
    } else {
      cb(new Error('Invalid file field'))
    }
  },
})

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

    res.json({ success: true, data: candidates || [] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching candidates:', errorMsg, error)
    res.status(500).json({ success: false, error: 'Failed to fetch candidates', details: errorMsg })
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

router.post('/', upload.fields([{ name: 'profilePicture', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), async (req: Request, res: Response) => {
  try {
    const files = req.files as Record<string, Express.Multer.File[]>
    const data: any = { ...req.body }

    if (files?.profilePicture?.[0]) {
      data.profile_picture = `/uploads/candidates/${files.profilePicture[0].filename}`
    }

    if (files?.resume?.[0]) {
      data.resume_url = `/uploads/candidates/${files.resume[0].filename}`
    }

    // Convert password to password_hash for consistency
    if (data.password) {
      data.password_hash = data.password
      delete data.password
    }

    const candidate = await createCandidate(data)
    res.status(201).json({ success: true, data: candidate })
  } catch (error) {
    console.error('Error creating candidate:', error)
    const message = error instanceof Error ? error.message : 'Failed to create candidate'
    const statusCode = message.includes('required') ? 400 : 500
    res.status(statusCode).json({ success: false, error: message })
  }
})

router.put('/:candidateId', upload.fields([{ name: 'profilePicture', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), async (req: Request, res: Response) => {
  try {
    const files = req.files as Record<string, Express.Multer.File[]>
    const data: any = { ...req.body }

    if (files?.profilePicture?.[0]) {
      data.profile_picture = `/uploads/candidates/${files.profilePicture[0].filename}`
    }

    if (files?.resume?.[0]) {
      data.resume_url = `/uploads/candidates/${files.resume[0].filename}`
    }

    // Convert password to password_hash for consistency
    if (data.password) {
      data.password_hash = data.password
      delete data.password
    }

    const candidate = await updateCandidate(req.params.candidateId, data)
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' })
    }
    res.json({ success: true, data: candidate })
  } catch (error) {
    console.error('Error updating candidate:', error)
    const message = error instanceof Error ? error.message : 'Failed to update candidate'
    res.status(500).json({ success: false, error: message })
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
