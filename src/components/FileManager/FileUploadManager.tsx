import { useState, useEffect } from 'react'
import { fileServer, type FileCategory, type FileInfo } from '@/utils/fileServer'
import { notify } from '@/utils/notification'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface FileUploadManagerProps {
  category: FileCategory
  maxFiles?: number
  onUploadSuccess?: (file: { filename: string; url: string }) => void
}

export const FileUploadManager = ({
  category,
  maxFiles = 1,
  onUploadSuccess,
}: FileUploadManagerProps) => {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [category])

  const loadFiles = async () => {
    setLoading(true)
    const response = await fileServer.listFiles(category)
    if (response.success) {
      setFiles(response.files)
    }
    setLoading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const filesToUpload = Array.from(selectedFiles).slice(0, maxFiles)

    setUploading(true)

    for (const file of filesToUpload) {
      const response = await fileServer.uploadFile(file, category)

      if (response.success && response.file) {
        notify.success('Success', `${file.name} uploaded successfully`)
        onUploadSuccess?.(response.file)
        setFiles((prev) => [...prev, {
          filename: response.file!.filename,
          originalName: response.file!.originalName,
          size: response.file!.size,
          url: response.file!.url,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        }])
      } else {
        notify.error('Upload Failed', response.error || 'Failed to upload file')
      }
    }

    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (filename: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return

    const response = await fileServer.deleteFile(category, filename)

    if (response.success) {
      notify.success('Success', 'File deleted successfully')
      setFiles((prev) => prev.filter((f) => f.filename !== filename))
    } else {
      notify.error('Error', response.error || 'Failed to delete file')
    }
  }

  const handleDownload = (file: FileInfo) => {
    fileServer.downloadFile(file.url, file.filename)
  }

  const isImage = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)
  }

  return (
    <Card className="card-border">
      <div className="card-body">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-semibold">File Manager - {category}</h4>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Upload Area */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center mb-6">
          <input
            type="file"
            id={`file-upload-${category}`}
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
            multiple={maxFiles > 1}
          />
          <label htmlFor={`file-upload-${category}`} className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </span>
            </div>
          </label>
        </div>

        {/* Files List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No files uploaded yet
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.filename}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <div className="flex items-center gap-3 flex-1">
                  {isImage(file.filename) ? (
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8 16.5a1 1 0 11-2 0 1 1 0 012 0zM15 7H4v2h11V7zM4 5h11V3H4v2zm11 8H4v2h11v-2z" />
                    </svg>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB • {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                    title="Download"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(file.filename)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition text-red-500"
                    title="Delete"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

export default FileUploadManager
