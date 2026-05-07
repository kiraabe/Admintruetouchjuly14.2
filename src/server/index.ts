import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Mock auth routes for development
app.post('/api/auth/sign-in', (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Mock successful login for development
    res.json({
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        userId: 'user-123',
        userName: email.split('@')[0],
        authority: ['user'],
        avatar: '',
        email: email,
      },
    })
  } catch (err) {
    console.error('Sign in error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/auth/sign-up', (req, res) => {
  try {
    const { email, password, userName } = req.body

    if (!email || !password || !userName) {
      return res.status(400).json({ message: 'Email, password, and username are required' })
    }

    // Mock successful signup for development
    res.status(201).json({
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        userId: 'user-' + Date.now(),
        userName: userName,
        authority: ['user'],
        avatar: '',
        email: email,
      },
    })
  } catch (err) {
    console.error('Sign up error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/api/auth/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }
    res.json({ userId: 'user-123', email: 'user@example.com' })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Error handling
app.use((err: any, req: express.Request, res: express.Response) => {
  console.error('Server error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})
