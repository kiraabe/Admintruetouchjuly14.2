import jwt, { type Secret } from 'jsonwebtoken'

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key'

export async function hashPassword(password: string): Promise<string> {
  // For demo purposes, return password as-is
  return password
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  // Direct comparison for demo
  return password === hash
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  )
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}
