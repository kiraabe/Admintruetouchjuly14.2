# File Server Integration Guide

## Overview

The frontend has been integrated with the dedicated Express.js file server. All file uploads (candidate profile pictures, CVs, and job images) now go through the file server and are publicly accessible.

## Setup

### 1. Start the File Server

```bash
cd file-server
npm install
cp .env.example .env
npm start
```

The server will run on `http://localhost:3001` by default.

### 2. Frontend Configuration

The frontend automatically uses the file server for all uploads. No additional configuration is needed if the file server is running on the default port (3001).

To use a different port, update the `FILE_SERVER_URL` in `src/utils/fileServer.ts`:

```typescript
const FILE_SERVER_URL = 'http://localhost:YOUR_PORT'
```

## How It Works

### Candidate Profile Pictures

1. User selects an image in the EditCandidate form
2. On form submission, the image is uploaded to the file server via `POST /upload/candidate/profile_picture`
3. The file server returns a public URL
4. The public URL is saved in the database as `profile_picture`
5. Profile pictures are accessible at `http://localhost:3001/uploads/candidates/profile_pictures/{filename}`

**Updated code:** `src/views/EditCandidate.tsx` - `handleSubmit` method

### Candidate CVs

1. User selects a PDF file in the EditCandidate form
2. On form submission, the CV is uploaded to the file server via `POST /upload/candidate/cv`
3. The file server returns a public URL
4. The public URL is saved in the database as `resume_url`
5. CVs are accessible at `http://localhost:3001/uploads/candidates/cvs/{filename}`

**Updated code:** `src/views/EditCandidate.tsx` - `handleSubmit` method

### Job Images

1. User selects an image in the Job creation/edit form
2. On form submission, the image is uploaded to the file server via `POST /upload/job/image`
3. The file server returns a public URL
4. The public URL is saved in the database as `image_url`
5. Job images are accessible at `http://localhost:3001/uploads/jobs/{filename}`

**Updated code:** `src/views/Job.tsx` - `handleSave` method

## File Validation

The file server validates all uploads:

- **Profile Pictures:** JPEG, PNG, GIF, WebP (max 5MB)
- **CVs:** PDF only (max 10MB)
- **Job Images:** JPEG, PNG, GIF, WebP (max 5MB)

Invalid files are rejected with clear error messages.

## Utility Functions

All file upload functions are in `src/utils/fileServer.ts`:

```typescript
uploadCandidateProfilePicture(file: File): Promise<UploadResponse>
uploadCandidateCV(file: File): Promise<UploadResponse>
uploadJobImage(file: File): Promise<UploadResponse>
getProfilePictures(): Promise<UploadResponse[]>
getCVs(): Promise<UploadResponse[]>
getJobImages(): Promise<UploadResponse[]>
```

## File Naming

Files are saved with a timestamp prefix to prevent name collisions:
- `1716451234567-profile.jpg`
- `1716451234567-resume.pdf`
- `1716451234567-job-banner.jpg`

## Public Access

All uploaded files are publicly accessible through static routes:
- Profile pictures: `GET /uploads/candidates/profile_pictures/{filename}`
- CVs: `GET /uploads/candidates/cvs/{filename}`
- Job images: `GET /uploads/jobs/{filename}`

## CORS Configuration

The file server has CORS enabled for the admin panel and landing site. Configure allowed origins in the file server's `.env`:

```
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Database Updates

The database now stores public URLs instead of files:

- **Candidates table:** `profile_picture` column stores public URL
- **Candidates table:** `resume_url` column stores public URL
- **Jobs table:** `image_url` column stores public URL

Example values:
```
http://localhost:3001/uploads/candidates/profile_pictures/1716451234567-profile.jpg
http://localhost:3001/uploads/candidates/cvs/1716451234567-resume.pdf
http://localhost:3001/uploads/jobs/1716451234567-job-banner.jpg
```

## Error Handling

Upload errors are caught and displayed to users:
- Invalid file type
- File size exceeds limit
- Network errors
- Server errors

All errors display user-friendly messages via toast notifications.

## Directory Structure

```
file-server/
├── server.js
├── package.json
├── .env.example
├── .env
├── README.md
└── uploads/
    ├── candidates/
    │   ├── profile_pictures/
    │   └── cvs/
    └── jobs/
```

## Testing

1. Navigate to `/candidates/edit/new`
2. Fill in candidate details
3. Upload a profile picture
4. Upload a CV
5. Submit the form
6. Check that the files are accessible at their public URLs

For jobs:
1. Navigate to the Jobs section
2. Create or edit a job
3. Upload a job image
4. Submit
5. Verify the image is displayed with the public URL
