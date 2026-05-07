import { Router } from 'express'
import { signIn } from './signIn.ts'
import { signUp } from './signUp.ts'
import { authMiddleware } from '../../middleware/auth.ts'

const router = Router()

router.post('/sign-in', signIn)
router.post('/sign-up', signUp)
router.post('/sign-out', (req, res) => {
  res.json({ message: 'Signed out successfully' })
})

router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    userId: req.userId,
    email: req.email,
    message: 'Profile retrieved successfully',
  })
})

export default router
