import express from 'express'
import jwt from 'jsonwebtoken'
import { signIn } from './signIn.ts'
import { signUp } from './signUp.ts'
import { authMiddleware } from '../../middleware/auth.ts'
import { validateSession } from '../../middleware/validateSession.ts'

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
    const newToken = jwt.sign(
      {
        user_id: req.user.user_id,
        email: req.user.email,
        role: req.user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
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
