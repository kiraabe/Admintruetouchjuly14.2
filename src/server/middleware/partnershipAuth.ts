import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface PartnershipAuthRequest extends Request {
  user?: {
    user_id: string
    email: string
    role: string
    partnership_user_id?: string
  }
  partnershipUserId?: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const validatePartnershipSession = (req: PartnershipAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token

    if (!token) {
      console.error('Partnership auth: No token provided')
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log('Partnership auth: Token decoded:', { role: decoded.role, has_partnership_user_id: !!decoded.partnership_user_id })

    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: 'Session expired' })
    }

    // For partnership users, ensure partnership_user_id is present
    if (decoded.role === 'partnership') {
      if (!decoded.partnership_user_id) {
        console.error('Partnership auth: Missing partnership_user_id for partnership user')
        return res.status(401).json({ error: 'Invalid token: missing partnership_user_id' })
      }
    } else if (decoded.role !== 'admin') {
      // Only allow partnership or admin users
      console.error('Partnership auth: Invalid role:', decoded.role)
      return res.status(403).json({ error: 'Forbidden: Invalid user role' })
    }
    // Note: Admin users are allowed but will be checked by endpoint for partnership_id

    req.user = decoded
    req.partnershipUserId = decoded.partnership_user_id
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Session expired' })
    }

    if (error instanceof jwt.JsonWebTokenError) {
      console.error('Partnership session validation error:', error.message)
      return res.status(401).json({ error: 'Invalid token' })
    }

    console.error('Partnership session validation error:', error)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export const validateAdminSession = (req: PartnershipAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: 'Session expired' })
    }

    // Only allow admin users, reject partnership tokens
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin users can access this endpoint' })
    }

    req.user = decoded
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Session expired' })
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    console.error('Admin session validation error:', error)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
