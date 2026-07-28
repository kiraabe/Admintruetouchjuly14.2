import { Router } from 'express'
import {
  getGenderOptions,
  getReligionOptions,
  getMaritalStatusOptions,
  getJobCategoryOptions,
  getEducationLevelOptions,
  getMedicalStatusOptions,
  getAllDropdownOptions,
} from '../../db/queries/dropdownQueries'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const locale = (req.query.locale as string) || 'en'
    const options = await getAllDropdownOptions(locale)
    res.json({ success: true, data: options })
  } catch (error) {
    console.error('Error fetching dropdown options:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch dropdown options' })
  }
})

router.get('/genders', async (req, res) => {
  try {
    const locale = (req.query.locale as string) || 'en'
    const options = await getGenderOptions(locale)
    res.json({ success: true, data: options })
  } catch (error) {
    console.error('Error fetching gender options:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch gender options' })
  }
})

router.get('/religions', async (req, res) => {
  try {
    const locale = (req.query.locale as string) || 'en'
    const options = await getReligionOptions(locale)
    res.json({ success: true, data: options })
  } catch (error) {
    console.error('Error fetching religion options:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch religion options' })
  }
})

router.get('/marital-statuses', async (req, res) => {
  try {
    const locale = (req.query.locale as string) || 'en'
    const options = await getMaritalStatusOptions(locale)
    res.json({ success: true, data: options })
  } catch (error) {
    console.error('Error fetching marital status options:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch marital status options' })
  }
})

router.get('/job-categories', async (req, res) => {
  try {
    const locale = (req.query.locale as string) || 'en'
    const options = await getJobCategoryOptions(locale)
    res.json({ success: true, data: options })
  } catch (error) {
    console.error('Error fetching job category options:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch job category options' })
  }
})

router.get('/education-levels', async (req, res) => {
  try {
    const locale = (req.query.locale as string) || 'en'
    const options = await getEducationLevelOptions(locale)
    res.json({ success: true, data: options })
  } catch (error) {
    console.error('Error fetching education level options:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch education level options' })
  }
})

router.get('/medical-statuses', async (req, res) => {
  try {
    const locale = (req.query.locale as string) || 'en'
    const options = await getMedicalStatusOptions(locale)
    res.json({ success: true, data: options })
  } catch (error) {
    console.error('Error fetching medical status options:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch medical status options' })
  }
})

export default router
