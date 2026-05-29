import pool from '../config'

interface StandardRequest {
  request_id?: string
  partnership_id: string
  company_name: string
  contact_person: string
  email: string
  phone_number?: string | null
  position: string
  number_of_employees: number
  start_date?: string | null
  location?: string | null
  request_type?: string
  status?: string
  requirements?: string | null
  notes?: string | null
  salary_range?: string | null
  required_skills?: string | null
  work_city?: string | null
  urgency?: string | null
}

export async function ensureStandardRequestTableExists() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS standard_requests (
        id SERIAL PRIMARY KEY,
        request_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        partnership_id UUID NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        position VARCHAR(255) NOT NULL,
        number_of_employees INT NOT NULL,
        start_date DATE,
        location VARCHAR(255),
        request_type VARCHAR(50) DEFAULT 'Standard',
        status VARCHAR(50) DEFAULT 'Pending',
        requirements TEXT,
        notes TEXT,
        salary_range VARCHAR(255),
        required_skills TEXT,
        work_city VARCHAR(255),
        urgency VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (partnership_id) REFERENCES partnerships(partner_id) ON DELETE CASCADE
      )
    `)

    // Add request_type column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE standard_requests
        ADD COLUMN IF NOT EXISTS request_type VARCHAR(50) DEFAULT 'Standard'
      `)
      console.log('request_type column added/verified')
    } catch (altErr) {
      console.log('request_type column operation:', altErr)
    }

    // Update existing rows without request_type to have 'Standard'
    try {
      const updateResult = await pool.query(`
        UPDATE standard_requests SET request_type = 'Standard' WHERE request_type IS NULL
      `)
      console.log('Updated rows with null request_type:', updateResult.rowCount)
    } catch (updateErr) {
      console.log('Update request_type error:', updateErr)
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS standard_request_candidates (
        id SERIAL PRIMARY KEY,
        request_id UUID NOT NULL REFERENCES standard_requests(request_id) ON DELETE CASCADE,
        candidate_id UUID NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(request_id, candidate_id)
      )
    `)
  } catch (error) {
    console.error('Failed to ensure standard request tables exist:', error)
  }
}

export async function getAllStandardRequests() {
  const result = await pool.query(`
    SELECT sr.*, p.company_logo
    FROM standard_requests sr
    LEFT JOIN partnerships p ON sr.partnership_id = p.partner_id
    ORDER BY sr.created_at DESC
  `)
  return result.rows
}

export async function getStandardRequestById(requestId: string) {
  const result = await pool.query(
    `SELECT * FROM standard_requests WHERE request_id = $1`,
    [requestId]
  )
  return result.rows[0]
}

export async function getStandardRequestsByPartnership(partnerId: string) {
  const result = await pool.query(
    `SELECT * FROM standard_requests WHERE partnership_id = $1 ORDER BY created_at DESC`,
    [partnerId]
  )
  return result.rows
}

export async function searchStandardRequests(searchTerm: string) {
  const term = `%${searchTerm}%`
  const result = await pool.query(
    `SELECT * FROM standard_requests
    WHERE company_name ILIKE $1
    OR contact_person ILIKE $1
    OR email ILIKE $1
    OR position ILIKE $1
    ORDER BY created_at DESC`,
    [term]
  )
  return result.rows
}

export async function filterStandardRequests(filters: Record<string, any>) {
  let query = 'SELECT * FROM standard_requests WHERE 1=1'
  const params: any[] = []
  let paramIndex = 1

  if (filters.status) {
    query += ` AND status = $${paramIndex}`
    params.push(filters.status)
    paramIndex++
  }

  if (filters.partnership_id) {
    query += ` AND partnership_id = $${paramIndex}`
    params.push(filters.partnership_id)
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

export async function createStandardRequest(data: StandardRequest, candidateIds: string[] = []) {
  const {
    partnership_id,
    company_name,
    contact_person,
    email,
    phone_number,
    position,
    number_of_employees,
    start_date,
    location,
    request_type = 'Standard',
    status = 'Pending',
    requirements,
    notes,
    salary_range,
    required_skills,
    work_city,
    urgency,
  } = data

  if (!partnership_id || !company_name || !contact_person || !email || !position || !number_of_employees) {
    throw new Error('Missing required fields: partnership_id, company_name, contact_person, email, position, number_of_employees')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const result = await client.query(
      `INSERT INTO standard_requests
      (partnership_id, company_name, contact_person, email, phone_number, position, number_of_employees, start_date, location, request_type, status, requirements, notes, salary_range, required_skills, work_city, urgency)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [partnership_id, company_name, contact_person, email, phone_number, position, number_of_employees, start_date, location, request_type, status, requirements, notes, salary_range, required_skills, work_city, urgency]
    )

    const request = result.rows[0]

    if (candidateIds && candidateIds.length > 0) {
      for (const candidateId of candidateIds) {
        await client.query(
          `INSERT INTO standard_request_candidates (request_id, candidate_id)
           VALUES ($1, $2)`,
          [request.request_id, candidateId]
        )
      }
    }

    await client.query('COMMIT')
    return request
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getStandardRequestWithCandidates(requestId: string) {
  const requestResult = await pool.query(
    `SELECT * FROM standard_requests WHERE request_id = $1`,
    [requestId]
  )

  if (requestResult.rows.length === 0) {
    return null
  }

  const request = requestResult.rows[0]

  const candidatesResult = await pool.query(
    `SELECT c.* FROM candidates c
     INNER JOIN standard_request_candidates src ON c.candidate_id = src.candidate_id
     WHERE src.request_id = $1`,
    [requestId]
  )

  return {
    ...request,
    candidates: candidatesResult.rows,
  }
}

export async function updateStandardRequest(requestId: string, data: Partial<StandardRequest>) {
  const updates: string[] = []
  const params: any[] = []
  let paramIndex = 1

  const fieldsToUpdate = [
    'partnership_id',
    'company_name',
    'contact_person',
    'email',
    'phone_number',
    'position',
    'number_of_employees',
    'start_date',
    'location',
    'request_type',
    'status',
    'requirements',
    'notes',
    'salary_range',
    'required_skills',
    'work_city',
    'urgency',
  ]

  for (const field of fieldsToUpdate) {
    if (field in data && data[field as keyof StandardRequest] !== undefined) {
      updates.push(`${field} = $${paramIndex}`)
      params.push(data[field as keyof StandardRequest])
      paramIndex++
    }
  }

  if (updates.length === 0) {
    return getStandardRequestById(requestId)
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  params.push(requestId)

  const result = await pool.query(
    `UPDATE standard_requests
    SET ${updates.join(', ')}
    WHERE request_id = $${paramIndex}
    RETURNING *`,
    params
  )

  return result.rows[0]
}

export async function deleteStandardRequest(requestId: string) {
  const result = await pool.query(
    `DELETE FROM standard_requests WHERE request_id = $1 RETURNING *`,
    [requestId]
  )
  return result.rows.length > 0
}
