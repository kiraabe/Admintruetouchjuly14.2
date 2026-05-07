# Monorepo Architecture Setup

This project has been configured as a single monorepo where the frontend (Vite + React) and backend (Express + Node.js) run together with a unified development command.

## Architecture Overview

```
project-root/
├── src/                 # Frontend React application
├── server/              # Backend Express server
├── package.json         # Root package with monorepo scripts
├── vite.config.ts       # Frontend configuration
└── server/package.json  # Backend package configuration
```

## Running the Project

### Single Command to Run Both Services

```bash
npm run dev
```

This command uses `concurrently` to run:
- **Frontend**: Vite dev server on `http://localhost:5173`
- **Backend**: Express API server on `http://localhost:5000`

### Individual Commands

If you need to run services separately:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Build frontend
npm run build

# Build backend
npm run build:backend
```

## Key Configuration Details

### Frontend (Vite)
- **Port**: 5173
- **Framework**: React 19.2.3
- **Build tool**: Vite 7.1.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0.2

### Backend (Express)
- **Port**: 5000
- **Framework**: Express 4.18.2
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Runtime**: Node.js (with ts-node for development)

### API Proxy Configuration
The frontend Vite configuration (`vite.config.ts`) includes a proxy that automatically forwards API requests to the backend:

```
/api/* → http://localhost:5000/api/*
```

This allows your frontend code to make API calls using relative paths like `/api/auth/signin` without worrying about CORS or port differences.

### Environment Configuration

**Frontend**: Uses standard Vite environment variables (if needed)

**Backend**: Uses `.env` file at `server/.env` with variables:
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: JWT expiration time
- `CORS_ORIGIN`: Allowed CORS origins

## Dependencies

### New Dependencies Added
- `concurrently@^8.2.2` (dev): Runs multiple npm scripts concurrently

### Existing Setup Preserved
- All frontend dependencies remain unchanged
- All backend dependencies remain unchanged
- Both services maintain their independent build processes

## How It Works

1. When you run `npm run dev`, the `concurrently` package starts both processes
2. Both processes output to the same terminal with color-coded prefixes
3. Stopping the parent process (Ctrl+C) will cleanly shut down both services
4. If one service crashes, the other continues running (use Ctrl+C to stop all)

## Development Workflow

1. **Start both services**: `npm run dev`
2. **Frontend access**: Visit `http://localhost:5173`
3. **Backend access**: API calls go through the proxy to `http://localhost:5000/api/*`
4. **View logs**: Both services output to the same terminal

## Building for Production

To build both the frontend and backend:

```bash
npm run build          # Build frontend
npm run build:backend  # Build backend
```

## Troubleshooting

### Port Already in Use
If port 5173 or 5000 is already in use:
- Change the port in `vite.config.ts` (frontend)
- Change the PORT environment variable in `server/.env` (backend)

### Backend Not Starting
1. Check that `server/package.json` dependencies are installed: `cd server && npm install`
2. Verify `server/.env` exists and has correct `DATABASE_URL`
3. Check the backend logs for specific errors

### API Calls Returning 404
1. Ensure the backend is running on port 5000
2. Check that your API endpoint exists in `server/src/routes/`
3. Verify the API path is correct (e.g., `/api/auth/signin`)
