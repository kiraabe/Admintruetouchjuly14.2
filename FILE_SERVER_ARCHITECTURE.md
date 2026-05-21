# File Server Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Admin Application                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Frontend (React Components)                 │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  EditCandidate.tsx                                │  │   │
│  │  │  - Profile Picture Upload                         │  │   │
│  │  │  - Resume Upload                                  │  │   │
│  │  │  - External URL Input                             │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  FileUploadManager.tsx                            │  │   │
│  │  │  - File Upload UI                                 │  │   │
│  │  │  - File List Display                              │  │   │
│  │  │  - Download/Delete Actions                        │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Other Components...                              │  │   │
│  │  │  - User Profiles                                  │  │   │
│  │  │  - Partnerships                                   │  │   │
│  │  │  - Job Listings                                   │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Utility Library (TypeScript)                   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │              fileServer.ts                               │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  uploadFile(file, category)                       │  │   │
│  │  │  uploadFiles(files, category)                     │  │   │
│  │  │  listFiles(category)                              │  │   │
│  │  │  getFileInfo(category, filename)                  │  │   │
│  │  │  deleteFile(category, filename)                   │  │   │
│  │  │  getStats()                                       │  │   │
│  │  │  downloadFile(url, filename)                      │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↓                                        │
└─────────────────────────────────────────────────────────────────┘
              HTTP Requests (Fetch API)
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js Server                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐     │
│  │         File Server Router (/api/files)               │     │
│  │  ┌──────────────────────────────────────────────────┐ │     │
│  │  │  POST   /upload/:category                       │ │     │
│  │  │  POST   /upload-bulk/:category                  │ │     │
│  │  │  GET    /list/:category                         │ │     │
│  │  │  GET    /info/:category/:filename               │ │     │
│  │  │  DELETE /delete/:category/:filename             │ │     │
│  │  │  GET    /stats                                  │ │     │
│  │  └──────────────────────────────────────────────────┘ │     │
│  └────────────────────────────────────────────────────────┘     │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐     │
│  │         Multer Middleware                            │     │
│  │  ┌──────────────────────────────────────────────────┐ │     │
│  │  │  File Validation                                │ │     │
│  │  │  - MIME Type Check                              │ │     │
│  │  │  - File Size Check                              │ │     │
│  │  │  - Extension Check                              │ │     │
│  │  └──────────────────────────────────────────────────┘ │     │
│  └────────────────────────────────────────────────────────┘     │
│                          ↓                                       │
└─────────────────────────────────────────────────────────────────┘
              Filesystem Operations
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Server File System                             │
├─────────────────────────────────────────────────────────────────┤
│  uploads/                                                        │
│  ├── candidates/      (10 MB max)                              │
│  │   ├── profile-1704067200000-a1b2c3d4.jpg                   │
│  │   ├── resume-1704067200000-b2c3d4e5.pdf                    │
│  │   └── ...                                                   │
│  ├── profiles/        (5 MB max)                               │
│  │   ├── avatar-1704067200000-c3d4e5f6.png                    │
│  │   └── ...                                                   │
│  ├── partnerships/    (8 MB max)                               │
│  ├── jobs/           (5 MB max)                                │
│  ├── documents/      (15 MB max)                               │
│  └── images/         (10 MB max)                               │
│                                                                 │
│  Static serving via Express.static:                            │
│  GET /uploads/:category/:filename → File content              │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Upload Flow
```
User selects file
        ↓
FileUploadManager component
        ↓
fileServer.uploadFile(file, category)
        ↓
HTTP POST /api/files/upload/candidates
        ↓
Express Router Handler
        ↓
Multer Middleware
        ├─ Validate MIME type
        ├─ Check file size
        └─ Generate unique filename
        ↓
Write to Filesystem
        ├─ uploads/candidates/profile-TIMESTAMP-RANDOM.jpg
        ├─ uploads/candidates/resume-TIMESTAMP-RANDOM.pdf
        └─ ...
        ↓
Return Response
{
  success: true,
  file: {
    filename: "profile-1704067200000-a1b2c3d4.jpg",
    url: "/uploads/candidates/profile-1704067200000-a1b2c3d4.jpg"
  }
}
        ↓
Save URL to Database
```

### Download/Access Flow
```
Component needs file
        ↓
Request via fileServer utility
or direct HTTP GET
        ↓
GET /api/files/list/:category
        ↓
Express Router reads directory
        ↓
Return file list with URLs
        ↓
Display in Component
or Download via browser
```

