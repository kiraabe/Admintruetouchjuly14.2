import express from 'express'
import jwt from 'jsonwebtoken'
import { signIn } from './signIn'
import { signUp } from './signUp'
import { authMiddleware } from '../../middleware/auth'
import { validateSession } from '../../middleware/validateSession'

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

router.post('/refresh', validateSession, (req: any, res) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m'

    // Generate new token
    const payload: any = {
      user_id: req.user.user_id,
      email: req.user.email,
      role: req.user.role,
    }
    if (req.user.partnership_user_id) {
      payload.partnership_user_id = req.user.partnership_user_id
    }

    const newToken = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    )

    res.json({
      success: true,
      token: newToken,
      message: 'Session extended successfully',
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ error: 'Failed to refresh session' })
  }
})

export default router
