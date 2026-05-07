# Sign-In Integration with Backend & Database

## Setup Overview

Your sign-in form is now fully integrated with:
- **Backend**: Node.js + Express API
- **Database**: Supabase PostgreSQL
- **Frontend**: React with proper token management

## Step 1: Create Database Tables in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the SQL from `server/schema.sql`:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  avatar VARCHAR(255),
  authority VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON reset_tokens(user_id);
```

5. Click **Run**

## Step 2: Start Backend Server

```bash
cd server
npm run migrate  # Creates tables and seeds default test user
npm run dev      # Starts backend on port 3000
```

You should see:
```
Server is running on http://localhost:3000
Health check: http://localhost:3000/health
```

## Step 3: Start Frontend Server

```bash
# In root directory
npm run dev
```

Frontend runs at `http://localhost:5173`

## Step 4: Test Sign-In

### Using Default Test User

The migration script creates a default test user:
- **Email**: `admin-01@ecme.com`
- **Password**: `123Qwe`

This is the default value in the sign-in form.

1. Go to `http://localhost:5173/sign-in`
2. The form auto-fills with test credentials
3. Click **Sign In**

You should be redirected to `/home` with the user authenticated.

### Create New User

To create a new user:

1. Click **Sign Up** on the login page
2. Or go to `http://localhost:5173/sign-up`
3. Fill in:
   - Email: `newuser@example.com`
   - Password: `password123`
   - Username: `John Doe`
4. Click **Sign Up**

You'll be automatically signed in and redirected to `/home`.

## How Sign-In Works

### Frontend Flow

1. **SignInForm** (`src/views/auth/SignIn/components/SignInForm.tsx`)
   - Collects email and password
   - Validates input with Zod schema

2. **useAuth Hook** (`src/auth/useAuth.ts`)
   - Provides `signIn()` function
   - Handles authentication state

3. **AuthProvider** (`src/auth/AuthProvider.tsx`)
   - Calls `apiSignIn()` API service
   - Stores token in cookies
   - Stores user in Zustand store
   - Redirects to `/home` on success

4. **API Service** (`src/services/AuthService.ts`)
   - Makes POST request to `/api/sign-in`
   - Uses AxiosBase with interceptors

5. **AxiosBase** (`src/services/axios/AxiosBase.ts`)
   - Base URL: `http://localhost:3000/api`
   - Adds `Authorization: Bearer {token}` header
   - Redirects to `/sign-in` on 401 error

### Backend Flow

1. **POST /api/sign-in**
   - Receives: `{ email, password }`
   - Finds user by email in database
   - Verifies password with bcryptjs
   - Generates JWT token
   - Returns: `{ token, user: { userId, email, userName, authority, avatar } }`

2. **Database Query** (`server/src/db/queries/userQueries.ts`)
   - Queries `users` table by email
   - Returns user object

3. **Authentication** (`server/src/utils/auth.ts`)
   - Password comparison: bcryptjs
   - Token generation: jsonwebtoken (JWT)
   - Token expires in: 7 days

## Environment Configuration

### Frontend (`.env`)
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Backend (`server/.env`)
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:PASSWORD@db.XXXX.supabase.co:5432/postgres
JWT_SECRET=ecme-admin-secret-key-change-in-production-2024
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

## API Endpoints

### Public Endpoints

**Sign In**
```bash
POST http://localhost:3000/api/sign-in
Content-Type: application/json

{
  "email": "admin-01@ecme.com",
  "password": "123Qwe"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "userName": "Admin User",
    "email": "admin-01@ecme.com",
    "avatar": "",
    "authority": ["admin"]
  }
}
```

**Sign Up**
```bash
POST http://localhost:3000/api/sign-up
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "userName": "John Doe"
}
```

**Sign Out**
```bash
POST http://localhost:3000/api/sign-out
Authorization: Bearer {token}
```

### Protected Endpoints

**Get Profile** (requires authentication)
```bash
GET http://localhost:3000/api/profile
Authorization: Bearer {token}

Response:
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin-01@ecme.com",
  "message": "Profile retrieved successfully"
}
```

## Troubleshooting

### "Cannot connect to database"
- Verify DATABASE_URL is correct in `server/.env`
- Check Supabase project is running
- Confirm network connection

### "Invalid email or password"
- Use exact credentials: `admin-01@ecme.com` / `123Qwe`
- Or create a new user via sign-up
- Check password is at least 6 characters

### CORS errors
- Ensure `CORS_ORIGIN` in `server/.env` includes frontend URL
- Should be: `http://localhost:5173`

### Token not working
- Clear browser cookies/localStorage
- Go to DevTools → Application → Storage
- Delete all entries for `localhost`
- Sign in again

### Port already in use
- Change PORT in `server/.env` (e.g., 3001)
- Or kill existing process: `lsof -ti:3000 | xargs kill -9`

## Token Storage

Tokens are stored in **cookies** by default. Configuration in `src/configs/app.config.ts`:

```typescript
accessTokenPersistStrategy: 'cookies'
```

Options:
- `'cookies'` - Secure HttpOnly cookies (recommended for production)
- `'localStorage'` - Browser localStorage
- `'sessionStorage'` - Session storage (cleared on browser close)

## Security Notes

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Enable HTTPS/SSL for database
- [ ] Set `NODE_ENV=production`
- [ ] Use environment variables for secrets
- [ ] Enable database SSL
- [ ] Set proper CORS origins
- [ ] Add rate limiting
- [ ] Add HTTPS redirects
- [ ] Use secure cookies (HttpOnly, Secure, SameSite)

### Example Production `.env`

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@prod-db.com:5432/dbname
JWT_SECRET=generate-strong-secret-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com
```

## Next Steps

1. **Test the integration** - Sign in with test credentials
2. **Create users** - Use sign-up flow
3. **Add more endpoints** - Create profile, update user, etc.
4. **Add email verification** - Validate email addresses
5. **Add password reset** - Forgot password flow
6. **Add role-based access** - Different authority levels
7. **Add refresh tokens** - Rotate tokens for security
