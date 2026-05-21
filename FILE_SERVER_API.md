# File Server API Documentation

The admin project now includes a centralized **File Server API** that allows you to upload, download, manage, and organize files across your application.

## Overview

The File Server provides a unified interface for handling files with the following features:

- **Multiple categories**: Organize files by type (candidates, profiles, partnerships, jobs, documents, images)
- **File validation**: Automatic validation based on file type and category
- **Size limits**: Configurable per-category file size limits
- **Bulk operations**: Upload multiple files at once
- **Security**: Directory traversal protection, MIME type validation
- **Statistics**: Track storage usage and file counts

## API Endpoints

### Base URL
```
/api/files
```

### 1. Upload Single File

**Endpoint:** `POST /api/files/upload/:category`

**Parameters:**
- `category` (path): One of `candidates`, `profiles`, `partnerships`, `jobs`, `documents`, `images`

**Request:**
```bash
curl -X POST \
  -F "file=@/path/to/file" \
  http://localhost:5000/api/files/upload/candidates
```

**Response (Success):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "filename": "resume-1704067200000-a1b2c3d4.pdf",
    "originalName": "resume.pdf",
    "size": 524288,
    "mimeType": "application/pdf",
    "url": "/uploads/candidates/resume-1704067200000-a1b2c3d4.pdf"
  }
}
```

**Categories and Allowed Types:**

| Category | Allowed File Types | Max Size |
|----------|-------------------|----------|
| `candidates` | Images, PDF, DOC, DOCX, TXT | 10 MB |
| `profiles` | Images (JPEG, PNG, GIF, WebP) | 5 MB |
| `partnerships` | Images, PDF | 8 MB |
| `jobs` | Images, PDF | 5 MB |
| `documents` | PDF, DOC, DOCX, TXT | 15 MB |
| `images` | Images (JPEG, PNG, GIF, WebP) | 10 MB |

### 2. Upload Multiple Files

**Endpoint:** `POST /api/files/upload-bulk/:category`

**Parameters:**
- `category` (path): File category
- `files` (form): Array of files (max 10 files)

**Request:**
```bash
curl -X POST \
  -F "files=@file1.pdf" \
  -F "files=@file2.jpg" \
  http://localhost:5000/api/files/upload-bulk/documents
```

**Response (Success):**
```json
{
  "success": true,
  "message": "2 file(s) uploaded successfully",
  "files": [
    {
      "filename": "resume-1704067200000-a1b2c3d4.pdf",
      "originalName": "resume.pdf",
      "size": 524288,
      "mimeType": "application/pdf",
      "url": "/uploads/documents/resume-1704067200000-a1b2c3d4.pdf"
    },
    {
      "filename": "cover-letter-1704067200001-e5f6g7h8.pdf",
      "originalName": "cover-letter.pdf",
      "size": 256000,
      "mimeType": "application/pdf",
      "url": "/uploads/documents/cover-letter-1704067200001-e5f6g7h8.pdf"
    }
  ]
}
```

### 3. List Files in Category

**Endpoint:** `GET /api/files/list/:category`

**Parameters:**
- `category` (path): File category

**Response:**
```json
{
  "success": true,
  "category": "candidates",
  "count": 3,
  "files": [
    {
      "filename": "profile-1704067200000-a1b2c3d4.jpg",
      "size": 256000,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "modifiedAt": "2024-01-01T12:00:00.000Z",
      "url": "/uploads/candidates/profile-1704067200000-a1b2c3d4.jpg"
    },
    {
      "filename": "resume-1704067200000-a1b2c3d4.pdf",
      "size": 524288,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "modifiedAt": "2024-01-01T12:00:00.000Z",
      "url": "/uploads/candidates/resume-1704067200000-a1b2c3d4.pdf"
    },
    {
      "filename": "certificate-1704067200000-a1b2c3d4.pdf",
      "size": 1048576,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "modifiedAt": "2024-01-01T12:00:00.000Z",
      "url": "/uploads/candidates/certificate-1704067200000-a1b2c3d4.pdf"
    }
  ]
}
```

### 4. Get File Information

**Endpoint:** `GET /api/files/info/:category/:filename`

**Parameters:**
- `category` (path): File category
- `filename` (path): File name

**Response:**
```json
{
  "success": true,
  "file": {
    "filename": "profile-1704067200000-a1b2c3d4.jpg",
    "size": 256000,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "modifiedAt": "2024-01-01T12:00:00.000Z",
    "url": "/uploads/candidates/profile-1704067200000-a1b2c3d4.jpg"
  }
}
```

### 5. Delete File

**Endpoint:** `DELETE /api/files/delete/:category/:filename`

**Parameters:**
- `category` (path): File category
- `filename` (path): File name

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Request:**
```bash
curl -X DELETE \
  http://localhost:5000/api/files/delete/candidates/profile-1704067200000-a1b2c3d4.jpg
```

### 6. Get Storage Statistics

**Endpoint:** `GET /api/files/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "candidates": {
      "fileCount": 5,
      "totalSize": 2097152,
      "totalSizeMB": "2.00"
    },
    "profiles": {
      "fileCount": 3,
      "totalSize": 1048576,
      "totalSizeMB": "1.00"
    },
    "partnerships": {
      "fileCount": 2,
      "totalSize": 524288,
      "totalSizeMB": "0.50"
    },
    "jobs": {
      "fileCount": 1,
      "totalSize": 262144,
      "totalSizeMB": "0.25"
    },
    "documents": {
      "fileCount": 0,
      "totalSize": 0,
      "totalSizeMB": "0.00"
    },
    "images": {
      "fileCount": 0,
      "totalSize": 0,
      "totalSizeMB": "0.00"
    }
  }
}
```

## Frontend Integration

### Using the File Server Utility

A utility class is provided in `src/utils/fileServer.ts` for easy integration:

```typescript
import { fileServer, type FileCategory } from '@/utils/fileServer'

