import pool from '../config.ts'

export const getContactMessages = async () => {
  const result = await pool.query('SELECT * FROM contact_us ORDER BY created_at DESC')
  return result.rows
}

export const getContactMessageById = async (contactId: string) => {
  const result = await pool.query('SELECT * FROM contact_us WHERE contact_id = $1', [contactId])
  return result.rows[0]
}

export const createContactMessage = async (name: string, email: string, subject: string, message: string, phone?: string) => {
  const result = await pool.query(
    'INSERT INTO contact_us (name, email, phone, subject, message, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, email, phone || null, subject, message, 'new']
  )
  return result.rows[0]
}

export const updateContactStatus = async (contactId: string, status: string) => {
  const result = await pool.query(
    'UPDATE contact_us SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE contact_id = $2 RETURNING *',
    [status, contactId]
  )
  return result.rows[0]
}

export const deleteContactMessage = async (contactId: string) => {
  const result = await pool.query('DELETE FROM contact_us WHERE contact_id = $1 RETURNING *', [contactId])
  return result.rows[0]
}
