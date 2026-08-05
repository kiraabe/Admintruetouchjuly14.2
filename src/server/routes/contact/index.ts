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
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { id } = req.params
    const result = await dbPool.query('SELECT * FROM contact_us WHERE id = $1', [id])

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
// NOTE: this previously inserted into columns that don't exist on the real
// table (`name`, `status`, `contact_id`) — the actual schema uses `id` and
// `username`, and has no `status` column until the accompanying migration
// (add_status_to_contact_us.sql) is run. That mismatch is why the insert
// was failing outright, which is also why no notification was ever created:
// execution never got past the broken INSERT.
//
// The notification step also stays decoupled from the contact_us insert:
// if notifying admins fails for any reason, it's logged but never rolls
// back or fails the contact submission that already succeeded.
router.post('/', async (req: Request, res: Response) => {
  const dbPool = await initPool()

  const { name, username, email, phone, subject, message } = req.body
  const contactUsername = username || name // accept either field name from the frontend

  if (!contactUsername || !email || !phone || !subject || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: username, email, phone, subject, message',
    })
  }

  let newContact

  try {
    const result = await dbPool.query(
      'INSERT INTO contact_us (username, email, phone, subject, message, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [contactUsername, email, phone, subject, message, 'new']
    )
    newContact = result.rows[0]
  } catch (error) {
    console.error('Error creating contact message:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to create contact message',
    })
  }

  // Best-effort: notify admins only. Failures here are logged but never
  // affect the response — the contact message above is already saved.
  try {
    const notifyResult = await dbPool.query(
      `INSERT INTO notifications (
        user_id, target, description, type, status, location, location_label, image_url,
        related_entity_id, related_entity_type
      )
      SELECT user_id, $1, $2, $3, $4, $5, $6, $7, $8, $9
      FROM users
      WHERE LOWER(TRIM(authority)) = 'admin' AND is_active = true
      RETURNING notification_id, user_id`,
      [
        contactUsername,
        `New message from ${contactUsername}: "${subject}"`,
        1,
        'new',
        'Contact Messages',
        'Contact Us',
        '/img/icons/contact.png',
        newContact.id,
        'contact_message',
      ],
    )

    if (notifyResult.rowCount === 0) {
      console.warn(
        'Contact message created but no admin notifications were inserted — ' +
        'no user matched authority = \'admin\' AND is_active = true.'
      )
    } else {
      console.log(
        `Created ${notifyResult.rowCount} admin notification(s) for contact #${newContact.id}:`,
        notifyResult.rows.map((r: any) => r.user_id),
      )
    }
  } catch (notifyError) {
    console.error('Error creating admin notification for contact message:', notifyError)
  }

  res.status(201).json({ success: true, data: newContact })
})

// PATCH update contact message status
// Requires the `status` column added by add_status_to_contact_us.sql
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      })
    }

    const result = await dbPool.query(
      'UPDATE contact_us SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
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
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { id } = req.params

    const result = await dbPool.query('DELETE FROM contact_us WHERE id = $1 RETURNING *', [id])

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
// Requires the `status` column added by add_status_to_contact_us.sql
router.post('/:id/reply', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { id } = req.params
    const { reply } = req.body

    if (!reply) {
      return res.status(400).json({
        success: false,
        error: 'Reply message is required',
      })
    }

    const result = await dbPool.query(
      'UPDATE contact_us SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['replied', id]
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