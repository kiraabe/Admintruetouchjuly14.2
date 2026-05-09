import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import {
  getAllPartnerships,
  getPartnershipById,
  searchPartnerships,
  filterPartnerships,
  createPartnership,
  updatePartnership,
  deletePartnership,
} from '../../db/queries/partnershipQueries.ts'

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

router.get('/', async (req, res) => {
  try {
    const { search, ...filters } = req.query

    let partnerships

    if (search && typeof search === 'string') {
      partnerships = await searchPartnerships(search)
    } else if (Object.keys(filters).length > 0) {
      partnerships = await filterPartnerships(filters)
    } else {
      partnerships = await getAllPartnerships()
    }

    res.json({ success: true, data: partnerships || [] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching partnerships:', errorMsg, error)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

router.get('/:partnerId', async (req, res) => {
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

router.post('/', upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
]), async (req, res) => {
  try {
    const { company_name, business_email, business_category, license_number, contact_person_name, phone_number, service_city, status } = req.body
    const files = req.files as { [key: string]: Express.Multer.File[] }

    if (!company_name || !business_email || !business_category || !license_number || !contact_person_name || !phone_number || !service_city) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    const data: any = {
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
      data.company_logo = `/uploads/partnerships/${files.companyLogo[0].filename}`
    }

    if (files?.licenseDocument?.[0]) {
      data.license_document = `/uploads/partnerships/${files.licenseDocument[0].filename}`
    }

    const partnership = await createPartnership(data)
    res.json({ success: true, data: partnership })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error creating partnership:', errorMsg, error)
    res.status(500).json({ success: false, error: errorMsg })
  }
})

router.put('/:partnerId', upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
]), async (req, res) => {
  try {
    const files = req.files as { [key: string]: Express.Multer.File[] }
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

router.delete('/:partnerId', async (req, res) => {
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
