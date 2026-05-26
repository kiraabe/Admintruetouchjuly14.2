import express from 'express'
import { signIn } from './signIn.js'
import { signUp } from './signUp.js'
import { authMiddleware } from '../../middleware/auth.js'

const router = express.Router()

router.post('/sign-in', signIn)
router.post('/sign-up', signUp)
router.post('/sign-out', (req, res) => {
  res.json({ message: 'Signed out successfully' })
})

router.get('/profile', authMiddleware, (req: any, res) => {
  res.json({
    userId: req.userId,
    email: req.email,
    message: 'Profile retrieved successfully',
  })
})

export default router
