import { Router, type Request, type Response } from 'express'

const router = Router()

let pool: any = null

async function initPool() {
  if (!pool) {
    try {
      const poolModule = await import('../../db/config')
      pool = poolModule.default
    } catch (err) {
      console.error('Failed to load db config:', err)
      throw new Error('Database connection not available')
    }
  }
  return pool
}

// GET all contact messages
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const result = await dbPool.query('SELECT * FROM contact_us ORDER BY created_at DESC')
    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('Error fetching contact messages:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact messages',
    })
  }
})

// GET single contact message
router.get('/:contactId', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { contactId } = req.params
    const result = await dbPool.query('SELECT * FROM contact_us WHERE contact_id = $1', [contactId])

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error fetching contact message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact message',
    })
  }
})

// POST create contact message
router.post('/', async (req: Request, res: Response) => {
  const dbPool = await initPool()
  const client = await dbPool.connect()

  try {
    const { name, email, phone, subject, message } = req.body

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, subject, message',
      })
    }

    await client.query('BEGIN')

    const result = await client.query(
      'INSERT INTO contact_us (name, email, phone, subject, message, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, phone || null, subject, message, 'new']
    )
    const newContact = result.rows[0]

    const adminUsers = await client.query(
      'SELECT user_id FROM users WHERE authority = $1 AND is_active = true',
      ['admin']
    )

    for (const admin of adminUsers.rows) {
      await client.query(
        `INSERT INTO notifications (
          user_id, target, description, type, status, location, location_label, image_url,
          related_entity_id, related_entity_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          admin.user_id,
          name,
          `New message from ${name}: "${subject}"`,
          1,
          'new',
          'Contact Messages',
          'Contact Us',
          '/img/icons/contact.png',
          newContact.contact_id,
          'contact_message',
        ],
      )
    }

    await client.query('COMMIT')
    res.status(201).json({ success: true, data: newContact })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creating contact message and notification:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create contact message',
    })
  } finally {
    client.release()
  }
})

// PATCH update contact message status
router.patch('/:contactId', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { contactId } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      })
    }

    const result = await dbPool.query(
      'UPDATE contact_us SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE contact_id = $2 RETURNING *',
      [status, contactId]
    )

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error updating contact message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update contact message',
    })
  }
})

// DELETE contact message
router.delete('/:contactId', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { contactId } = req.params

    const result = await dbPool.query('DELETE FROM contact_us WHERE contact_id = $1 RETURNING *', [contactId])

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error deleting contact message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact message',
    })
  }
})

// POST send reply to contact message
router.post('/:contactId/reply', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { contactId } = req.params
    const { reply } = req.body

    if (!reply) {
      return res.status(400).json({
        success: false,
        error: 'Reply message is required',
      })
    }

    const result = await dbPool.query(
      'UPDATE contact_us SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE contact_id = $2 RETURNING *',
      ['replied', contactId]
    )

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error sending reply:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send reply',
    })
  }
})

export default router