## Component Integration Map

```
EditCandidate.tsx
├── Profile Picture Upload/URL
│   └── fileServer.uploadFile() → /uploads/candidates/...
├── Resume Upload/URL
│   └── fileServer.uploadFile() → /uploads/candidates/...
└── Database Save
    └── Stores URL: /uploads/candidates/resume-TIMESTAMP.pdf

FileUploadManager.tsx
├── Upload handler
│   └── fileServer.uploadFile()
├── List handler
│   └── fileServer.listFiles()
├── Delete handler
│   └── fileServer.deleteFile()
└── Download handler
    └── fileServer.downloadFile()

Other Components (Future)
├── UserProfile.tsx
│   └── fileServer with 'profiles' category
├── Partnership.tsx
│   └── fileServer with 'partnerships' category
└── JobListing.tsx
    └── fileServer with 'jobs' category
```

## Category Configuration

```
┌─────────────────────────────────────────────────────────┐
│              File Category Configuration                │
├──────────┬──────────────────┬────────────┬──────────────┤
│Category  │ Allowed Types    │ Max Size   │ Use Case     │
├──────────┼──────────────────┼────────────┼──────────────┤
│candidates│ IMG,PDF,DOC,TXT │ 10 MB      │ Profiles     │
│profiles  │ Images Only      │ 5 MB       │ Avatars      │
│partners  │ IMG, PDF         │ 8 MB       │ Docs         │
│jobs      │ IMG, PDF         │ 5 MB       │ Listings     │
│documents │ PDF,DOC,TXT      │ 15 MB      │ General      │
│images    │ Images Only      │ 10 MB      │ Gallery      │
└──────────┴──────────────────┴────────────┴──────────────┘

Validation Stack:
1. Check MIME type
2. Check file extension
3. Check file size
4. Sanitize filename
5. Generate unique filename
6. Save to correct directory
```

## Request/Response Flow

### Single File Upload
```
Request:
POST /api/files/upload/candidates
Content-Type: multipart/form-data
[Binary file data]

Response:
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "filename": "profile-1704067200000-a1b2c3d4.jpg",
    "originalName": "my-profile.jpg",
    "size": 256000,
    "mimeType": "image/jpeg",
    "url": "/uploads/candidates/profile-1704067200000-a1b2c3d4.jpg"
  }
}
```

### List Files
```
Request:
GET /api/files/list/candidates

Response:
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
    ...
  ]
}
```

### Delete File
```
Request:
DELETE /api/files/delete/candidates/profile-1704067200000-a1b2c3d4.jpg

Response:
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Storage Statistics
```
Request:
GET /api/files/stats

Response:
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
    ...
  }
}
```

## Security Layers

```
Layer 1: Request Validation
├─ Check category exists
├─ Validate file provided
└─ Check request format

Layer 2: File Validation
├─ MIME type check
├─ File extension check
├─ File size check
└─ Magic number validation (optional)

Layer 3: Path Security
├─ Sanitize filename
├─ Prevent directory traversal
├─ Use absolute paths
└─ Validate category path

Layer 4: Storage Security
├─ Unique filename generation
├─ Atomic file operations
├─ Permission management
└─ Directory organization

Layer 5: Access Control (Optional)
├─ JWT authentication
├─ User-based access
├─ Rate limiting
└─ CORS policies
```

## Scalability Considerations

```
Current: Local File System
├─ Cost: Free
├─ Capacity: Disk size limited
├─ Performance: Good for < 1000 files
└─ Reliability: Single point of failure

Future: Cloud Storage (AWS S3, GCS, etc.)
├─ Cost: Pay per GB
├─ Capacity: Unlimited
├─ Performance: Global CDN
├─ Reliability: High availability
└─ Implementation: Drop-in replacement

Hybrid Approach:
├─ Local cache for frequently accessed files
├─ Cloud storage for archival
├─ Sync mechanism for backup
└─ API abstraction for flexibility
```

## Monitoring Points

```
API Level
├─ Request count by category
├─ Upload success rate
├─ Average upload time
├─ Error distribution
└─ Peak usage times

Storage Level
├─ Disk usage by category
├─ File count by category
├─ Largest files
├─ Orphaned files
└─ Storage growth rate

Performance Level
├─ Upload latency
├─ Download speed
├─ List operation time
├─ Delete operation time
└─ API response times
```
