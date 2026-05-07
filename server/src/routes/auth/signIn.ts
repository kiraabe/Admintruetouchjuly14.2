import { Request, Response } from 'express'
import { getUserByEmail } from '../../db/queries/userQueries.ts'
import { comparePasswords, generateToken } from '../../utils/auth.ts'

export async function signIn(req: Request, res: Response) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is inactive' })
    }

    const isPasswordValid = await comparePasswords(password, user.password_hash)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = generateToken(user.user_id, user.email)

    res.json({
      token,
      user: {
        userId: user.user_id,
        userName: user.user_name || 'User',
        authority: [user.authority],
        avatar: user.avatar || '',
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Sign in error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
