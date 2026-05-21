# File Server Quick Start Guide

## TL;DR - Get Started in 5 Minutes

### 1. Import the Utility
```typescript
import { fileServer } from '@/utils/fileServer'
```

### 2. Upload a File
```typescript
const response = await fileServer.uploadFile(file, 'candidates')
if (response.success) {
  console.log(response.file?.url) // /uploads/candidates/...
}
```

### 3. Done! 🎉
File is saved and accessible at the returned URL.

---

## Most Common Operations

### Upload Candidate Profile & Resume
```typescript
// Single file
const pic = await fileServer.uploadFile(profilePicFile, 'candidates')
const resume = await fileServer.uploadFile(resumeFile, 'candidates')

// Use URLs
saveToDB({
  profile_picture: pic.file?.url,
  resume_url: resume.file?.url,
})
```

### Display All Files
```typescript
const { files } = await fileServer.listFiles('candidates')
files.forEach(f => console.log(f.filename, f.url))
```

### Download a File
```typescript
const url = '/uploads/candidates/resume-timestamp.pdf'
fileServer.downloadFile(url, 'resume.pdf')
```

### Delete a File
```typescript
await fileServer.deleteFile('candidates', 'profile-timestamp.jpg')
```

### Monitor Storage
```typescript
const { stats } = await fileServer.getStats()
console.log(stats.candidates.totalSizeMB, 'MB used')
```

---

## File Categories Cheat Sheet

| Need | Category | Max Size |
|------|----------|----------|
| Profile pics | `profiles` | 5 MB |
| Candidate data | `candidates` | 10 MB |
| Documents | `documents` | 15 MB |
| Partnership files | `partnerships` | 8 MB |
| Job listings | `jobs` | 5 MB |
| Images | `images` | 10 MB |

---

## API Endpoints at a Glance

```bash
# Upload
curl -F "file=@file.pdf" http://localhost:5000/api/files/upload/candidates

# List
curl http://localhost:5000/api/files/list/candidates

# Delete
curl -X DELETE http://localhost:5000/api/files/delete/candidates/filename.pdf

# Stats
curl http://localhost:5000/api/files/stats
```

---

## Component Example

```typescript
import { FileUploadManager } from '@/components/FileManager/FileUploadManager'

export const MyForm = () => {
  return (
    <FileUploadManager
      category="candidates"
      maxFiles={1}
      onUploadSuccess={(file) => {
        console.log('File ready:', file.url)
        // Use file.url in your form
      }}
    />
  )
}
```

---

## Error Handling Cheat Sheet

```typescript
const response = await fileServer.uploadFile(file, 'candidates')

if (!response.success) {
  switch (response.error) {
    case 'File too large':
      console.error('Max 10MB for candidates')
      break
    case 'Invalid file type':
      console.error('Only images, PDF, DOC, DOCX, TXT allowed')
      break
    case 'No file provided':
      console.error('Select a file first')
      break
    default:
      console.error(response.error)
  }
}
```

---

## TypeScript Types

```typescript
import { fileServer, type FileCategory, type FileInfo } from '@/utils/fileServer'

// File categories
type FileCategory = 'candidates' | 'profiles' | 'partnerships' | 'jobs' | 'documents' | 'images'

// File info
interface FileInfo {
  filename: string
  size: number
  createdAt: string
  modifiedAt: string
  url: string
}
```

---

## Useful Snippets

### Save upload result to state
```typescript
const [uploadUrl, setUploadUrl] = useState('')

const handleUpload = async (file: File) => {
  const res = await fileServer.uploadFile(file, 'candidates')
  if (res.success) setUploadUrl(res.file?.url || '')
}
```

### Display image preview
```typescript
const [preview, setPreview] = useState('')

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }
}

return <img src={preview || uploadUrl} alt="preview" />
```

### File list with images
```typescript
const [files, setFiles] = useState<FileInfo[]>([])

useEffect(() => {
  fileServer.listFiles('candidates').then(res => {
    if (res.success) setFiles(res.files)
  })
}, [])

return (
  <>
    {files.map(f => (
      <img key={f.filename} src={f.url} alt={f.filename} />
    ))}
  </>
)
```

