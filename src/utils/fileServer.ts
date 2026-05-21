/**
 * File Server API Utility
 * Provides methods to upload, download, and manage files through the centralized file server
 */

export type FileCategory = 'candidates' | 'profiles' | 'partnerships' | 'jobs' | 'documents' | 'images'

export interface UploadResponse {
  success: boolean
  message?: string
  file?: {
    filename: string
    originalName: string
    size: number
    mimeType: string
    url: string
  }
  error?: string
}

export interface FileInfo {
  filename: string
  size: number
  createdAt: string
  modifiedAt: string
  url: string
}

export interface ListResponse {
  success: boolean
  category: string
  count: number
  files: FileInfo[]
  error?: string
}

export interface StatsResponse {
  success: boolean
  stats: Record<string, { fileCount: number; totalSize: number; totalSizeMB: string }>
  error?: string
}

class FileServer {
  private baseUrl: string

  constructor(baseUrl: string = '/api/files') {
    this.baseUrl = baseUrl
  }

  /**
   * Upload a single file
   */
  async uploadFile(file: File, category: FileCategory): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${this.baseUrl}/upload/${category}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  /**
   * Upload multiple files (max 10)
   */
  async uploadFiles(files: File[], category: FileCategory): Promise<UploadResponse> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    try {
      const response = await fetch(`${this.baseUrl}/upload-bulk/${category}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Bulk upload failed')
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk upload failed',
      }
    }
  }

  /**
   * List all files in a category
   */
  async listFiles(category: FileCategory): Promise<ListResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/list/${category}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to list files')
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        category,
        count: 0,
        files: [],
        error: error instanceof Error ? error.message : 'Failed to list files',
      }
    }
  }

  /**
   * Get information about a specific file
   */
  async getFileInfo(category: FileCategory, filename: string): Promise<{ success: boolean; file?: FileInfo; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/info/${category}/${encodeURIComponent(filename)}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get file info')
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file info',
      }
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(category: FileCategory, filename: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/delete/${category}/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete file')
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      }
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get stats')
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        stats: {},
        error: error instanceof Error ? error.message : 'Failed to get stats',
      }
    }
  }

  /**
   * Generate a public file URL
   */
  getFileUrl(category: FileCategory, filename: string): string {
    return `/uploads/${category}/${filename}`
  }

  /**
   * Download a file
   */
  downloadFile(url: string, filename: string): void {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  }
}

export const fileServer = new FileServer()

export default fileServer
