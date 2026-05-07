# Unified Monorepo Architecture

This project has been fully merged into a single unified monorepo where frontend and backend code coexist within a single source tree and are orchestrated together.

## Project Structure

```
project-root/
├── src/
│   ├── components/        # React components
│   ├── views/            # React pages
│   ├── layouts/          # React layouts
│   ├── hooks/            # React hooks
│   ├── utils/            # Utility functions
│   ├── server/           # Backend (Express) application
│   │   ├── index.ts      # Express server entry point
│   │   ├── routes/       # API routes
│   │   ├── db/           # Database config & queries
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Server utilities
│   └── App.tsx           # Frontend entry point
├── public/               # Static assets
├── package.json          # Root (unified) package configuration
├── tsconfig.json         # Frontend TypeScript config
├── tsconfig.server.json  # Backend TypeScript config
├── vite.config.ts        # Vite configuration
└── .env                  # Environment variables (git-ignored)
```

## Running the Project

### Single Command (Recommended)

Start both frontend and backend simultaneously:

```bash
npm run dev
```

This runs:
- **Frontend**: Vite dev server on `http://localhost:5173`
- **Backend**: Express API server on `http://localhost:5000`

Both services output to the same terminal with color-coded prefixes.

### Individual Commands

If you need to run services separately:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

### Build Commands

```bash
# Build frontend
npm run build

# Build backend
npm run build:backend

# Build both
npm run build && npm run build:backend
```

## Technology Stack

### Frontend
- **Framework**: React 19.2.3
- **Build Tool**: Vite 7.1.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0.2
- **Package Manager**: npm
- **Port**: 5173

### Backend
- **Framework**: Express 4.18.2
- **Language**: TypeScript (ts-node for dev)
- **Database**: PostgreSQL (via pg driver)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcryptjs
- **Package Manager**: npm (shared root)
- **Port**: 5000

## Key Features

### Unified Development
- Single `npm install` for all dependencies
- Single dev command runs both services
- Shared node_modules for efficient disk usage
- Frontend proxy automatically routes `/api/*` to backend

### Separate Builds
- Frontend compiles with Vite → `build/` directory
- Backend compiles with TypeScript → `dist/` directory
- Can be deployed separately or together

### Type Safety
- Frontend uses `tsconfig.json`
- Backend uses `tsconfig.server.json`
- Separate configs allow framework-specific optimizations

## Environment Configuration

### .env File
Located at project root (git-ignored):

```
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

The `.env` file is automatically loaded by the backend via `dotenv`.

## API Integration

### Making API Calls from Frontend
The frontend Vite dev server proxies `/api/*` requests to the backend:

```typescript
// Frontend code - automatically proxied to http://localhost:5000/api/auth/signin
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
```

### Backend Routes
Backend routes are defined in `src/server/routes/`:

```typescript
// src/server/routes/auth/index.ts
import { Router } from 'express'
import signIn from './signIn'
import signUp from './signUp'

const router = Router()
router.post('/signin', signIn)
router.post('/signup', signUp)

export default router
```

## Development Workflow

### Local Development

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Access the application**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000/api/*`
   - Health check: `http://localhost:5000/health`

3. **Make changes**:
   - Frontend changes hot-reload via Vite
   - Backend changes require manual restart (Ctrl+C and `npm run dev`)

### Adding Backend Features

To add a new API endpoint:

1. Create a route file in `src/server/routes/`:
   ```typescript
   // src/server/routes/users/index.ts
   import { Router } from 'express'
   import { getUsers } from '../../db/queries/userQueries'

   const router = Router()
   router.get('/', async (req, res) => {
     try {
       const users = await getUsers()
       res.json(users)
     } catch (err) {
       res.status(500).json({ error: err.message })
     }
   })
   export default router
   ```

2. Import in `src/server/index.ts`:
   ```typescript
   import usersRoutes from './routes/users'
   app.use('/api/users', usersRoutes)
   ```

3. Call from frontend:
   ```typescript
   const users = await fetch('/api/users').then(r => r.json())
   ```

## Production Deployment

### Frontend
```bash
npm run build
# Outputs to `build/`
```

### Backend
```bash
npm run build:backend
# Outputs to `dist/`
```

### Running Production Build
```bash
# Build both
npm run build && npm run build:backend

# Start backend (requires Node.js)
node dist/server/index.js
```

Set environment variable before running:
```bash
PORT=5000 NODE_ENV=production node dist/server/index.js
```

## Troubleshooting

### Port Already in Use

**Frontend (5173)**:
Edit `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000  // or any available port
  }
})
```

**Backend (5000)**:
Set environment variable:
```bash
PORT=3001 npm run dev:backend
```

### Backend Not Starting

Check the logs carefully. Common issues:

1. **Database connection error**: Verify `DATABASE_URL` in `.env`
2. **Port in use**: Check if port 5000 is available
3. **Missing dependencies**: Run `npm install`

### Frontend Can't Reach Backend

1. Ensure backend is running on `http://localhost:5000`
2. Check the browser console for errors
3. Verify API endpoint paths match backend routes
4. Check CORS configuration in `src/server/index.ts`

### Hot Reload Not Working

- **Frontend**: Vite hot reload is automatic
- **Backend**: Changes require restart (Ctrl+C, then `npm run dev`)

## Migrations

### Database Migrations
If the project has database migration scripts, run them before starting:

```bash
# Check server/migrate.js for available migrations
node migrate.js
```

## Best Practices

1. **Keep Frontend and Backend Concerns Separate**: Don't import server code in React components
2. **Use Absolute Imports**: Configure path aliases for clean imports
3. **Type Your APIs**: Use TypeScript interfaces for request/response types
4. **Environment Variables**: Never commit `.env`, use `.env.example` for documentation
5. **Error Handling**: Implement proper error handling in both frontend and backend
6. **CORS Configuration**: Keep CORS_ORIGIN aligned with your frontend URL

## Git Workflow

The entire project is in one git repo:

```bash
# Commit changes to both frontend and backend
git add .
git commit -m "feat: add user authentication"
git push
```

Use conventional commits to describe changes clearly.
