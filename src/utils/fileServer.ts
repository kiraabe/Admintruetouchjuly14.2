export interface UploadResponse {
  filename: string
  path: string
  url: string
}

export async function uploadCandidateProfilePicture(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload/candidate/profile_picture', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload profile picture')
  }

  return response.json()
}

export async function uploadCandidateCV(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload/candidate/cv', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload CV')
  }

  return response.json()
}

export async function uploadJobImage(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload/job/image', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload job image')
  }

  return response.json()
}

export async function getProfilePictures(): Promise<UploadResponse[]> {
  const response = await fetch('/api/upload/candidates/profile_pictures')
  if (!response.ok) throw new Error('Failed to fetch profile pictures')
  return response.json()
}

export async function getCVs(): Promise<UploadResponse[]> {
  const response = await fetch('/api/upload/candidates/cvs')
  if (!response.ok) throw new Error('Failed to fetch CVs')
  return response.json()
}

export async function getJobImages(): Promise<UploadResponse[]> {
  const response = await fetch('/api/upload/jobs')
  if (!response.ok) throw new Error('Failed to fetch job images')
  return response.json()
}
