import { Request, Response } from 'express'
import { getUserByEmail, createUser } from '../../db/queries/userQueries.ts'
import { hashPassword, generateToken } from '../../utils/auth.ts'

export async function signUp(req: Request, res: Response) {
  try {
    const { email, password, userName } = req.body

    if (!email || !password || !userName) {
      return res.status(400).json({ error: 'Email, password, and username are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' })
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser(email, passwordHash, userName)

    const token = generateToken(user.user_id, user.email)

    res.status(201).json({
      token,
      user: {
        userId: user.user_id,
        userName: user.user_name,
        authority: [user.authority],
        avatar: user.avatar,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Sign up error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
