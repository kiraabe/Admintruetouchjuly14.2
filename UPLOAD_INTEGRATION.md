# File Upload Integration

All file uploads (candidate profile pictures, CVs, and job images) are now integrated into the main backend server running on the same port.

## Setup

Just run the normal dev command:
```bash
npm run dev
```

This starts both the frontend and backend on their configured ports (Vite on 5173, Backend on 5000 by default).

## How It Works

### Upload Endpoints

All upload endpoints are available at `/api/upload`:

- `POST /api/upload/candidate/profile_picture` - Upload candidate profile picture
- `POST /api/upload/candidate/cv` - Upload candidate CV (PDF)
- `POST /api/upload/job/image` - Upload job image

### File Access

Uploaded files are served as static files under `/uploads`:

- Profile pictures: `/uploads/candidates/profile_pictures/{filename}`
- CVs: `/uploads/candidates/cvs/{filename}`
- Job images: `/uploads/jobs/{filename}`

Full URLs are returned from upload endpoints and stored in the database.

### Directory Structure

```
uploads/
├── candidates/
│   ├── profile_pictures/
│   └── cvs/
└── jobs/
```

Directories are created automatically on server startup.

## Frontend Integration

The frontend uses utility functions in `src/utils/fileServer.ts`:

```typescript
uploadCandidateProfilePicture(file: File)
uploadCandidateCV(file: File)
uploadJobImage(file: File)
getProfilePictures()
getCVs()
getJobImages()
```

These functions handle:
- Uploading files to the backend
- Returning public URLs
- Error handling with user-friendly messages

## File Validation

The backend validates all uploads:

- **Profile Pictures**: JPEG, PNG, GIF, WebP (max 5MB)
- **CVs**: PDF only (max 10MB)
- **Job Images**: JPEG, PNG, GIF, WebP (max 5MB)

Invalid files are rejected with error messages.

## Filename Format

Files are saved with a timestamp prefix to prevent collisions:
- `1716451234567-filename.jpg`

## Database

The database stores public URLs:

- **Candidates**: `profile_picture` column stores URL
- **Candidates**: `resume_url` column stores URL
- **Jobs**: `image_url` column stores URL

Example:
```
http://localhost:5000/uploads/candidates/profile_pictures/1716451234567-avatar.jpg
```

## No Separate Server

There is no separate file server - everything runs on one port. This simplifies deployment and eliminates CORS issues.
