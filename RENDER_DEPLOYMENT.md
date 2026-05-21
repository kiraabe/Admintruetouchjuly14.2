# Render Deployment Guide

## Overview
Your project is now configured for Render deployment with both frontend and backend running on the same service.

## What Changed

### 1. Build Process
- **Before**: Only frontend was built (`vite build` → `build/`)
- **After**: Both frontend and backend are built
  - Frontend: `npm run build:frontend` → `dist/client/`
  - Backend: `npm run build:backend` → `dist/server/`
  - Combined: `npm run build` runs both in sequence

### 2. Start Command
- **Before**: `npm run start` → `vite preview --host` (static only)
- **After**: `npm run start` → `node dist/server/index.js` (backend with frontend served)

### 3. Backend Server
The Express backend now:
- Serves static frontend files from `dist/client/`
- Provides API routes at `/api/*`
- Automatically redirects SPA routes to `index.html`

## Render Configuration

### Build Command
Keep as: `npm install; npm run build`

### Start Command
Keep as: `npm run start`

### Environment Variables
Add these to your Render service:

**Required:**
```
DATABASE_URL=postgresql://...your-connection-string...
```

**Optional but recommended:**
```
NODE_ENV=production
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://truetouch-admin.onrender.com
PORT=5000
```

The `PORT` will be automatically set by Render to `10000`, but having it as a fallback ensures local development works.

## Local Development

### Development Mode
```bash
npm run dev
```
This runs both frontend (http://localhost:5173) and backend (http://localhost:5000) concurrently.

### Frontend Only
```bash
npm run dev:frontend
```

### Backend Only
```bash
npm run dev:backend
```

## How It Works

1. **Build Phase**: 
   - Vite builds the React frontend to `dist/client/`
   - TypeScript compiles the Express backend to `dist/server/`

2. **Runtime Phase**:
   - The Node.js server starts from `dist/server/index.js`
   - Backend API routes handle `/api/*` requests
   - All other requests are served static files from `dist/client/`
   - For SPA routes (like `/sign-in`), the server serves `index.html` and React Router handles the navigation

3. **File Structure**:
   ```
   dist/
   ├── client/          (Frontend build)
   │   ├── index.html
   │   ├── assets/
   │   └── static/
   └── server/          (Backend compiled)
       ├── index.js     (Main entry point)
       ├── routes/
       ├── db/
       └── ...
   ```

## Deployment Checklist

- [ ] Add `DATABASE_URL` environment variable to Render
- [ ] Set `JWT_SECRET` to a strong random string
- [ ] Configure `CORS_ORIGIN` with your Render domain
- [ ] Verify build completes successfully
- [ ] Test API endpoints on deployed service
- [ ] Test SPA routing (navigation between pages)
- [ ] Check that uploads work (profile pictures, files)
- [ ] Verify database migrations run on startup

## Troubleshooting

### "Frontend not found" Error
This means `dist/client/index.html` doesn't exist. Run:
```bash
npm run build
```

### Database Connection Issues
Check that `DATABASE_URL` is set correctly in Render environment variables. The format should be:
```
postgresql://user:password@host:port/database
```

### Port Already in Use
The backend automatically tries the next port if 5000 is busy. In Render, the actual port is set via the `PORT` environment variable.

### CORS Errors
Update `CORS_ORIGIN` environment variable with your Render domain if you see CORS errors in the browser console.

## API Routes

- `GET /health` - Health check
- `POST /api/sign-in` - User authentication
- `GET /api/debug/users` - Debug: List all users
- `GET /api/debug/employee-requests` - Debug: Check employee requests table
- `GET /api/seed/employee-requests` - Seed sample employee requests

Plus all other API routes for candidates, partnerships, users, jobs, licenses, etc.
