# Sign-In Real Backend Integration - Complete Setup

## ✅ What's Been Set Up

### Frontend Sign-In
- ✅ Form validation with Zod schema
- ✅ React Hook Form integration
- ✅ Error message handling
- ✅ Loading states during sign-in
- ✅ Default test credentials (auto-filled)

### Authentication System
- ✅ AuthProvider with sign-in/sign-up/sign-out
- ✅ useAuth hook for easy access
- ✅ Token storage (cookies by default)
- ✅ Session management with Zustand store
- ✅ Automatic redirects after auth

### API Integration
- ✅ Axios-based API client
- ✅ Authorization header injection
- ✅ Token refresh on errors
- ✅ CORS configuration
- ✅ Error handling middleware

### Backend API
- ✅ Express.js server (port 3000)
- ✅ Sign-in endpoint: `POST /api/sign-in`
- ✅ Sign-up endpoint: `POST /api/sign-up`
- ✅ Sign-out endpoint: `POST /api/sign-out`
- ✅ Profile endpoint: `GET /api/profile` (protected)
- ✅ Health check: `GET /health`

### Database
- ✅ PostgreSQL schema with users table
- ✅ Reset tokens table for password recovery
- ✅ Password hashing with bcryptjs
- ✅ JWT token generation (7-day expiry)
- ✅ Migration script to create tables
- ✅ Default test user seeded

### Security
- ✅ Password hashing (bcryptjs with salt)
- ✅ JWT token signing
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Protected routes with auth middleware

## 🚀 Getting Started in 5 Steps

### Step 1: Create Tables in Supabase
Copy contents of `server/schema.sql` and run in Supabase SQL Editor.

### Step 2: Start Backend
```bash
cd server
npm run migrate  # Create tables & seed test user
npm run dev      # Start server on port 3000
```

### Step 3: Start Frontend
```bash
npm run dev      # In root directory
```

### Step 4: Open Sign-In Page
Navigate to `http://localhost:5173/sign-in`

### Step 5: Test Sign-In
- Email: `admin-01@ecme.com`
- Password: `123Qwe`
- Click **Sign In**
- Should redirect to `/home`

## 📁 File Structure

```
Frontend (React)
├── src/
│   ├── views/auth/SignIn/
│   │   ├── SignIn.tsx              # Main sign-in page
│   │   ├── components/
│   │   │   ├── SignInForm.tsx      # Form with validation
│   │   │   └── OauthSignIn.tsx
│   │   └── index.ts
│   ├── auth/
│   │   ├── AuthProvider.tsx         # Auth context provider
│   │   ├── AuthContext.ts           # Auth type definitions
│   │   ├── useAuth.ts               # useAuth hook
│   │   └── index.ts
│   ├── services/
│   │   ├── AuthService.ts           # API calls
│   │   ├── ApiService.ts            # Main API service
│   │   └── axios/
│   │       ├── AxiosBase.ts         # Axios config
│   │       ├── AxiosRequestIntrceptorConfigCallback.ts
│   │       └── AxiosResponseIntrceptorErrorCallback.ts
│   ├── store/
│   │   └── authStore.ts             # Zustand store for auth
│   ├── configs/
│   │   ├── app.config.ts            # App config
│   │   ├── endpoint.config.ts       # API endpoints
│   │   └── routes.config/           # Route definitions
│   └── .env                         # Frontend env vars
│
Backend (Node.js + Express)
├── server/
│   ├── src/
│   │   ├── index.ts                 # Express app
│   │   ├── db/
│   │   │   ├── config.ts            # DB connection pool
│   │   │   ├── migrations.ts        # Migration setup
│   │   │   └── queries/
│   │   │       └── userQueries.ts   # User DB queries
│   │   ├── routes/
│   │   │   └── auth/
│   │   │       ├── index.ts         # Auth routes
│   │   │       ├── signIn.ts        # Sign-in logic
│   │   │       └── signUp.ts        # Sign-up logic
│   │   ├── middleware/
│   │   │   └── auth.ts              # Auth middleware
│   │   └── utils/
│   │       └── auth.ts              # Password hash & JWT
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                         # Backend env vars
│   ├── .env.example
│   ├── schema.sql                   # Database schema
│   └── migrate.js                   # Migration runner
│
Configuration
├── .env                             # Frontend env
├── package.json
├── SIGNIN_INTEGRATION.md            # Detailed guide
├── API_EXAMPLES.md                  # Request/response examples
└── SIGNIN_CHECKLIST.md              # This file
```

## 🔄 Data Flow Diagram

