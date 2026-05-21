# File Server Integration Guide

This guide explains how to integrate the new centralized File Server API into your admin project.

## What's Included

### 1. **Backend API** (`src/server/routes/files/index.ts`)
A comprehensive file server with the following features:
- Single file upload: `POST /api/files/upload/:category`
- Bulk file upload: `POST /api/files/upload-bulk/:category`
- List files: `GET /api/files/list/:category`
- Get file info: `GET /api/files/info/:category/:filename`
- Delete file: `DELETE /api/files/delete/:category/:filename`
- Server stats: `GET /api/files/stats`

### 2. **Frontend Utility** (`src/utils/fileServer.ts`)
TypeScript utility class for easy integration:
```typescript
import { fileServer } from '@/utils/fileServer'

// Upload a file
const response = await fileServer.uploadFile(file, 'candidates')

// Download a file
fileServer.downloadFile(url, 'filename.pdf')

// Get file list
const files = await fileServer.listFiles('candidates')
```

### 3. **File Manager Component** (`src/components/FileManager/FileUploadManager.tsx`)
Pre-built React component with:
- File upload UI
- File list display
- Delete functionality
- Download functionality
- Image preview support

### 4. **Documentation** (`FILE_SERVER_API.md`)
Complete API reference with examples for all endpoints

## Quick Start

### Update Candidate Form to Use File Server

In `src/views/EditCandidate.tsx`, you already have URL support. To add file server integration:

```typescript
import { fileServer } from '@/utils/fileServer'

// In your component
const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Upload to file server
  const response = await fileServer.uploadFile(file, 'candidates')
  
  if (response.success && response.file) {
    // Use the returned URL
    setProfilePictureUrl(response.file.url)
    setProfilePicturePreview(response.file.url)
  }
}
```

### Use File Manager Component

In any component, import and use the file manager:

```typescript
import { FileUploadManager } from '@/components/FileManager/FileUploadManager'

export const MyComponent = () => {
  return (
    <FileUploadManager
      category="candidates"
      maxFiles={1}
      onUploadSuccess={(file) => {
        console.log('File uploaded:', file.url)
        // Do something with the file URL
      }}
    />
  )
}
```

## File Categories

The file server organizes files into categories with different validation rules:

| Category | Allowed Types | Max Size | Use Case |
|----------|---------------|----------|----------|
| `candidates` | Images, PDF, DOC, DOCX, TXT | 10 MB | Candidate profiles & resumes |
| `profiles` | Images only | 5 MB | User profile pictures |
| `partnerships` | Images, PDF | 8 MB | Partnership documents |
| `jobs` | Images, PDF | 5 MB | Job listings |
| `documents` | PDF, DOC, DOCX, TXT | 15 MB | General documents |
| `images` | Images only | 10 MB | General images |

## Storage Location

Files are stored on the server at:
```
uploads/
├── candidates/
├── profiles/
├── partnerships/
├── jobs/
├── documents/
└── images/
```

Files are automatically renamed with timestamp and random suffix:
```
{type}-{timestamp}-{random}.{extension}
```

Example: `resume-1704067200000-a1b2c3d4.pdf`

## API Endpoints Summary

### Upload Files
```
POST /api/files/upload/:category
POST /api/files/upload-bulk/:category
```

### Manage Files
```
GET  /api/files/list/:category
GET  /api/files/info/:category/:filename
DELETE /api/files/delete/:category/:filename
```

### Server Info
```
GET /api/files/stats
```

## Error Handling

All responses follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "file": { /* file data */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message describing the issue"
}
```

Always check `response.success` before accessing data:

```typescript
const response = await fileServer.uploadFile(file, 'candidates')
if (response.success) {
  console.log('File URL:', response.file?.url)
} else {
  console.error('Upload failed:', response.error)
}
```

## Usage Examples

### Example 1: Upload Candidate Profile

```typescript
const handleUploadCandidate = async (profilePic: File, resume: File) => {
  const profileRes = await fileServer.uploadFile(profilePic, 'candidates')
  const resumeRes = await fileServer.uploadFile(resume, 'candidates')

  if (profileRes.success && resumeRes.success) {
    const candidate = {
      name: 'John Doe',
      profile_picture: profileRes.file?.url,
      resume_url: resumeRes.file?.url,
    }
    // Save candidate to database
  }
}
```

### Example 2: File Gallery

```typescript
const FileGallery = ({ category }: { category: FileCategory }) => {
  const [files, setFiles] = useState<FileInfo[]>([])

  useEffect(() => {
    const loadFiles = async () => {
      const res = await fileServer.listFiles(category)
      if (res.success) setFiles(res.files)
    }
    loadFiles()
  }, [category])

  return (
    <div className="gallery">
      {files.map((file) => (
        <div key={file.filename}>
          {file.filename.match(/\.(jpg|png|gif)$/i) ? (
            <img src={file.url} alt={file.filename} />
          ) : (
            <a href={file.url} download>
              Download {file.filename}
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Example 3: Monitor Storage

```typescript
const StorageStats = () => {
  useEffect(() => {
    const checkStorage = async () => {
      const res = await fileServer.getStats()
      if (res.success) {
        Object.entries(res.stats).forEach(([category, data]) => {
          console.log(`${category}: ${data.fileCount} files, ${data.totalSizeMB}MB`)
        })
      }
    }
    checkStorage()
  }, [])

  return <div>Storage stats loaded</div>
}
```

## Integration Points

### In EditCandidate Component
The form already supports both file upload and URL input. Files are now uploaded via the file server API.

### In Candidate List
To download files:
```typescript
<a href={candidate.resume_url} download>
  Download Resume
</a>
```

### In Partnership Management
Upload partnership documents:
```typescript
const res = await fileServer.uploadFile(doc, 'partnerships')
```

### In User Profile
Upload profile pictures:
```typescript
const res = await fileServer.uploadFile(pic, 'profiles')
```

## Security Features

1. **File Type Validation**: Files validated by MIME type and extension
2. **Size Limits**: Per-category size limits prevent abuse
3. **Directory Traversal Protection**: Filename sanitization prevents attacks
4. **Unique Filenames**: Timestamp + random suffix prevents collisions
5. **Static File Serving**: Public access only to `/uploads` directory

## Future Enhancements

Consider adding these features:

1. **Compression**: Automatically compress images
2. **Thumbnails**: Generate image thumbnails
3. **Versioning**: Keep file history
4. **Cloud Sync**: Sync to AWS S3 or Google Cloud
5. **Virus Scanning**: Scan uploads for malware
6. **ACL**: Per-file access control
7. **Encryption**: Encrypt sensitive files
8. **Expiration**: Auto-delete old files

## Troubleshooting

### File Upload Fails
- Check file size (within category limit?)
- Verify file type is allowed
- Ensure directory permissions allow writes

### File Not Found
- Check filename spelling
- Verify correct category
- Ensure file hasn't been deleted

### Storage Growing Too Large
- Run `/api/files/stats` to see usage
- Delete unused files via API
- Consider archiving or cloud storage

## Support

For questions or issues:
1. Check `FILE_SERVER_API.md` for API reference
2. Review component examples in `FileUploadManager.tsx`
3. Check browser console for detailed error messages
4. Verify server logs for backend errors

## Next Steps

1. ✅ File server API is installed and running
2. ✅ Utility class available in `src/utils/fileServer.ts`
3. ✅ Example component at `src/components/FileManager/FileUploadManager.tsx`
4. 📋 Start using in your components via `fileServer.uploadFile()`
5. 📋 Monitor storage with `/api/files/stats`
6. 📋 Consider cloud storage integration in the future
