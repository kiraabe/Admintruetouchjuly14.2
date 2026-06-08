require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const jwt = require('jsonwebtoken')
const http = require('http')

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Simple proxy function for frontend
function proxyToVite(req, res) {
  const options = {
    hostname: 'localhost',
    port: 5173,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'localhost:5173',
    }
  }

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res)
  })

  proxy.on('error', (err) => {
    console.error('Proxy error:', err)
    res.status(503).json({ error: 'Frontend unavailable' })
  })

  req.pipe(proxy)
}

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5000'],
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Mock user database - in real app this would use PostgreSQL
const mockUsers = {
  'admin-01@truetouchjobs.com': {
    id: '1',
    user_id: 'user-001',
    email: 'admin-01@truetouchjobs.com',
    password_hash: '123Qwe',
    user_name: 'Admin User',
    is_active: true,
    avatar: '',
    authority: 'admin'
  }
}

// Auth routes
app.post('/api/sign-in', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = mockUsers[email]
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is inactive' })
    }

    // Simple password comparison (demo only)
    if (password !== user.password_hash) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { userId: user.user_id || user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({
      token,
      user: {
        userId: user.user_id || user.id,
        userName: user.user_name || 'User',
        authority: [user.authority],
        avatar: user.avatar || '',
        email: user.email,
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Sign in error:', errorMsg, error)
    res.status(500).json({ message: `Internal server error: ${errorMsg}` })
  }
})

// Proxy all other requests to Vite dev server (frontend)
app.use((req, res) => {
  proxyToVite(req, res)
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
}).on('error', (err) => {
  console.error('Server error:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})