### Sign-In Flow
```
User Browser                Frontend                 Backend              Database
    |                          |                        |                    |
    | 1. Enter credentials     |                        |                    |
    |------------------------->|                        |                    |
    |                          | 2. POST /api/sign-in   |                    |
    |                          |---------------------  >|                    |
    |                          |                        | 3. Query user     |
    |                          |                        |-------------------->|
    |                          |                        | 4. User data       |
    |                          |                        |<--------------------|
    |                          |                        | 5. Verify password |
    |                          |                        | 6. Generate JWT    |
    |                          | 7. Return token       |                    |
    |                          |<-----------------------|                    |
    | 8. Store token           |                        |                    |
    |<-------------------------|                        |                    |
    | 9. Redirect /home        |                        |                    |
    |                          |                        |                    |
```

### Protected Request Flow
```
User Browser                Frontend                Backend              Database
    |                          |                        |                    |
    | 1. GET /profile          |                        |                    |
    |------------------------->|                        |                    |
    |                          | 2. GET /api/profile   |                    |
    |                          | Authorization: Bearer  |                    |
    |                          |---------------------  >|                    |
    |                          |                        | 3. Verify token   |
    |                          |                        | 4. Extract userId  |
    |                          | 5. Return profile     |                    |
    |                          |<-----------------------|                    |
    | 6. Display profile       |                        |                    |
    |<-------------------------|                        |                    |
```

## 🔐 Token Flow

1. **Sign-In** → Backend creates JWT with `{ userId, email }`
2. **Token Storage** → Frontend stores in cookies (configured in `app.config.ts`)
3. **API Requests** → Axios adds `Authorization: Bearer {token}` header
4. **Token Validation** → Backend verifies JWT signature
5. **Token Expiry** → 7 days (configurable in `JWT_EXPIRES_IN`)
6. **Expired Token** → Backend returns 401, frontend redirects to `/sign-in`

## 🧪 Test Credentials

### Default Test User (Created by Migration)
- **Email**: `admin-01@ecme.com`
- **Password**: `123Qwe`
- **Authority**: `admin`

### Create New Test User
1. Go to sign-up page
2. Email: `test@example.com`
3. Password: `password123`
4. Username: `Test User`

## 📊 Database Schema

### Users Table
```
id              SERIAL PRIMARY KEY
user_id         UUID (unique, for API responses)
email           VARCHAR (unique, indexed)
password_hash   VARCHAR (bcrypt hash)
user_name       VARCHAR
avatar          VARCHAR
authority       VARCHAR (default: 'user')
is_active       BOOLEAN (default: true)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Reset Tokens Table
```
id              SERIAL PRIMARY KEY
user_id         UUID (foreign key)
token           VARCHAR (unique)
expires_at      TIMESTAMP
created_at      TIMESTAMP
```

## 🔧 Environment Variables

### Frontend (`.env`)
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Backend (server/`.env`)
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:PASSWORD@db.XXXX.supabase.co:5432/postgres
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

## ✨ Key Features Implemented

1. **Form Validation**
   - Email and password required
   - Client-side validation with Zod
   - Server-side validation

2. **Error Handling**
   - Invalid credentials error
   - Account inactive error
   - Network errors
   - Server errors

3. **Loading States**
   - Form disabled while signing in
   - Loading button state

4. **Security**
   - Password hashing with bcryptjs
   - JWT tokens with expiry
   - CORS protection
   - Security headers with Helmet

5. **User Experience**
   - Auto-filled test credentials
   - Forgot password link
   - Sign up link
   - Error messages
   - Auto-redirect on success

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | Check DATABASE_URL, verify Supabase is running |
| "Invalid email or password" | Use correct credentials, or create new user |
| CORS error | Add frontend URL to CORS_ORIGIN in server/.env |
| Token not persisting | Clear browser storage (cookies/localStorage) |
| "Backend not running" | Run `cd server && npm run dev` |
| Port already in use | Change PORT in server/.env |

## 📚 Documentation

- **SIGNIN_INTEGRATION.md** - Complete setup guide
- **API_EXAMPLES.md** - Request/response examples
- **BACKEND_SETUP.md** - Backend configuration
- **server/README.md** - Backend documentation

## ✅ Next Steps

- [ ] Test sign-in with credentials
- [ ] Create new user via sign-up
- [ ] Verify token storage
- [ ] Test protected endpoints
- [ ] Add password reset
- [ ] Add email verification
- [ ] Add role-based access control
- [ ] Add refresh tokens
- [ ] Deploy to production

