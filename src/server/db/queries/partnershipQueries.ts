import pool from '../config.ts'
import { randomUUID } from 'crypto'

export interface Partnership {
  id: number
  partner_id: string
  company_name: string
  company_logo: string | null
  business_email: string
  business_category: string
  license_number: string
  license_document: string | null
  contact_person_name: string
  phone_number: string
  service_city: string
  status: string
  created_at: Date
  updated_at: Date
}

export async function getAllPartnerships(): Promise<Partnership[]> {
  try {
    console.log('getAllPartnerships: Starting query')
    const result = await pool.query('SELECT * FROM partnerships ORDER BY created_at DESC')
    console.log('getAllPartnerships: Got', result.rows.length, 'rows')
    return result.rows
  } catch (error) {
    console.error('getAllPartnerships error:', error)
    throw error
  }
}

export async function getPartnershipById(partnerId: string): Promise<Partnership | null> {
  const result = await pool.query('SELECT * FROM partnerships WHERE partner_id = $1', [partnerId])
  return result.rows[0] || null
}

export async function searchPartnerships(searchTerm: string): Promise<Partnership[]> {
  const term = `%${searchTerm}%`
  const result = await pool.query(
    `SELECT * FROM partnerships 
     WHERE company_name ILIKE $1 
     OR business_email ILIKE $1 
     OR service_city ILIKE $1`,
    [term],
  )
  return result.rows
}

export async function filterPartnerships(filters: Record<string, any>): Promise<Partnership[]> {
  const conditions: string[] = []
  const values: any[] = []
  let paramCount = 1

  if (filters.status) {
    conditions.push(`status = $${paramCount}`)
    values.push(filters.status)
    paramCount++
  }

  if (filters.business_category) {
    conditions.push(`business_category = $${paramCount}`)
    values.push(filters.business_category)
    paramCount++
  }

  if (filters.service_city) {
    conditions.push(`service_city = $${paramCount}`)
    values.push(filters.service_city)
    paramCount++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await pool.query(
    `SELECT * FROM partnerships ${whereClause} ORDER BY created_at DESC`,
    values,
  )
  return result.rows
}

export async function createPartnership(data: Partial<Partnership>): Promise<Partnership> {
  const keys = Object.keys(data).filter((k) => k !== 'id' && k !== 'partner_id')
  const partnerId = randomUUID()

  // Add partner_id to the beginning
  const allKeys = ['partner_id', ...keys]
  const allValues = [partnerId, ...keys.map((k) => data[k as keyof Partnership])]

  const keysStr = allKeys.join(', ')
  const placeholders = allKeys.map((_, i) => `$${i + 1}`).join(', ')

  const query = `INSERT INTO partnerships (${keysStr}) VALUES (${placeholders}) RETURNING *`
  console.log('createPartnership - Query:', query)
  console.log('createPartnership - Values:', allValues)

  try {
    const result = await pool.query(query, allValues)
    console.log('createPartnership - Success:', result.rows[0])
    return result.rows[0]
  } catch (error) {
    console.error('createPartnership - Query error:', error)
    throw error
  }
}

export async function updatePartnership(
  partnerId: string,
  data: Partial<Partnership>,
): Promise<Partnership | null> {
  const keys = Object.keys(data).filter((k) => k !== 'id' && k !== 'partner_id')
  if (keys.length === 0) return getPartnershipById(partnerId)

  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
  const values = [...keys.map((k) => data[k as keyof Partnership]), partnerId]

  const result = await pool.query(
    `UPDATE partnerships SET ${setClause}, updated_at = NOW() WHERE partner_id = $${keys.length + 1} RETURNING *`,
    values,
  )
  return result.rows[0] || null
}

export async function deletePartnership(partnerId: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM partnerships WHERE partner_id = $1', [partnerId])
  return result.rowCount > 0
}
