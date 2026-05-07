import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string, email: string): string {
  return (jwt.sign as any)(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}

export function verifyToken(token: string): any {
  try {
    return (jwt.verify as any)(token, JWT_SECRET)
  } catch {
    return null
  }
}
