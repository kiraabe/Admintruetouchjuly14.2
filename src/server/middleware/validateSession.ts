import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface AuthRequest extends Request {
  user?: {
    user_id: string
    email: string
    role: string
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const validateSession = (req: AuthRequest, res: Response, next: NextFunction) => {
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

    req.user = decoded
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Session expired' })
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    console.error('Session validation error:', error)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  validateSession(req, res, next)
}
