# True Touch - Foreign Employment Recruitment Agency Platform

True Touch is a modern and comprehensive recruitment management system designed specifically for foreign employment agencies. Built with React and TypeScript, it provides a powerful platform for managing partnership candidates, processing recruitment requests, and streamlining the entire employment pipeline.

This platform is designed to help recruitment agencies efficiently manage candidates, partnerships, and employment processes at scale. Whether you're coordinating with multiple partners, screening candidates, or tracking employment status, True Touch provides the tools you need.

Key Features:
- **Partnership Management**: Manage partnership candidates with detailed profiles and status tracking.
- **Candidate Database**: Comprehensive candidate profiles with personal, professional, and document information.
- **Advanced Filtering & Search**: Filter candidates by job category, skill level, nationality, education, and more.
- **Request Management**: Create and track standard requests for candidate placements.
- **Status Tracking**: Monitor candidates through multiple status stages (Available, Processing, Employee).
- **Document Management**: Upload and download resumes and other candidate documents.
- **CSV Export**: Export candidate data for reporting and analysis.
- **Responsive Design**: Optimized for all screen sizes and devices.
- **Dark/Light Mode**: Toggle between light and dark themes for comfortable usage.
- **Role-Based Access**: Different access levels for Admin and Partnership users.
- **Integrated Backend**: Express.js backend with PostgreSQL database.
- **Real-time Notifications**: Notification system for recruitment activities and updates.

---

## Core Modules

- **Dashboard**: Overview of partnership KPIs, recent activities, and system status
- **Partnership Candidates**: View, filter, and manage candidate database with advanced search capabilities
- **Standard Requests**: Track and manage employment requests from partners
- **Admin Panel**: System administration, user management, and configuration
- **Notifications**: Real-time updates on recruitment activities and requests

## Quick Start

This project is a fully unified monorepo with both frontend (React + Vite) and backend (Express) in a single codebase.

### Installation

```bash
npm install
```

### Development

Start both frontend and backend with a single command:

```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:5173 (React dev server with Vite)
- **Backend**: http://localhost:5000 (Express API server)

### Individual Development Commands

```bash
npm run dev:frontend    # Frontend only
npm run dev:backend     # Backend only
npm run build           # Build frontend
npm run build:backend   # Build backend
npm run lint            # Lint code
npm run format          # Format and lint
```

## Project Structure

```
src/
├── components/     # React components
├── views/         # React pages
├── layouts/       # React layouts
├── server/        # Express backend
│   ├── routes/    # API routes
│   ├── db/        # Database config
│   ├── middleware/# Express middleware
│   └── index.ts   # Backend entry point
└── App.tsx        # Frontend entry point
```

## Configuration

### Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

### Frontend API Calls

The frontend automatically proxies API requests to the backend:

```typescript
// Automatically routes to http://localhost:5000/api/auth/signin
fetch('/api/auth/signin', { method: 'POST', body: ... })
```

## Technology Stack

**Frontend:**
- React 19.2.3
- Vite 7.1.3
- TypeScript
- Tailwind CSS

**Backend:**
- Express 4.18.2
- PostgreSQL
- JWT Authentication
- TypeScript

## Backend Development

The backend is located in `src/server/`:

- **Routes**: Define API endpoints in `src/server/routes/`
- **Database**: Configure connections in `src/server/db/`
- **Middleware**: Add custom middleware in `src/server/middleware/`
- **Entry Point**: `src/server/index.ts`

### Adding an API Endpoint

1. Create a route file in `src/server/routes/`
2. Import it in `src/server/index.ts`
3. Call from frontend using `/api/...`

See `MONOREPO_SETUP.md` for detailed backend documentation.

## Troubleshooting

### Port Already in Use
- Frontend: Edit `vite.config.ts` to change port
- Backend: Set `PORT` environment variable

### Backend Not Starting
1. Check `.env` database configuration
2. Run `npm install` to ensure dependencies are installed
3. Check console logs for specific errors

### API Calls Failing
1. Ensure both services are running
2. Verify API endpoint exists
3. Check browser console for CORS errors

## Learn More

- [Full Monorepo Setup Guide](./MONOREPO_SETUP.md)
- [Online Documentation](https://ecme-react.themenate.net/guide/documentation/introduction)
