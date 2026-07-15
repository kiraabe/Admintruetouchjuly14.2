import 'dotenv/config'
import pool from './config'

async function runMigrations() {
    try {
        console.log('Running migrations...')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_name VARCHAR(255),
        avatar VARCHAR(255),
        authority VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        partnership_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

        console.log('✓ Users table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

        console.log('✓ Reset tokens table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        candidate_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        passport_number VARCHAR(255),
        phone_number VARCHAR(20),
        password_hash VARCHAR(255),
        profile_picture VARCHAR(255),
        gender VARCHAR(50),
        age INT,
        date_of_birth DATE,
        nationality VARCHAR(255),
        religion VARCHAR(255),
        marital_status VARCHAR(50),
        job_category VARCHAR(255),
        skill_level TEXT,
        education_level VARCHAR(255),
        language_skills TEXT,
        country VARCHAR(255),
        preferred_work_country VARCHAR(255),
        city VARCHAR(255),
        current_location VARCHAR(255),
        resume_url VARCHAR(255),
        medical_status VARCHAR(255),
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

        console.log('✓ Candidates table created')

        await pool.query(
            `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS preferred_work_country VARCHAR(255)`,
        )

        // Alter candidates table to increase skill_level to TEXT to support multiple skills
        try {
            await pool.query(`
        ALTER TABLE candidates
        ALTER COLUMN skill_level TYPE TEXT
      `)
            console.log('✓ Updated skill_level column to TEXT')
        } catch (alterError) {
            console.log(
                'Note: Candidates table skill_level may already be TEXT:',
                alterError instanceof Error ? alterError.message : alterError,
            )
        }

        await pool.query(`
      CREATE TABLE IF NOT EXISTS partnerships (
        id SERIAL PRIMARY KEY,
        partner_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        company_logo VARCHAR(255),
        business_email VARCHAR(255) UNIQUE NOT NULL,
        business_category VARCHAR(100) NOT NULL,
        license_number VARCHAR(255) NOT NULL,
        license_document VARCHAR(255),
        contact_person_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        service_city VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

        // Add foreign key constraint from users to partnerships if it doesn't exist
        try {
            const constraintCheck = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'users' AND constraint_name = 'fk_users_partnership_id'
      `)

            if (constraintCheck.rows.length === 0) {
                await pool.query(`
          ALTER TABLE users
          ADD CONSTRAINT fk_users_partnership_id
          FOREIGN KEY (partnership_id) REFERENCES partnerships(partner_id) ON DELETE CASCADE
        `)
                console.log(
                    '✓ Foreign key constraint added from users to partnerships',
                )
            }
        } catch (fkError) {
            console.log(
                'Foreign key constraint may already exist or error:',
                fkError instanceof Error ? fkError.message : fkError,
            )
        }

        console.log('✓ Partnerships table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        notification_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        user_id UUID,
        target VARCHAR(255) NOT NULL,
        description TEXT,
        type INT DEFAULT 1,
        status VARCHAR(50) DEFAULT 'Pending',
        location VARCHAR(255),
        location_label VARCHAR(255),
        image_url VARCHAR(255),
        readed BOOLEAN DEFAULT false,
        related_entity_id UUID,
        related_entity_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

        console.log('✓ Notifications table created')

        // Create indexes for notifications table
        try {
            await pool.query(
                `CREATE INDEX IF NOT EXISTS idx_notifications_readed ON notifications(readed)`,
            )
            await pool.query(
                `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`,
            )
            console.log('✓ Notification indexes created')
        } catch (indexError) {
            console.log('Note: Notification indexes may already exist')
        }

        await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_us (
        id SERIAL PRIMARY KEY,
        contact_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

        console.log('✓ Contact Us table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(255) UNIQUE NOT NULL,
        title_en TEXT NOT NULL,
        title_am TEXT,
        excerpt_en TEXT,
        body_en TEXT NOT NULL,
        featured_image TEXT,
        author_name VARCHAR(255),
        author_avatar TEXT,
        author_role_en VARCHAR(255),
        author_bio_en TEXT,
        publish_date TIMESTAMP,
        reading_time VARCHAR(100),
        tags TEXT[] DEFAULT '{}',
        pull_quote_en TEXT,
        pull_quote_author VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        previous_post_slug VARCHAR(255),
        next_post_slug VARCHAR(255),
        view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
        created_by UUID,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
        await pool.query(
            'ALTER TABLE blogs DROP COLUMN IF EXISTS meta_title, DROP COLUMN IF EXISTS meta_description, DROP COLUMN IF EXISTS meta_keywords, DROP COLUMN IF EXISTS canonical_url, DROP COLUMN IF EXISTS og_image',
        )
        await pool.query(
            'CREATE INDEX IF NOT EXISTS idx_blogs_status_publish_date ON blogs(status, publish_date DESC)',
        )
        console.log('✓ Blogs table created')

        console.log('Migrations completed successfully')
        process.exit(0)
    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

runMigrations()
