# ECME Backend API

Node.js + Express backend with Supabase PostgreSQL integration.

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Copy your connection details:
   - **Project URL** (database host)
   - **Database password**
   - **Database name** (usually `postgres`)

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your details:

```bash
cp .env.example .env
```

Example `.env`:
```
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:password@db.supabaseproject.co:5432/postgres
# OR individual vars:
DB_HOST=db.supabaseproject.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=postgres

JWT_SECRET=your-random-secret-key-change-this
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Run Migrations

Create database tables:

```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/sign-in` - User login
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `POST /api/sign-up` - User registration
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "userName": "John Doe"
  }
  ```

- `POST /api/sign-out` - User logout

## Database Schema

### Users Table
- `id` - Primary key
- `user_id` - UUID (used in responses)
- `email` - Unique email
- `password_hash` - Bcrypt hashed password
- `user_name` - Display name
- `avatar` - Avatar URL
- `authority` - User role (default: 'user')
- `is_active` - Account status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Enable SSL for database connection
4. Set appropriate `CORS_ORIGIN`
5. Run `npm run build` and `npm run start`
