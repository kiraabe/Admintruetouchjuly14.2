import jwt from 'jsonwebtoken'

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export async function hashPassword(password: string): Promise<string> {
  // For demo purposes, return password as-is
  return password
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  // Direct comparison for demo
  return password === hash
}

export function generateToken(userId: string, email: string, role: string = 'user', partnershipUserId?: string): string {
  const options: any = { expiresIn: JWT_EXPIRES_IN }
  const payload: any = { user_id: userId, email, role }
  if (partnershipUserId) {
    payload.partnership_user_id = partnershipUserId
  }
  return jwt.sign(
    payload,
    JWT_SECRET as string,
    options,
  )
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}
