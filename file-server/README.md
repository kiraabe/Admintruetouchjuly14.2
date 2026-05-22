# File Server

A dedicated Express.js static file server for managing file uploads and serving static files.

## Setup

1. Navigate to the file-server directory:
```bash
cd file-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure the environment variables in `.env`:
- `PORT`: Port number (default: 3001)
- `CORS_ORIGINS`: Comma-separated list of allowed origins (default: http://localhost:5173,http://localhost:3000)

5. Start the server:
```bash
npm start
```

The server will automatically create the required upload directories on startup.

## API Endpoints

### Upload Endpoints

#### POST /upload/candidate/profile_picture
Upload a candidate profile picture (JPEG, PNG, GIF, WebP, max 5MB)

**Request:**
- Content-Type: multipart/form-data
- Field name: `file`

**Response:**
```json
{
  "filename": "1234567890-profile.jpg",
  "url": "http://localhost:3001/uploads/candidates/profile_pictures/1234567890-profile.jpg"
}
```

#### POST /upload/candidate/cv
Upload a candidate CV (PDF only, max 10MB)

**Request:**
- Content-Type: multipart/form-data
- Field name: `file`

**Response:**
```json
{
  "filename": "1234567890-resume.pdf",
  "url": "http://localhost:3001/uploads/candidates/cvs/1234567890-resume.pdf"
}
```

#### POST /upload/job/image
Upload a job image (JPEG, PNG, GIF, WebP, max 5MB)

**Request:**
- Content-Type: multipart/form-data
- Field name: `file`

**Response:**
```json
{
  "filename": "1234567890-job-banner.jpg",
  "url": "http://localhost:3001/uploads/jobs/1234567890-job-banner.jpg"
}
```

### List Endpoints

#### GET /files/candidates/profile_pictures
List all candidate profile pictures

**Response:**
```json
[
  {
    "filename": "1234567890-profile.jpg",
    "url": "http://localhost:3001/uploads/candidates/profile_pictures/1234567890-profile.jpg"
  }
]
```

#### GET /files/candidates/cvs
List all candidate CVs

**Response:**
```json
[
  {
    "filename": "1234567890-resume.pdf",
    "url": "http://localhost:3001/uploads/candidates/cvs/1234567890-resume.pdf"
  }
]
```

#### GET /files/jobs
List all job images

**Response:**
```json
[
  {
    "filename": "1234567890-job-banner.jpg",
    "url": "http://localhost:3001/uploads/jobs/1234567890-job-banner.jpg"
  }
]
```

### Utility Endpoints

#### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok"
}
```

## Directory Structure

```
file-server/
├── server.js
├── package.json
├── .env.example
├── README.md
└── uploads/
    ├── candidates/
    │   ├── profile_pictures/
    │   └── cvs/
    └── jobs/
```

## Static File Access

All uploaded files are accessible via the `/uploads` route:
- Profile pictures: `http://localhost:3001/uploads/candidates/profile_pictures/{filename}`
- CVs: `http://localhost:3001/uploads/candidates/cvs/{filename}`
- Job images: `http://localhost:3001/uploads/jobs/{filename}`

## Features

- Automatic directory creation on server start
- CORS support for multiple origins
- File type validation
- File size limits
- Timestamp-prefixed filenames to prevent collisions
- Comprehensive error handling
- Multer integration for secure file uploads
