import pool from '../config'

export interface Candidate {
  id: number
  candidate_id: string
  name: string
  passport_number: string | null
  phone_number: string | null
  gender: string | null
  age: number | null
  date_of_birth: string | null
  nationality: string | null
  religion: string | null
  marital_status: string | null
  occupation: string | null
  job_category: string | null
  skill_level: string | null
  education_level: string | null
  language_skills: string | null
  country: string | null
  city: string | null
  current_location: string | null
  resume_url: string | null
  medical_status: string | null
  created_at: Date
  updated_at: Date
}

export async function getAllCandidates(): Promise<Candidate[]> {
  const result = await pool.query('SELECT * FROM candidates ORDER BY created_at DESC')
  return result.rows
}

export async function getCandidateById(candidateId: string): Promise<Candidate | null> {
  const result = await pool.query('SELECT * FROM candidates WHERE candidate_id = $1', [candidateId])
  return result.rows[0] || null
}

export async function searchCandidates(searchTerm: string): Promise<Candidate[]> {
  const term = `%${searchTerm}%`
  const result = await pool.query(
    `SELECT * FROM candidates 
     WHERE name ILIKE $1 
     OR phone_number ILIKE $1 
     OR nationality ILIKE $1 
     OR country ILIKE $1
     ORDER BY created_at DESC`,
    [term]
  )
  return result.rows
}

export async function filterCandidates(filters: Partial<Candidate>): Promise<Candidate[]> {
  const conditions: string[] = []
  const values: any[] = []
  let paramCount = 1

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      conditions.push(`${key} ILIKE $${paramCount}`)
      values.push(`%${value}%`)
      paramCount++
    }
  })

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await pool.query(
    `SELECT * FROM candidates ${whereClause} ORDER BY created_at DESC`,
    values
  )
  return result.rows
}

export async function createCandidate(data: Omit<Candidate, 'id' | 'candidate_id' | 'created_at' | 'updated_at'>): Promise<Candidate> {
  const keys = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined)
  const values = keys.map(k => data[k as keyof typeof data])
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
  const keysStr = keys.join(', ')

  const result = await pool.query(
    `INSERT INTO candidates (${keysStr}) VALUES (${placeholders}) RETURNING *`,
    values
  )
  return result.rows[0]
}

export async function updateCandidate(
  candidateId: string,
  data: Partial<Omit<Candidate, 'id' | 'candidate_id' | 'created_at'>>
): Promise<Candidate> {
  const updates: string[] = []
  const values: any[] = []
  let paramCount = 1

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = $${paramCount}`)
      values.push(value)
      paramCount++
    }
  })

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  values.push(candidateId)

  const result = await pool.query(
    `UPDATE candidates SET ${updates.join(', ')} WHERE candidate_id = $${paramCount} RETURNING *`,
    values
  )
  return result.rows[0]
}

export async function deleteCandidate(candidateId: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM candidates WHERE candidate_id = $1', [candidateId])
  return result.rowCount > 0
}
