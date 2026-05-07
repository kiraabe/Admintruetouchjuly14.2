# Ecme - The Ultimate React, Vite & TypeScript Web Template

Ecme  is a modern and responsive admin dashboard template built with React and TypeScript. Designed to provide a highly customizable and easy-to-use platform for building admin interfaces, it includes a variety of reusable components, pre-designed pages, and dynamic features. 

This template is perfect for developing dashboards, web applications, CRM systems, e-commerce backends, and more. Whether you're building a small-scale admin panel or a large-scale enterprise application, Ecme is designed to be flexible and scalable.

Key Features:
- **Responsive Layout**: Optimized for all screen sizes and devices.
- **Dark/Light Mode**: Easily switch between light and dark themes.
- **Configurable Themes**: Personalize colors, layouts, and more to fit your needs.
- **Built with React + TypeScript**: Ensures robust type-checking and fast development.
- **Multi-Locale Support**: Easily add and manage multiple languages.
- **RTL Support**: Full Right-to-Left support for languages like Arabic or Hebrew.
- **Tailwind Component-Based Architecture**: Reusable components to streamline your development process.
- **API Ready**: Simple integration with any RESTful API.
- **Integrated Backend**: Express.js backend included in the same codebase.

---
### Demo
Check out the [Live Demo](https://ecme-react.themenate.net/) to explore the template in action.


### Guide
Please visit our [Online documentation](https://ecme-react.themenate.net/guide/documentation/introduction) for detailed guides, setup instructions, and customization options.

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
