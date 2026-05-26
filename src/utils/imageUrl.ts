export function getCandidateProfilePictureUrl(filename: string | null | undefined): string {
  if (!filename) return '/img/placeholder-avatar.png'
  
  // If it's already an absolute URL or full path, return as-is
  if (filename.startsWith('http') || filename.startsWith('/uploads')) {
    return filename
  }
  
  // Otherwise, it's just a filename - construct the full path
  return `/uploads/candidates/profile_pictures/${filename}`
}

export function getCandidateCVUrl(filename: string | null | undefined): string {
  if (!filename) return ''
  
  if (filename.startsWith('http') || filename.startsWith('/uploads')) {
    return filename
  }
  
  return `/uploads/candidates/cvs/${filename}`
}

export function getJobImageUrl(filename: string | null | undefined): string {
  if (!filename) return ''
  
  if (filename.startsWith('http') || filename.startsWith('/uploads')) {
    return filename
  }
  
  return `/uploads/jobs/${filename}`
}
