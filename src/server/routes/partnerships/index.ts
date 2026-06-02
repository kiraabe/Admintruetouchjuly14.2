import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import type { File } from 'multer'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import pool from '../../db/config'
import { validateAdminSession, validatePartnershipSession } from '../../middleware/partnershipAuth'
import {
  getAllPartnerships,
  getPartnershipById,
  searchPartnerships,
  filterPartnerships,
  createPartnership,
  updatePartnership,
  deletePartnership,
  getPartnershipIdByUserId,
} from '../../db/queries/partnershipQueries'

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
const uploadsDir = path.join(process.cwd(), 'uploads', 'partnerships')
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
    const name = file.fieldname === 'companyLogo' ? 'logo' : 'license'
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'companyLogo') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true)
      } else {
        cb(new Error('Company logo must be an image file'))
      }
    } else if (file.fieldname === 'licenseDocument') {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg',
      ]
      if (validTypes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error('License document must be PDF, DOC, DOCX, or image'))
      }
    } else {
      cb(new Error('Invalid file field'))
    }
  },
})

router.get('/', validateAdminSession, async (req, res) => {
  try {
    console.log('GET /api/partnerships - start')
    const { search, page: pageStr, limit: limitStr, ...filters } = req.query
    const page = Math.max(1, parseInt(pageStr as string) || 1)
    const limit = Math.min(100, parseInt(limitStr as string) || 10)
    const offset = (page - 1) * limit
    console.log('Query params:', { search, filters, page, limit })

    let partnerships

    if (search && typeof search === 'string') {
      console.log('Searching partnerships:', search)
      partnerships = await searchPartnerships(search)
    } else if (Object.keys(filters).length > 0) {
      console.log('Filtering partnerships:', filters)
      partnerships = await filterPartnerships(filters)
    } else {
      console.log('Getting all partnerships')
      partnerships = await getAllPartnerships()
    }

    const total = partnerships?.length || 0
    const paginatedData = partnerships?.slice(offset, offset + limit) || []

    console.log('Got partnerships:', paginatedData?.length)
    res.json({ success: true, data: paginatedData, total, page, limit })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching partnerships:', errorMsg)
    console.error('Full error:', error)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

router.get('/own/data', validatePartnershipSession, async (req, res) => {
  try {
    const userId = (req as any).user.user_id
    const partnerId = await getPartnershipIdByUserId(userId)

    if (!partnerId) {
      return res.status(404).json({ success: false, error: 'Partnership not found' })
    }

    const partnership = await getPartnershipById(partnerId)
    if (!partnership) {
      return res.status(404).json({ success: false, error: 'Partnership not found' })
    }

    res.json({ success: true, data: partnership })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

router.get('/:partnerId', validatePartnershipSession, async (req, res) => {
  try {
    const userId = (req as any).user.user_id
    const userPartnerId = await getPartnershipIdByUserId(userId)

    if (!userPartnerId || userPartnerId !== req.params.partnerId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot access this partnership' })
    }

    const partnership = await getPartnershipById(req.params.partnerId)
    if (!partnership) {
      return res.status(404).json({ success: false, error: 'Partnership not found' })
    }
    res.json({ success: true, data: partnership })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

router.get('/admin/:partnerId', validateAdminSession, async (req, res) => {
  try {
    const partnership = await getPartnershipById(req.params.partnerId)
    if (!partnership) {
      return res.status(404).json({ success: false, error: 'Partnership not found' })
    }
    res.json({ success: true, data: partnership })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

router.post('/', validateAdminSession, upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
]), async (req, res) => {
  const client = await pool.connect()
  try {
    console.log('POST /api/partnerships - body:', req.body)
    console.log('POST /api/partnerships - files:', req.files ? Object.keys(req.files) : 'no files')

    const { company_name, business_email, business_category, license_number, contact_person_name, phone_number, service_city, status } = req.body
    const files = req.files as any

    if (!company_name || !business_email || !business_category || !license_number || !contact_person_name || !phone_number || !service_city) {
      console.log('Missing fields:', { company_name, business_email, business_category, license_number, contact_person_name, phone_number, service_city })
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    await client.query('BEGIN')

    // Create partnership first to get partner_id
    const partnerId = randomUUID()
    const partnershipData: any = {
      company_name,
      business_email,
      business_category,
      license_number,
      contact_person_name,
      phone_number,
      service_city,
      status: status || 'pending',
    }

    if (files?.companyLogo?.[0]) {
      partnershipData.company_logo = `/uploads/partnerships/${files.companyLogo[0].filename}`
    }

    if (files?.licenseDocument?.[0]) {
      partnershipData.license_document = `/uploads/partnerships/${files.licenseDocument[0].filename}`
    }

    const keys = Object.keys(partnershipData)
    const allKeys = ['partner_id', ...keys]
    const allValues = [partnerId, ...keys.map((k) => partnershipData[k])]
    const keysStr = allKeys.join(', ')
    const placeholders = allKeys.map((_, i) => `$${i + 1}`).join(', ')

    const query = `INSERT INTO partnerships (${keysStr}) VALUES (${placeholders}) RETURNING *`
    console.log('Creating partnership with data:', partnershipData)

    const partnershipResult = await client.query(query, allValues)
    const partnership = partnershipResult.rows[0]
    console.log('Partnership created:', partnership)

    // Create user for the partnership with partnership_id
    const password = Math.random().toString(36).slice(-12)
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = randomUUID()

    console.log('Creating user for partnership with email:', business_email)
    const userResult = await client.query(
      `INSERT INTO users (user_id, email, password_hash, user_name, authority, is_active, partnership_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, email, user_name, authority, is_active, partnership_id, created_at`,
      [userId, business_email, hashedPassword, contact_person_name || company_name, 'partnership', true, partnerId]
    )

    const user = userResult.rows[0]
    console.log('User created:', user)

    await client.query('COMMIT')
    res.json({ success: true, data: partnership, user: user })
  } catch (error) {
    await client.query('ROLLBACK')
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error creating partnership:', errorMsg, error)
    res.status(500).json({ success: false, error: errorMsg })
  } finally {
    client.release()
  }
})

router.put('/:partnerId', validateAdminSession, upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
]), async (req, res) => {
  try {
    const files = req.files as any
    const data: any = { ...req.body }

    if (files?.companyLogo?.[0]) {
      data.company_logo = `/uploads/partnerships/${files.companyLogo[0].filename}`
    }

    if (files?.licenseDocument?.[0]) {
      data.license_document = `/uploads/partnerships/${files.licenseDocument[0].filename}`
    }

    const partnership = await updatePartnership(req.params.partnerId, data)
    if (!partnership) {
      return res.status(404).json({ success: false, error: 'Partnership not found' })
    }
    res.json({ success: true, data: partnership })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error updating partnership:', errorMsg, error)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

router.put('/own/data', validatePartnershipSession, upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
]), async (req, res) => {
  try {
    const userId = (req as any).user.user_id
    const partnerId = await getPartnershipIdByUserId(userId)

    if (!partnerId) {
      return res.status(403).json({ success: false, error: 'Forbidden: No partnership found for this user' })
    }

    const files = req.files as any
    const data: any = { ...req.body }

    if (files?.companyLogo?.[0]) {
      data.company_logo = `/uploads/partnerships/${files.companyLogo[0].filename}`
    }

    if (files?.licenseDocument?.[0]) {
      data.license_document = `/uploads/partnerships/${files.licenseDocument[0].filename}`
    }

    const partnership = await updatePartnership(partnerId, data)
    if (!partnership) {
      return res.status(404).json({ success: false, error: 'Partnership not found' })
    }
    res.json({ success: true, data: partnership })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error updating own partnership:', errorMsg, error)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

router.delete('/:partnerId', validateAdminSession, async (req, res) => {
  try {
    const deleted = await deletePartnership(req.params.partnerId)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Partnership not found' })
    }
    res.json({ success: true, message: 'Partnership deleted' })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

export default router
