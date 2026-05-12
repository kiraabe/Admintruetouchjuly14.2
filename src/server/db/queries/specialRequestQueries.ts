import pool from '../config.ts'

interface SpecialRequest {
  request_id?: string
  company_name: string
  contact_person: string
  email: string
  phone_number?: string | null
  position: string
  number_of_employees: number
  start_date?: string | null
  location?: string | null
  status?: string
  requirements?: string | null
  notes?: string | null
  salary_range?: string | null
  required_skills?: string | null
  work_city?: string | null
  urgency?: string | null
}

export async function ensureSpecialRequestTableExists() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS special_requests (
        id SERIAL PRIMARY KEY,
        request_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        position VARCHAR(255) NOT NULL,
        number_of_employees INT NOT NULL,
        start_date DATE,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pending',
        requirements TEXT,
        notes TEXT,
        salary_range VARCHAR(255),
        required_skills TEXT,
        work_city VARCHAR(255),
        urgency VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (error) {
    console.error('Failed to ensure special_requests table exists:', error)
  }
}

export async function getAllSpecialRequests() {
  const result = await pool.query(`
    SELECT * FROM special_requests
    ORDER BY created_at DESC
  `)
  return result.rows
}

export async function getSpecialRequestById(requestId: string) {
  const result = await pool.query(
    `SELECT * FROM special_requests WHERE request_id = $1`,
    [requestId]
  )
  return result.rows[0]
}

export async function searchSpecialRequests(searchTerm: string) {
  const term = `%${searchTerm}%`
  const result = await pool.query(
    `SELECT * FROM special_requests
    WHERE company_name ILIKE $1
    OR contact_person ILIKE $1
    OR email ILIKE $1
    OR position ILIKE $1
    ORDER BY created_at DESC`,
    [term]
  )
  return result.rows
}

export async function filterSpecialRequests(filters: Record<string, any>) {
  let query = 'SELECT * FROM special_requests WHERE 1=1'
  const params: any[] = []
  let paramIndex = 1

  if (filters.status) {
    query += ` AND status = $${paramIndex}`
    params.push(filters.status)
    paramIndex++
  }

  if (filters.position) {
    query += ` AND position ILIKE $${paramIndex}`
    params.push(`%${filters.position}%`)
    paramIndex++
  }

  if (filters.location) {
    query += ` AND location ILIKE $${paramIndex}`
    params.push(`%${filters.location}%`)
    paramIndex++
  }

  if (filters.company_name) {
    query += ` AND company_name ILIKE $${paramIndex}`
    params.push(`%${filters.company_name}%`)
    paramIndex++
  }

  query += ' ORDER BY created_at DESC'
  const result = await pool.query(query, params)
  return result.rows
}

export async function createSpecialRequest(data: SpecialRequest) {
  const {
    company_name,
    contact_person,
    email,
    phone_number,
    position,
    number_of_employees,
    start_date,
    location,
    status = 'Pending',
    requirements,
    notes,
    salary_range,
    required_skills,
    work_city,
    urgency,
  } = data

  if (!company_name || !contact_person || !email || !position || !number_of_employees) {
    throw new Error('Missing required fields: company_name, contact_person, email, position, number_of_employees')
  }

  const result = await pool.query(
    `INSERT INTO special_requests
    (company_name, contact_person, email, phone_number, position, number_of_employees, start_date, location, status, requirements, notes, salary_range, required_skills, work_city, urgency)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [company_name, contact_person, email, phone_number, position, number_of_employees, start_date, location, status, requirements, notes, salary_range, required_skills, work_city, urgency]
  )
  return result.rows[0]
}

export async function updateSpecialRequest(requestId: string, data: Partial<SpecialRequest>) {
  const updates: string[] = []
  const params: any[] = []
  let paramIndex = 1

  const fieldsToUpdate = [
    'company_name',
    'contact_person',
    'email',
    'phone_number',
    'position',
    'number_of_employees',
    'start_date',
    'location',
    'status',
    'requirements',
    'notes',
    'salary_range',
    'required_skills',
    'work_city',
    'urgency',
  ]

  for (const field of fieldsToUpdate) {
    if (field in data && data[field as keyof SpecialRequest] !== undefined) {
      updates.push(`${field} = $${paramIndex}`)
      params.push(data[field as keyof SpecialRequest])
      paramIndex++
    }
  }

  if (updates.length === 0) {
    return getSpecialRequestById(requestId)
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  params.push(requestId)

  const result = await pool.query(
    `UPDATE special_requests
    SET ${updates.join(', ')}
    WHERE request_id = $${paramIndex}
    RETURNING *`,
    params
  )

  return result.rows[0]
}

export async function deleteSpecialRequest(requestId: string) {
  const result = await pool.query(
    `DELETE FROM special_requests WHERE request_id = $1 RETURNING *`,
    [requestId]
  )
  return result.rows.length > 0
}
