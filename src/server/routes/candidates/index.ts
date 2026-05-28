import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import type { File } from 'multer'
import path from 'path'
import fs from 'fs'
import FormData from 'form-data'
import axios from 'axios'
import {
  getAllCandidates,
  getCandidateById,
  searchCandidates,
  filterCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../../db/queries/candidateQueries.ts'

declare global {
  namespace Express {
    interface Request {
      file?: File
      files?: File[]
    }
  }
}

const router = Router()

// Configure multer for file uploads
const uploadsBaseDir = path.join(process.cwd(), 'uploads')
const profilePicturesDir = path.join(uploadsBaseDir, 'candidates', 'profile_pictures')
const cvsDir = path.join(uploadsBaseDir, 'candidates', 'cvs')

;[profilePicturesDir, cvsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

const createStorage = (destination: string) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination)
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      const ext = path.extname(file.originalname)
      const name = file.fieldname === 'profilePicture' ? 'profile' : 'resume'
      cb(null, `${name}-${uniqueSuffix}${ext}`)
    },
  })

const profilePictureUpload = multer({
  storage: createStorage(profilePicturesDir),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Profile picture must be an image file'))
    }
  },
})

const resumeUpload = multer({
  storage: createStorage(cvsDir),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (validTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Resume must be PDF, DOC, DOCX, or TXT'))
    }
  },
})

const upload = multer({
  storage: createStorage(profilePicturesDir),
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
    const { search, page: pageStr, limit: limitStr, ...filters } = req.query
    const page = Math.max(1, parseInt(pageStr as string) || 1)
    const limit = Math.min(100, parseInt(limitStr as string) || 10)
    const offset = (page - 1) * limit

    let candidates

    if (search && typeof search === 'string') {
      candidates = await searchCandidates(search)
    } else if (Object.keys(filters).length > 0) {
      candidates = await filterCandidates(filters as any)
    } else {
      candidates = await getAllCandidates()
    }

    const total = candidates?.length || 0
    const paginatedData = candidates?.slice(offset, offset + limit) || []

    res.json({ success: true, data: paginatedData, total, page, limit })
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

router.post('/', (req: Request, res: Response, next) => {
  upload.fields([{ name: 'profilePicture', maxCount: 1 }, { name: 'resume', maxCount: 1 }])(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message })
    next()
  })
}, async (req: Request, res: Response) => {
  try {
    const files = req.files as any
    const data: any = { ...req.body }

    if (files?.profilePicture?.[0]) {
      const file = files.profilePicture[0]
      data.profile_picture = file.filename
      console.log('[CANDIDATE CREATE] Saving profile_picture filename:', file.filename)
    } else if (data.profile_picture) {
      console.log('[CANDIDATE CREATE] Keeping existing profile_picture:', data.profile_picture)
    }

    if (files?.resume?.[0]) {
      data.resume_url = files.resume[0].filename
      console.log('[CANDIDATE CREATE] Saving resume_url (cv) to PostgreSQL:', files.resume[0].filename)
    } else if (data.resume_url) {
      console.log('[CANDIDATE CREATE] Saving resume_url (cv) to PostgreSQL:', data.resume_url)
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

router.put('/:candidateId', (req: Request, res: Response, next) => {
  upload.fields([{ name: 'profilePicture', maxCount: 1 }, { name: 'resume', maxCount: 1 }])(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message })
    next()
  })
}, async (req: Request, res: Response) => {
  try {
    const files = req.files as any
    const data: any = { ...req.body }

    if (files?.profilePicture?.[0]) {
      const file = files.profilePicture[0]
      data.profile_picture = file.filename
      console.log('[CANDIDATE UPDATE] Saving profile_picture filename:', file.filename)
    } else if (data.profile_picture) {
      console.log('[CANDIDATE UPDATE] Keeping existing profile_picture:', data.profile_picture)
    }

    if (files?.resume?.[0]) {
      data.resume_url = files.resume[0].filename
      console.log('[CANDIDATE UPDATE] Saving resume_url (cv) to PostgreSQL:', files.resume[0].filename)
    } else if (data.resume_url) {
      console.log('[CANDIDATE UPDATE] Saving resume_url (cv) to PostgreSQL:', data.resume_url)
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
