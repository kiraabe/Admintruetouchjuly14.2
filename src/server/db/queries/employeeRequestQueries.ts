import pool from '../config.ts'

interface EmployeeRequest {
  request_id?: string
  request_type?: 'Standard' | 'Special'
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

export async function getAllEmployeeRequests() {
  const result = await pool.query(`
    SELECT * FROM employee_requests
    ORDER BY created_at DESC
  `)
  return result.rows
}

export async function getEmployeeRequestById(requestId: string) {
  const result = await pool.query(
    `SELECT * FROM employee_requests WHERE request_id = $1`,
    [requestId]
  )
  return result.rows[0]
}

export async function searchEmployeeRequests(searchTerm: string) {
  const term = `%${searchTerm}%`
  const result = await pool.query(
    `SELECT * FROM employee_requests
    WHERE company_name ILIKE $1
    OR contact_person ILIKE $1
    OR email ILIKE $1
    OR position ILIKE $1
    ORDER BY created_at DESC`,
    [term]
  )
  return result.rows
}

export async function filterEmployeeRequests(filters: Record<string, any>) {
  let query = 'SELECT * FROM employee_requests WHERE 1=1'
  const params: any[] = []
  let paramIndex = 1

  if (filters.request_type) {
    query += ` AND request_type = $${paramIndex}`
    params.push(filters.request_type)
    paramIndex++
  }

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

  if (filters.partnership_id) {
    query += ` AND partnership_id = $${paramIndex}`
    params.push(filters.partnership_id)
    paramIndex++
  }

  query += ' ORDER BY created_at DESC'
  const result = await pool.query(query, params)
  return result.rows
}

export async function createEmployeeRequest(data: EmployeeRequest) {
  const {
    request_type = 'Standard',
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
    `INSERT INTO employee_requests
    (request_type, company_name, contact_person, email, phone_number, position, number_of_employees, start_date, location, status, requirements, notes, salary_range, required_skills, work_city, urgency)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *`,
    [request_type, company_name, contact_person, email, phone_number, position, number_of_employees, start_date, location, status, requirements, notes, salary_range, required_skills, work_city, urgency]
  )
  return result.rows[0]
}

export async function updateEmployeeRequest(requestId: string, data: Partial<EmployeeRequest>) {
  const updates: string[] = []
  const params: any[] = []
  let paramIndex = 1

  const fieldsToUpdate = [
    'request_type',
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
    if (field in data && data[field as keyof EmployeeRequest] !== undefined) {
      updates.push(`${field} = $${paramIndex}`)
      params.push(data[field as keyof EmployeeRequest])
      paramIndex++
    }
  }

  if (updates.length === 0) {
    return getEmployeeRequestById(requestId)
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)

  params.push(requestId)

  const result = await pool.query(
    `UPDATE employee_requests
    SET ${updates.join(', ')}
    WHERE request_id = $${paramIndex}
    RETURNING *`,
    params
  )

  return result.rows[0]
}

export async function deleteEmployeeRequest(requestId: string) {
  const result = await pool.query(
    `DELETE FROM employee_requests WHERE request_id = $1 RETURNING *`,
    [requestId]
  )
  return result.rows.length > 0
}
