# ECME Full Stack Setup Guide

## Overview

This project consists of:
- **Frontend**: React (Vite) at `http://localhost:5173`
- **Backend**: Node.js + Express at `http://localhost:3000`
- **Database**: Supabase PostgreSQL

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier available)
- Git

### Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for your project to be provisioned
3. Go to **Project Settings** → **Database**
4. Copy these credentials:
   - **Host** - Look for the connection string
   - **Database name** - Usually `postgres`
   - **Username** - Usually `postgres`
   - **Password** - Set during project creation
   - **Port** - Usually `5432`

Or find the full connection string at **Settings** → **Database** → **Connection string** (PostgreSQL)

### Step 2: Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your Supabase credentials
nano .env
# OR edit manually - add your DATABASE_URL or individual DB vars
```

Your `.env` should look like:
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=your-very-secret-key-here-minimum-32-characters
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**Run migrations to create tables:**
```bash
npm run migrate
```

**Start the backend:**
```bash
npm run dev
```

You should see:
```
Server is running on http://localhost:3000
Health check: http://localhost:3000/health
```

### Step 3: Frontend Setup

```bash
# In root directory
npm install

# Create .env file
cp .env.example .env
# Should have: VITE_API_BASE_URL=http://localhost:3000/api

# Start development server
npm run dev
```

Frontend runs at `http://localhost:5173`

### Step 4: Test Authentication

1. Create `.env` in backend:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
   JWT_SECRET=test-secret-key-123456789
   CORS_ORIGIN=http://localhost:5173
   ```

2. Run migrations: `npm run migrate` (in `server` directory)

3. Start backend: `npm run dev` (in `server` directory)

4. Start frontend: `npm run dev` (in root directory)

5. Open browser to `http://localhost:5173/sign-in`

6. Test credentials (must create via sign-up first):
   - Email: `test@example.com`
   - Password: `123Qwe`

## API Endpoints

### Public Endpoints

```
POST /api/sign-in
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "userName": "John Doe",
    "email": "user@example.com",
    "avatar": null,
    "authority": ["user"]
  }
}
```

```
POST /api/sign-up
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "userName": "New User"
}
```

```
POST /api/sign-out
```

### Health Check

```
GET /health
Response: { "status": "ok" }
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  avatar VARCHAR(255),
  authority VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL is correct
- Verify Supabase project is active
- Ensure firewall allows connections (Supabase handles this)

### CORS errors
- Check `CORS_ORIGIN` in backend `.env`
- Frontend URL must be included in the list

### "Token not provided" when calling protected routes
- Ensure token is saved in localStorage/cookies after sign-in
- Check Authorization header is being sent

### Port already in use
- Change PORT in `.env`
- Or kill existing process: `lsof -ti:3000 | xargs kill -9`

## Production Deployment

### Environment Variables
```
NODE_ENV=production
JWT_SECRET=use-strong-random-secret
DATABASE_URL=postgresql://user:pass@host:port/db
CORS_ORIGIN=https://yourdomain.com
```

### Build
```bash
# Backend
npm run build
npm run start

# Frontend (in root)
npm run build
# Deploy dist/ folder to hosting
```

## Next Steps

1. Add forgot password/reset flow
2. Add email verification
3. Add user profile endpoints
4. Add role-based access control
5. Add refresh token rotation
6. Add rate limiting
7. Add logging and monitoring
