import { Router, type Request, type Response } from 'express'
import pool from '../../db/config'

const router = Router()

const statuses = new Set(['draft', 'published', 'archived'])

const toNullableString = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

const toTags = (value: unknown) => {
  if (Array.isArray(value)) return value.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((tag) => tag.trim()).filter(Boolean)
  return []
}

const getBlogValues = (body: Record<string, unknown>) => {
  const titleEn = toNullableString(body.title_en)
  const bodyEn = toNullableString(body.body_en)
  const suppliedSlug = toNullableString(body.slug)
  const slug = suppliedSlug || titleEn?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const status = toNullableString(body.status) || 'draft'

  if (!titleEn || !bodyEn || !slug) {
    throw new Error('Slug, English title, and English body are required')
  }

  if (!statuses.has(status)) {
    throw new Error('Status must be draft, published, or archived')
  }

  const viewCount = Number(body.view_count ?? 0)
  if (!Number.isInteger(viewCount) || viewCount < 0) {
    throw new Error('View count must be a non-negative whole number')
  }

  return [
    slug,
    titleEn,
    toNullableString(body.title_am),
    toNullableString(body.excerpt_en),
    bodyEn,
    toNullableString(body.featured_image),
    toNullableString(body.author_name),
    toNullableString(body.author_avatar),
    toNullableString(body.author_role_en),
    toNullableString(body.author_bio_en),
    toNullableString(body.publish_date),
    toNullableString(body.reading_time),
    toTags(body.tags),
    toNullableString(body.pull_quote_en),
    toNullableString(body.pull_quote_author),
    status,
    toNullableString(body.meta_title),
    toNullableString(body.meta_description),
    toNullableString(body.meta_keywords),
    toNullableString(body.canonical_url),
    toNullableString(body.og_image),
    toNullableString(body.previous_post_slug),
    toNullableString(body.next_post_slug),
    viewCount,
    toNullableString(body.created_by),
  ]
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1)
    const limit = Math.min(100, Number.parseInt(req.query.limit as string, 10) || 10)
    const offset = (page - 1) * limit
    const [countResult, result] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM blogs'),
      pool.query('SELECT * FROM blogs ORDER BY publish_date DESC NULLS LAST, created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
    ])

    res.json({ success: true, data: result.rows, total: Number(countResult.rows[0].count), page, limit })
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch blogs' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM blogs WHERE id = $1 OR slug = $1', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Blog not found' })
    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch blog' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const values = getBlogValues(req.body)
    const result = await pool.query(
      `INSERT INTO blogs (
        slug, title_en, title_am, excerpt_en, body_en, featured_image,
        author_name, author_avatar, author_role_en, author_bio_en, publish_date,
        reading_time, tags, pull_quote_en, pull_quote_author, status, meta_title,
        meta_description, meta_keywords, canonical_url, og_image, previous_post_slug,
        next_post_slug, view_count, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
      ) RETURNING *`,
      values,
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create blog'
    res.status(message.includes('required') || message.includes('Status') || message.includes('View count') ? 400 : 500).json({ success: false, error: message })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const values = getBlogValues(req.body)
    const result = await pool.query(
      `UPDATE blogs SET
        slug = $1, title_en = $2, title_am = $3, excerpt_en = $4, body_en = $5,
        featured_image = $6, author_name = $7, author_avatar = $8, author_role_en = $9,
        author_bio_en = $10, publish_date = $11, reading_time = $12, tags = $13,
        pull_quote_en = $14, pull_quote_author = $15, status = $16, meta_title = $17,
        meta_description = $18, meta_keywords = $19, canonical_url = $20, og_image = $21,
        previous_post_slug = $22, next_post_slug = $23, view_count = $24, created_by = $25,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $26
      RETURNING *`,
      [...values, req.params.id],
    )
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Blog not found' })
    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update blog'
    res.status(message.includes('required') || message.includes('Status') || message.includes('View count') ? 400 : 500).json({ success: false, error: message })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM blogs WHERE id = $1 RETURNING *', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Blog not found' })
    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete blog' })
  }
})

export default router
