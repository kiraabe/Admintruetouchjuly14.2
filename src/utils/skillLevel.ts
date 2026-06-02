export function parseSkillLevel(value: string | null | undefined): string {
  if (!value) return '-'

  try {
    let text = String(value).trim()
    if (!text || text === '-') return '-'

    // Unescape JSON-encoded strings
    let attempt = text
    let maxDepth = 10
    while (maxDepth-- > 0) {
      try {
        const parsed = JSON.parse(attempt)
        if (typeof parsed === 'string') {
          attempt = parsed
        } else if (Array.isArray(parsed)) {
          attempt = parsed.flat().filter(Boolean).join(', ')
          break
        } else {
          break
        }
      } catch {
        break
      }
    }

    // Unescape any remaining escaped characters
    if (attempt.includes('\\')) {
      attempt = attempt
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"')
        .replace(/\\\//g, '/')
    }

    // Remove JSON-like syntax and leftover brackets/backslashes
    attempt = attempt
      .replace(/[{}\[\]":\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Split by comma and get unique, non-empty skills
    const skills = attempt
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    const uniqueSkills = Array.from(new Set(skills)).filter(s => {
      if (s.length < 3) return false
      const isFragment = skills.some(other => other.length > s.length && other.toLowerCase().startsWith(s.toLowerCase()))
      if (isFragment) return false
      return true
    })

    return uniqueSkills.length > 0 ? uniqueSkills.join(', ') : '-'
  } catch {
    return '-'
  }
}