// Upload a single file
const uploadFile = async (file: File) => {
  const response = await fileServer.uploadFile(file, 'candidates')
  if (response.success) {
    console.log('File uploaded:', response.file?.url)
  }
}

// Upload multiple files
const uploadMultiple = async (files: File[]) => {
  const response = await fileServer.uploadFiles(files, 'documents')
  if (response.success) {
    console.log('Files uploaded successfully')
  }
}

// List all files in a category
const listFiles = async () => {
  const response = await fileServer.listFiles('candidates')
  if (response.success) {
    response.files.forEach(file => {
      console.log(`${file.filename} (${file.size} bytes)`)
    })
  }
}

// Get file info
const getInfo = async () => {
  const response = await fileServer.getFileInfo('candidates', 'profile-1704067200000-a1b2c3d4.jpg')
  if (response.success) {
    console.log('File info:', response.file)
  }
}

// Delete a file
const deleteFile = async () => {
  const response = await fileServer.deleteFile('candidates', 'profile-1704067200000-a1b2c3d4.jpg')
  if (response.success) {
    console.log('File deleted')
  }
}

// Get statistics
const getStats = async () => {
  const response = await fileServer.getStats()
  if (response.success) {
    console.log('Storage stats:', response.stats)
  }
}

// Download a file
const downloadFile = async () => {
  const url = fileServer.getFileUrl('candidates', 'resume-1704067200000-a1b2c3d4.pdf')
  fileServer.downloadFile(url, 'resume.pdf')
}
```

### React Component Example

```typescript
import { useState } from 'react'
import { fileServer } from '@/utils/fileServer'

export const FileUploadComponent = () => {
  const [uploading, setUploading] = useState(false)
  const [uploadUrl, setUploadUrl] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const response = await fileServer.uploadFile(file, 'candidates')
    setUploading(false)

    if (response.success) {
      setUploadUrl(response.file?.url || '')
    } else {
      console.error(response.error)
    }
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
      {uploadUrl && (
        <div>
          <p>File uploaded successfully!</p>
          <a href={uploadUrl} target="_blank" rel="noopener noreferrer">
            View File
          </a>
        </div>
      )}
    </div>
  )
}
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid category` | Category doesn't exist | Use one of the valid categories listed above |
| `File too large` | File exceeds category limit | Reduce file size or use a category with higher limit |
| `Invalid file type` | File MIME type not allowed | Use an allowed file type for the category |
| `No file provided` | Request body missing file | Ensure file is included in FormData |
| `File not found` | File doesn't exist | Check filename and category |
| `Access denied` | Directory traversal attempt | This is a security restriction |

## Security Considerations

1. **Directory Traversal Protection**: Filenames are sanitized and validated to prevent directory traversal attacks
2. **MIME Type Validation**: Files are validated by both extension and MIME type
3. **File Size Limits**: Enforced per-category to prevent storage abuse
4. **Public Access**: Files are served as static files via `/uploads/:category/:filename` - ensure this is appropriate for your use case

## File Organization

Files are stored on the server in the following directory structure:

```
uploads/
├── candidates/
├── profiles/
├── partnerships/
├── jobs/
├── documents/
└── images/
```

Each file is automatically renamed with a timestamp and random suffix to ensure uniqueness:
```
{category}-{timestamp}-{random-hex}.{extension}
```

Example: `resume-1704067200000-a1b2c3d4.pdf`

## Usage Examples

### Upload Candidate Profile Picture and Resume

```typescript
// Profile picture
const profilePictureResponse = await fileServer.uploadFile(
  profilePictureFile,
  'candidates'
)

// Resume
const resumeResponse = await fileServer.uploadFile(resumeFile, 'candidates')

// Save URLs to database
const candidate = {
  name: 'John Doe',
  profile_picture: profilePictureResponse.file?.url,
  resume_url: resumeResponse.file?.url,
}
```

### Display File Gallery

```typescript
const { files } = await fileServer.listFiles('candidates')

return (
  <div className="gallery">
    {files.map((file) => (
      <div key={file.filename}>
        {file.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
          <img src={file.url} alt={file.filename} />
        ) : (
          <a href={file.url} download>
            {file.filename}
          </a>
        )}
      </div>
    ))}
  </div>
)
```

### Monitor Storage Usage

```typescript
const stats = await fileServer.getStats()

Object.entries(stats.stats).forEach(([category, data]) => {
  console.log(`${category}: ${data.fileCount} files, ${data.totalSizeMB}MB used`)
})
```

## API Status Codes

- `200`: Successful GET request
- `201`: Successful file creation
- `400`: Bad request (invalid category, file type, size, etc.)
- `403`: Forbidden (security restriction)
- `404`: File not found
- `500`: Server error

## Future Enhancements

Potential improvements for the file server:

- File preview/thumbnail generation
- Virus scanning integration
- File versioning/backup
- Access control lists (ACL)
- File encryption
- Cloud storage integration (AWS S3, Google Cloud Storage, etc.)
- Compression and optimization
- Content-Addressed Storage (IPFS, etc.)
