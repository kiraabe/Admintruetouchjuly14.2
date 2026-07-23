import { Router, type Request, type Response } from 'express'
import { validateAdminSession } from '../../middleware/partnershipAuth'
import pool from '../../db/config'

const router = Router()
const statuses = new Set(['active', 'inactive'])

const text = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value.trim() : null

const getValues = (body: Record<string, unknown>) => {
    const clientName = text(body.client_name)
    const companyName = text(body.company_name)
    const designation = text(body.designation)
    const testimonialText = text(body.testimonial_text)
    const status = text(body.status) || 'active'
    const rating = Number(body.rating)
    const displayOrder = Number(body.display_order ?? 0)

    if (!clientName || !companyName || !designation || !testimonialText) {
        throw new Error(
            'Client name, company name, designation, and testimonial text are required',
        )
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error('Rating must be a whole number between 1 and 5')
    }
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
        throw new Error('Display order must be a non-negative whole number')
    }
    if (!statuses.has(status)) {
        throw new Error('Status must be active or inactive')
    }

    return [
        clientName,
        companyName,
        designation,
        text(body.avatar_image),
        rating,
        testimonialText,
        status,
        displayOrder,
    ]
}

router.get('/', validateAdminSession, async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1)
        const limit = Math.min(100, Number.parseInt(req.query.limit as string, 10) || 10)
        const offset = (page - 1) * limit
        const [countResult, result] = await Promise.all([
            pool.query('SELECT COUNT(*) AS count FROM testimonials'),
            pool.query(
                'SELECT * FROM testimonials ORDER BY display_order ASC, created_at DESC LIMIT $1 OFFSET $2',
                [limit, offset],
            ),
        ])
        res.json({
            success: true,
            data: result.rows,
            total: Number(countResult.rows[0].count),
            page,
            limit,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch testimonials',
        })
    }
})

router.post('/', validateAdminSession, async (req: Request, res: Response) => {
    try {
        const values = getValues(req.body)
        const result = await pool.query(
            `INSERT INTO testimonials
        (client_name, company_name, designation, avatar_image, rating, testimonial_text, status, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
            values,
        )
        res.status(201).json({ success: true, data: result.rows[0] })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create testimonial'
        res.status(message.includes('required') || message.includes('Rating') || message.includes('Display order') || message.includes('Status') ? 400 : 500).json({ success: false, error: message })
    }
})

router.put('/:id', validateAdminSession, async (req: Request, res: Response) => {
    try {
        const values = getValues(req.body)
        const result = await pool.query(
            `UPDATE testimonials SET
        client_name = $1, company_name = $2, designation = $3, avatar_image = $4,
        rating = $5, testimonial_text = $6, status = $7, display_order = $8,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *`,
            [...values, req.params.id],
        )
        if (!result.rows[0]) {
            return res.status(404).json({ success: false, error: 'Testimonial not found' })
        }
        res.json({ success: true, data: result.rows[0] })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update testimonial'
        res.status(message.includes('required') || message.includes('Rating') || message.includes('Display order') || message.includes('Status') ? 400 : 500).json({ success: false, error: message })
    }
})

router.delete('/:id', validateAdminSession, async (req: Request, res: Response) => {
    try {
        const result = await pool.query('DELETE FROM testimonials WHERE id = $1 RETURNING *', [req.params.id])
        if (!result.rows[0]) {
            return res.status(404).json({ success: false, error: 'Testimonial not found' })
        }
        res.json({ success: true, data: result.rows[0] })
    } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete testimonial' })
    }
})

export default router
