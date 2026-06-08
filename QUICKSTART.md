# Quick Start - Sign-In Backend Integration

## 3 Commands to Get Started

### Terminal 1: Create Database Tables
```bash
cd server
npm run migrate
```

Expected output:
```
Running migrations...
✓ Users table created
✓ Reset tokens table created
✓ Default test user created
Migrations completed successfully
```

### Terminal 2: Start Backend
```bash
cd server
npm run dev
```

Expected output:
```
Server is running on http://localhost:3000
Health check: http://localhost:3000/health
```

### Terminal 3: Start Frontend
```bash
npm run dev
```

Expected output:
```
  VITE v7.x.x  ready in x ms

  ➜  Local:   http://localhost:5173/
```

## Test Sign-In (30 seconds)

1. **Open** `http://localhost:5173/sign-in`
2. **Credentials are auto-filled:**
   - Email: `admin-01@truetouchjobs.com`
   - Password: `123Qwe`
3. **Click** Sign In
4. **Should redirect** to `/home` ✅

## What's Running

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173 | React app |
| Backend | http://localhost:3000 | Express API |
| Database | Supabase PostgreSQL | Cloud |
| Health Check | http://localhost:3000/health | API status |

## What Happens When You Sign In

1. Form submits email/password to `http://localhost:3000/api/sign-in`
2. Backend checks database for user
3. Verifies password with bcryptjs
4. Generates JWT token (valid 7 days)
5. Returns token + user data
6. Frontend stores token in cookies
7. Automatically redirects to `/home`

## API Endpoints Ready to Use

```bash
# Test backend is running
curl http://localhost:3000/health

# Sign in with test user
curl -X POST http://localhost:3000/api/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"admin-01@truetouchjobs.com","password":"123Qwe"}'

# Sign up new user
curl -X POST http://localhost:3000/api/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","userName":"Test User"}'
```

## Files Configured

✅ **Frontend**
- `.env` - API URL configured
- `src/services/ApiService.ts` - API client ready
- `src/auth/AuthProvider.tsx` - Auth logic wired
- `src/views/auth/SignIn/` - Sign-in form ready

✅ **Backend**
- `server/.env` - Supabase connection configured
- `server/src/routes/auth/` - Sign-in/sign-up endpoints
- `server/src/db/queries/` - Database queries
- `server/src/utils/auth.ts` - Password hashing & JWT

✅ **Database**
- Tables created with `npm run migrate`
- Test user seeded automatically
- Indexes created for performance

## Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000
# Change port in server/.env if needed
```

### Can't connect to database
```bash
# Verify CONNECTION in server/.env
# DATABASE_URL should match your Supabase connection string
# Check at: https://app.supabase.com → Project Settings → Database
```

### Sign-in not working
1. Clear browser cache/cookies
2. Verify test user exists: `admin-01@truetouchjobs.com`
3. Check backend is running on `http://localhost:3000`
4. Check frontend can reach backend: Open DevTools → Network tab

### CORS error
- Backend has CORS enabled for `http://localhost:5173`
- If using different port, update `CORS_ORIGIN` in `server/.env`

## Full Documentation

- **SIGNIN_INTEGRATION.md** - Complete setup guide
- **SIGNIN_CHECKLIST.md** - Feature checklist & troubleshooting
- **API_EXAMPLES.md** - API request/response examples
- **BACKEND_SETUP.md** - Backend configuration details

## Next Steps

After testing sign-in:
1. Create a new user via sign-up
2. Test token persistence
3. Add more API endpoints
4. Implement password reset
5. Add email verification
6. Deploy to production

---

**You're all set! Sign-in is now live with real database integration.** 🚀
