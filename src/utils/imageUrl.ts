export function getCandidateProfilePictureUrl(candidateId: string | null | undefined, filename: string | null | undefined): string {
  if (!candidateId || !filename) return '/img/placeholder-avatar.png'

  // If it's already an absolute URL, return as-is
  if (filename.startsWith('http')) {
    return filename
  }

  // Serve directly from filesystem like job images
  if (filename.startsWith('/uploads')) return filename
  if (filename.startsWith('/')) return filename

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
