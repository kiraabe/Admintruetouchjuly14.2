import 'dotenv/config'
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import candidatesRouter from './routes/candidates/index.ts'
import usersRouter from './routes/users/index.ts'
import partnershipsRouter from './routes/partnerships/index.ts'
import employeeRequestsRouter from './routes/employeeRequests/index.ts'
import standardRequestsRouter from './routes/standardRequests/index.ts'
import specialRequestsRouter from './routes/specialRequests/index.ts'
import licensesRouter from './routes/licenses/index.ts'
import jobsRouter from './routes/jobs/index.ts'
import notificationsRouter from './routes/notifications/index.ts'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

async function comparePasswords(password: string, hash: string): Promise<boolean> {
  // If hash doesn't look like bcrypt, do plain comparison (for backward compatibility)
  if (!hash.startsWith('$2')) {
    return password === hash
  }
  // Use bcrypt for proper password comparison
  return await bcrypt.compare(password, hash)
}

// Dynamic import for pool to avoid circular dependency issues
let pool: any = null

async function initPool() {
  if (!pool) {
    try {
      const poolModule = await import('./db/config.ts')
      pool = poolModule.default
    } catch (err) {
      console.error('Failed to load db config:', err)
      throw new Error('Database connection not available')
    }
  }
  return pool
}

const app = express()
const PORT = process.env.PORT || 5000

// Create uploads directories if they don't exist
const profilesDir = path.join(process.cwd(), 'uploads', 'profiles')
const candidatesDir = path.join(process.cwd(), 'uploads', 'candidates')
const partnershipsDir = path.join(process.cwd(), 'uploads', 'partnerships')
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true })
}
if (!fs.existsSync(candidatesDir)) {
  fs.mkdirSync(candidatesDir, { recursive: true })
}
if (!fs.existsSync(partnershipsDir)) {
  fs.mkdirSync(partnershipsDir, { recursive: true })
}

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})


// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  }),
)
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// Serve uploaded files
const jobsDir = path.join(process.cwd(), 'uploads', 'jobs')
app.use('/uploads/profiles', express.static(profilesDir))
app.use('/uploads/candidates', express.static(candidatesDir))
app.use('/uploads/partnerships', express.static(partnershipsDir))
app.use('/uploads/jobs', express.static(jobsDir))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Migration endpoint - manually trigger column addition
app.get('/api/migrate/add-partnership-id', async (req, res) => {
  try {
    const dbPool = await initPool()

    // Check if column already exists
    const checkColumn = await dbPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'partnership_id'
      )
    `)

    if (checkColumn.rows[0].exists) {
      return res.json({
        status: 'ALREADY_EXISTS',
        message: 'partnership_id column already exists in users table'
      })
    }

    // Add the column
    await dbPool.query(`
      ALTER TABLE users
      ADD COLUMN partnership_id UUID
    `)

    res.json({
      status: 'SUCCESS',
      message: 'partnership_id column added to users table'
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    res.status(500).json({
      status: 'ERROR',
      error: errorMsg
    })
  }
})

// Debug endpoint to list all users (remove in production)
app.get('/api/debug/users', async (req, res) => {
  try {
    const dbPool = await initPool()
    const result = await dbPool.query('SELECT id, user_id, email, user_name, authority, is_active, partnership_id FROM users')
    res.json({ users: result.rows })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch users' })
  }
})

// Debug endpoint to check employee requests table
app.get('/api/debug/employee-requests', async (req, res) => {
  try {
    const dbPool = await initPool()

    // Check if table exists
    const tableCheck = await dbPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'employee_requests'
      )
    `)
    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      return res.json({
        status: 'TABLE_MISSING',
        message: 'Employee requests table does not exist',
        tableExists: false
      })
    }

    // Get column info
    const columns = await dbPool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'employee_requests'
      ORDER BY ordinal_position
    `)

    // Count rows
    const count = await dbPool.query('SELECT COUNT(*) as count FROM employee_requests')

    res.json({
      status: 'OK',
      tableExists: true,
      rowCount: count.rows[0].count,
      columns: columns.rows
    })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to check employee requests table',
      details: error
    })
  }
})

// Debug endpoint to check partnerships table
app.get('/api/debug/partnerships', async (req, res) => {
  try {
    const dbPool = await initPool()

    // Check if table exists
    const tableCheck = await dbPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'partnerships'
      )
    `)
    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      return res.json({
        status: 'TABLE_MISSING',
        message: 'Partnerships table does not exist',
        tableExists: false
      })
    }

    // Get column info
    const columns = await dbPool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'partnerships'
      ORDER BY ordinal_position
    `)

    // Count rows
    const count = await dbPool.query('SELECT COUNT(*) as count FROM partnerships')

    res.json({
      status: 'OK',
      tableExists: true,
      rowCount: count.rows[0].count,
      columns: columns.rows
    })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to check partnerships table',
      details: error
    })
  }
})

// Test employee requests table
app.get('/api/test-employee-requests', async (req, res) => {
  try {
    const dbPool = await initPool()
    const result = await dbPool.query('SELECT 1 as test')
    res.json({ success: true, message: 'Database connection working', data: result.rows })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: errorMsg })
  }
})

// Seed employee requests with test data
app.get('/api/seed-employee-requests', async (req: Request, res: Response) => {
  const dbPool = await initPool()

  try {
    // First ensure all columns exist
    const alterCommands = [
      `ALTER TABLE employee_requests ADD COLUMN IF NOT EXISTS request_type VARCHAR(50) DEFAULT 'Standard'`,
      `ALTER TABLE employee_requests ADD COLUMN IF NOT EXISTS salary_range VARCHAR(255)`,
      `ALTER TABLE employee_requests ADD COLUMN IF NOT EXISTS required_skills TEXT`,
      `ALTER TABLE employee_requests ADD COLUMN IF NOT EXISTS work_city VARCHAR(255)`,
      `ALTER TABLE employee_requests ADD COLUMN IF NOT EXISTS urgency VARCHAR(50)`,
    ]

    for (const cmd of alterCommands) {
      try {
        await dbPool.query(cmd)
      } catch (e) {
        console.log(`Column already exists or error: ${e}`)
      }
    }

    // Clear existing data
    await dbPool.query('DELETE FROM employee_requests')
    console.log('Cleared existing employee requests')

    // Insert seed data
    const insertResult = await dbPool.query(`
      INSERT INTO employee_requests (
        request_type, company_name, contact_person, email, phone_number,
        position, number_of_employees, start_date, location, status,
        requirements, notes, salary_range, required_skills, work_city, urgency
      ) VALUES
      ('Standard', 'Tech Solutions Inc.', 'John Smith', 'john@techsolutions.com', '+1-555-0101',
       'Software Engineer', 5, '2024-06-01', 'New York, NY', 'Pending',
       NULL, 'Urgent need for experienced developers', NULL, NULL, NULL, NULL),
      ('Standard', 'Global Manufacturing Ltd.', 'Sarah Johnson', 'sarah@globalmfg.com', '+1-555-0102',
       'Production Manager', 20, '2024-06-15', 'Chicago, IL', 'Approved',
       NULL, 'To manage production floor operations', NULL, NULL, NULL, NULL),
      ('Special', 'Healthcare Services', 'Dr. Michael Chen', 'michael@healthcare.com', '+1-555-0103',
       'Medical Staff', 15, '2024-07-01', 'Los Angeles, CA', 'In Progress',
       'Certified nurses and healthcare professionals required', 'Immediate staffing required for new facility', '$35,000-$45,000/month', 'Nursing, Medical certification, Patient care', 'Los Angeles', 'High'),
      ('Standard', 'Finance & Associates', 'Emma Wilson', 'emma@finance-assoc.com', '+1-555-0104',
       'Financial Analyst', 8, '2024-07-20', 'Boston, MA', 'Pending',
       NULL, 'Need analytical skills and CPA preferred', NULL, NULL, NULL, NULL),
      ('Special', 'Creative Design Studio', 'Alex Rodriguez', 'alex@creativedesign.com', '+1-555-0105',
       'Design Team Lead', 12, '2024-08-01', 'San Francisco, CA', 'Rejected',
       'Portfolio review required, minimum 5 years UI/UX experience', 'Specialized design team for major project', '$50,000-$60,000/month', 'UI/UX Design, Figma, Adobe Creative Suite', 'San Francisco', 'Medium'),
      ('Standard', 'Retail Operations', 'Linda Davis', 'linda@retail-ops.com', '+1-555-0106',
       'Store Manager', 30, '2024-08-15', 'Houston, TX', 'Pending',
       NULL, 'Multiple store locations opening', NULL, NULL, NULL, NULL)
      RETURNING *
    `)

    console.log(`Successfully inserted ${insertResult.rows.length} records`)
    return res.json({
      success: true,
      message: `Seeded ${insertResult.rows.length} employee requests`,
      data: insertResult.rows
    })
  } catch (error) {
    console.error('Error seeding:', error)
    return res.json({ success: false, error: error instanceof Error ? error.message : String(error) })
  }
})

// API Routes
app.use('/api/candidates', candidatesRouter)
app.use('/api/partnerships', partnershipsRouter)
app.use('/api/users', usersRouter)
app.use('/api/employee-requests', employeeRequestsRouter)
app.use('/api/standard-requests', standardRequestsRouter)
app.use('/api/special-requests', specialRequestsRouter)
app.use('/api/licenses', licensesRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/notification', notificationsRouter)

// Auth routes
app.post('/api/sign-in', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const dbPool = await initPool()
    const result = await dbPool.query(
      'SELECT id, user_id, email, password_hash, user_name, is_active, avatar, authority, partnership_id FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const user = result.rows[0]

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is inactive' })
    }

    const isPasswordValid = await comparePasswords(password, user.password_hash)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = generateToken(user.user_id || user.id.toString(), user.email)

    res.json({
      token,
      user: {
        userId: user.user_id || user.id.toString(),
        userName: user.user_name || 'User',
        authority: [user.authority],
        avatar: user.avatar || '',
        email: user.email,
        partnershipId: user.partnership_id || null,
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Sign in error:', errorMsg, error)
    res.status(500).json({ message: `Internal server error: ${errorMsg}` })
  }
})

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

// Initialize database and start server
async function startServer() {
  try {
    const dbPool = await initPool()

    // Run migrations
    console.log('Initializing database...')

    // Create users table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id UUID DEFAULT gen_random_uuid() UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_name VARCHAR(255),
        authority VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        avatar VARCHAR(255),
        partnership_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Add partnership_id column if it doesn't exist (for existing databases)
    try {
      const columnCheck = await dbPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'partnership_id'
        )
      `)

      if (!columnCheck.rows[0].exists) {
        await dbPool.query(`
          ALTER TABLE users
          ADD COLUMN partnership_id UUID
        `)
        console.log('✓ partnership_id column added to users table')
      } else {
        console.log('✓ partnership_id column already exists in users table')
      }
    } catch (err) {
      console.error('Error adding partnership_id column:', err instanceof Error ? err.message : err)
    }

    // Seed test user
    const hashedPassword = await bcrypt.hash('123Qwe', 10)
    await dbPool.query(`
      INSERT INTO users (email, password_hash, user_name, authority, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['admin-01@ecme.com', hashedPassword, 'Admin', 'admin', true])

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        candidate_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        passport_number VARCHAR(255),
        phone_number VARCHAR(20),
        password_hash VARCHAR(255),
        profile_picture VARCHAR(255),
        gender VARCHAR(50),
        age INT,
        date_of_birth DATE,
        nationality VARCHAR(255),
        religion VARCHAR(255),
        marital_status VARCHAR(50),
        occupation VARCHAR(255),
        job_category VARCHAR(255),
        skill_level VARCHAR(100),
        education_level VARCHAR(100),
        language_skills TEXT,
        country VARCHAR(255),
        city VARCHAR(255),
        current_location VARCHAR(255),
        resume_url VARCHAR(255),
        medical_status VARCHAR(255),
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Add status column if it doesn't exist (for existing databases)
    await dbPool.query(`
      ALTER TABLE candidates
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available'
    `)

    try {
      console.log('Creating partnerships table...')
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS partnerships (
          id SERIAL PRIMARY KEY,
          partner_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          company_logo VARCHAR(255),
          business_email VARCHAR(255) UNIQUE NOT NULL,
          business_category VARCHAR(100) NOT NULL,
          license_number VARCHAR(255) NOT NULL,
          license_document VARCHAR(255),
          contact_person_name VARCHAR(255) NOT NULL,
          phone_number VARCHAR(20) NOT NULL,
          service_city VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('✓ Partnerships table ready')

      // Add foreign key constraint from users to partnerships
      try {
        const constraintCheck = await dbPool.query(`
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_name = 'users' AND constraint_name = 'fk_users_partnership_id'
        `)

        if (constraintCheck.rows.length === 0) {
          await dbPool.query(`
            ALTER TABLE users
            ADD CONSTRAINT fk_users_partnership_id
            FOREIGN KEY (partnership_id) REFERENCES partnerships(partner_id) ON DELETE CASCADE
          `)
          console.log('✓ Foreign key constraint added from users to partnerships')
        } else {
          console.log('✓ Foreign key constraint already exists')
        }
      } catch (fkError) {
        console.log('Note: Foreign key constraint setup:', fkError instanceof Error ? fkError.message : fkError)
      }
    } catch (tableError) {
      console.error('Error creating partnerships table:', tableError)
    }

    try {
      console.log('Creating employee_requests table...')
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS employee_requests (
          id SERIAL PRIMARY KEY,
          request_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
          request_type VARCHAR(50) DEFAULT 'Standard',
          company_name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone_number VARCHAR(20),
          position VARCHAR(255) NOT NULL,
          number_of_employees INT NOT NULL,
          start_date DATE,
          location VARCHAR(255),
          status VARCHAR(50) DEFAULT 'Pending',
          requirements TEXT,
          notes TEXT,
          salary_range VARCHAR(255),
          required_skills TEXT,
          work_city VARCHAR(255),
          urgency VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('✓ Employee Requests table ready')

      // Add missing columns to employee_requests if they don't exist
      const missingColumns = ['request_type', 'salary_range', 'required_skills', 'work_city', 'urgency', 'partnership_id']
      for (const col of missingColumns) {
        try {
          if (col === 'request_type') {
            await dbPool.query(`ALTER TABLE employee_requests ADD COLUMN ${col} VARCHAR(50) DEFAULT 'Standard'`)
          } else if (col === 'partnership_id') {
            await dbPool.query(`ALTER TABLE employee_requests ADD COLUMN ${col} UUID`)
          } else if (col === 'salary_range' || col === 'required_skills' || col === 'work_city' || col === 'urgency') {
            await dbPool.query(`ALTER TABLE employee_requests ADD COLUMN ${col} VARCHAR(255)`)
          }
        } catch (e) {
          // Column likely already exists, ignore
        }
      }

      // Seed hardcoded data for testing
      const existingCount = await dbPool.query('SELECT COUNT(*) as count FROM employee_requests')
      if (existingCount.rows[0].count === 0) {
        console.log('Seeding employee_requests with test data...')
        await dbPool.query(`
          INSERT INTO employee_requests (
            request_type, company_name, contact_person, email, phone_number,
            position, number_of_employees, start_date, location, status,
            requirements, notes, salary_range, required_skills, work_city, urgency
          ) VALUES
          (
            'Standard', 'Tech Solutions Inc.', 'John Smith', 'john@techsolutions.com', '+1-555-0101',
            'Software Engineer', 5, '2024-06-01', 'New York, NY', 'Pending',
            NULL, 'Urgent need for experienced developers', NULL, NULL, NULL, NULL
          ),
          (
            'Standard', 'Global Manufacturing Ltd.', 'Sarah Johnson', 'sarah@globalmfg.com', '+1-555-0102',
            'Production Manager', 20, '2024-06-15', 'Chicago, IL', 'Approved',
            NULL, 'To manage production floor operations', NULL, NULL, NULL, NULL
          ),
          (
            'Special', 'Healthcare Services', 'Dr. Michael Chen', 'michael@healthcare.com', '+1-555-0103',
            'Medical Staff', 15, '2024-07-01', 'Los Angeles, CA', 'In Progress',
            'Certified nurses and healthcare professionals required', 'Immediate staffing required for new facility', '$35,000-$45,000/month', 'Nursing, Medical certification, Patient care', 'Los Angeles', 'High'
          ),
          (
            'Standard', 'Finance & Associates', 'Emma Wilson', 'emma@finance-assoc.com', '+1-555-0104',
            'Financial Analyst', 8, '2024-07-20', 'Boston, MA', 'Pending',
            NULL, 'Need analytical skills and CPA preferred', NULL, NULL, NULL, NULL
          ),
          (
            'Special', 'Creative Design Studio', 'Alex Rodriguez', 'alex@creativedesign.com', '+1-555-0105',
            'Design Team Lead', 12, '2024-08-01', 'San Francisco, CA', 'Rejected',
            'Portfolio review required, minimum 5 years UI/UX experience', 'Specialized design team for major project', '$50,000-$60,000/month', 'UI/UX Design, Figma, Adobe Creative Suite', 'San Francisco', 'Medium'
          ),
          (
            'Standard', 'Retail Operations', 'Linda Davis', 'linda@retail-ops.com', '+1-555-0106',
            'Store Manager', 30, '2024-08-15', 'Houston, TX', 'Pending',
            NULL, 'Multiple store locations opening', NULL, NULL, NULL, NULL
          )
        `)
        console.log('✓ Employee requests test data seeded')
      }
    } catch (tableError) {
      console.error('Error creating employee_requests table:', tableError)
    }

    try {
      console.log('Creating licenses table...')
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS licenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          license_number VARCHAR(255) UNIQUE NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          business_type VARCHAR(255),
          issue_date DATE,
          expiry_date DATE,
          status VARCHAR(50) DEFAULT 'pending',
          document_url VARCHAR(255),
          issued_by VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('✓ Licenses table ready')
    } catch (tableError) {
      console.error('Error creating licenses table:', tableError)
    }

    try {
      console.log('Creating jobs table...')
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(56) NOT NULL,
          description VARCHAR(78) NOT NULL,
          author VARCHAR(15) DEFAULT 'admin',
          image_url VARCHAR(255),
          expire_date DATE NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('✓ Jobs table ready')
    } catch (tableError) {
      console.error('Error creating jobs table:', tableError)
    }

    try {
      console.log('Creating notifications table...')
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          notification_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
          user_id UUID,
          target VARCHAR(255) NOT NULL,
          description TEXT,
          type INT DEFAULT 1,
          status VARCHAR(50) DEFAULT 'Pending',
          location VARCHAR(255),
          location_label VARCHAR(255),
          image_url VARCHAR(255),
          readed BOOLEAN DEFAULT false,
          related_entity_id UUID,
          related_entity_type VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('✓ Notifications table ready')

      // Seed initial notification data if table is empty
      try {
        const notificationCount = await dbPool.query('SELECT COUNT(*)::INTEGER as count FROM notifications')
        const count = notificationCount.rows[0]?.count || 0
        console.log(`Current notification count: ${count}`)

        if (count === 0) {
          console.log('Seeding notifications with test data...')

          const insertQueries = [
            {
              target: 'Tech Solutions Inc.',
              description: 'New employee request for Software Engineer position',
              type: 1,
              status: 'Pending',
              location: 'New York, NY',
              location_label: 'Standard Request'
            },
            {
              target: 'Global Services Ltd.',
              description: 'Employee request requires review - 10 positions needed',
              type: 1,
              status: 'Pending',
              location: 'London, UK',
              location_label: 'Special Request'
            },
            {
              target: 'Innovation Labs',
              description: 'New candidate application received',
              type: 1,
              status: 'Processing',
              location: 'San Francisco, CA',
              location_label: 'Candidate'
            },
            {
              target: 'DataFlow Systems',
              description: 'Pending approval for 5 new positions',
              type: 1,
              status: 'Pending',
              location: 'Singapore',
              location_label: 'Standard Request'
            }
          ]

          for (const notif of insertQueries) {
            await dbPool.query(`
              INSERT INTO notifications (
                target, description, type, status, location, location_label, readed
              ) VALUES ($1, $2, $3, $4, $5, $6, false)
            `, [notif.target, notif.description, notif.type, notif.status, notif.location, notif.location_label])
          }

          console.log('✓ Notifications seeded with 4 records')
        } else {
          console.log(`✓ Notifications table already has ${count} records`)
        }
      } catch (seedError) {
        console.error('Error seeding notifications:', seedError instanceof Error ? seedError.message : seedError)
      }
    } catch (tableError) {
      console.error('Error creating notifications table:', tableError)
    }

    console.log('✓ Database initialized')

    const server = app.listen(PORT, () => {
      console.log(`✓ Server is running on http://localhost:${PORT}`)
      console.log(`✓ Health check: http://localhost:${PORT}/health`)
    })

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        const newPort = parseInt(PORT as string) + 1
        console.log(`Port ${PORT} is in use, trying ${newPort}...`)
        server.listen(newPort, () => {
          console.log(`✓ Server is running on http://localhost:${newPort}`)
          console.log(`✓ Health check: http://localhost:${newPort}/health`)
        })
      } else {
        console.error('Server error:', err)
        process.exit(1)
      }
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})
