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

// Auth routes
app.post('/api/sign-in', (req, res) => {
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
        authority: ['admin'],
        avatar: '',
        email: email,
      },
    })
  } catch (err) {
    console.error('Sign in error:', err)
    res.status(500).json({ message: 'Internal server error' })
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