### Format file size
```typescript
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Usage
console.log(formatSize(256000)) // "250 KB"
```

---

## Debugging

### Check what files exist
```typescript
const res = await fileServer.listFiles('candidates')
console.log(res.files)
```

### Check storage usage
```typescript
const res = await fileServer.getStats()
console.log(res.stats.candidates)
```

### Check file details
```typescript
const res = await fileServer.getFileInfo('candidates', 'profile-12345.jpg')
console.log(res.file)
```

### Check network requests
1. Open DevTools (F12)
2. Go to Network tab
3. Upload/download a file
4. See the `/api/files/...` request

---

## Common Patterns

### Upload multiple files at once
```typescript
const files = e.target.files
const responses = await Promise.all(
  Array.from(files).map(f => fileServer.uploadFile(f, 'candidates'))
)
```

### Upload and save in one operation
```typescript
const res = await fileServer.uploadFile(file, 'candidates')
if (res.success) {
  await saveCandidate({
    name: 'John',
    profile_picture: res.file?.url,
  })
}
```

### Conditional upload (only if file selected)
```typescript
const formData = { name: 'John' }

if (profilePic) {
  const res = await fileServer.uploadFile(profilePic, 'candidates')
  if (res.success) {
    formData.profile_picture = res.file?.url
  }
}

await saveCandidate(formData)
```

### Retry on failure
```typescript
const uploadWithRetry = async (file: File, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const res = await fileServer.uploadFile(file, 'candidates')
    if (res.success) return res.file?.url
    if (i < retries - 1) await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error('Upload failed after retries')
}
```

---

## Real-World Example: Edit Candidate

```typescript
import { useState } from 'react'
import { fileServer } from '@/utils/fileServer'

export const EditCandidate = ({ candidateId }: { candidateId: string }) => {
  const [formData, setFormData] = useState({ name: '', profilePic: '', resume: '' })
  const [uploading, setUploading] = useState(false)

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const res = await fileServer.uploadFile(file, 'candidates')
    setUploading(false)

    if (res.success) {
      setFormData(prev => ({ ...prev, profilePic: res.file?.url || '' }))
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const res = await fileServer.uploadFile(file, 'candidates')
    setUploading(false)

    if (res.success) {
      setFormData(prev => ({ ...prev, resume: res.file?.url || '' }))
    }
  }

  const handleSubmit = async () => {
    // Save to database with URLs
    const response = await fetch(`/api/candidates/${candidateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    // Handle response...
  }

  return (
    <div>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Name"
      />

      <input
        type="file"
        onChange={handleProfilePicUpload}
        disabled={uploading}
      />
      {formData.profilePic && <p>✓ Profile picture uploaded</p>}

      <input
        type="file"
        onChange={handleResumeUpload}
        disabled={uploading}
      />
      {formData.resume && <p>✓ Resume uploaded</p>}

      <button onClick={handleSubmit} disabled={uploading}>
        Save Candidate
      </button>
    </div>
  )
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Upload fails | Check file size and type |
| File not found | Verify filename and category |
| CORS error | Check CORS settings in server |
| Slow uploads | File too large, reduce size |
| Storage full | Delete old files or clean up |

---

## Next Steps

1. ✅ Try uploading a file with `fileServer.uploadFile()`
2. ✅ List files with `fileServer.listFiles()`
3. ✅ Download with `fileServer.downloadFile()`
4. ✅ Integrate `FileUploadManager` component
5. ✅ Monitor with `/api/files/stats`
6. 📋 Add auth/permissions as needed
7. 📋 Consider cloud storage for scale

---

## Support Resources

- **API Docs**: `FILE_SERVER_API.md`
- **Integration Guide**: `FILE_SERVER_INTEGRATION.md`
- **Architecture**: `FILE_SERVER_ARCHITECTURE.md`
- **Implementation Summary**: `FILE_SERVER_SUMMARY.md`

---

**Ready to use! Start with `fileServer.uploadFile()` 🚀**
