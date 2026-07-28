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

        // Create dropdown base tables
        await pool.query(`
      CREATE TABLE IF NOT EXISTS gender_options (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
        console.log('✓ Gender options table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS gender_translations (
        id SERIAL PRIMARY KEY,
        gender_id INT REFERENCES gender_options(id) ON DELETE CASCADE,
        locale VARCHAR(10) NOT NULL,
        label VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(gender_id, locale)
      )
    `)
        console.log('✓ Gender translations table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS religion_options (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
        console.log('✓ Religion options table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS religion_translations (
        id SERIAL PRIMARY KEY,
        religion_id INT REFERENCES religion_options(id) ON DELETE CASCADE,
        locale VARCHAR(10) NOT NULL,
        label VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(religion_id, locale)
      )
    `)
        console.log('✓ Religion translations table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS marital_status_options (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
        console.log('✓ Marital status options table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS marital_status_translations (
        id SERIAL PRIMARY KEY,
        marital_status_id INT REFERENCES marital_status_options(id) ON DELETE CASCADE,
        locale VARCHAR(10) NOT NULL,
        label VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(marital_status_id, locale)
      )
    `)
        console.log('✓ Marital status translations table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS job_category_options (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
        console.log('✓ Job category options table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS job_category_translations (
        id SERIAL PRIMARY KEY,
        job_category_id INT REFERENCES job_category_options(id) ON DELETE CASCADE,
        locale VARCHAR(10) NOT NULL,
        label VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_category_id, locale)
      )
    `)
        console.log('✓ Job category translations table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS education_level_options (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
        console.log('✓ Education level options table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS education_level_translations (
        id SERIAL PRIMARY KEY,
        education_level_id INT REFERENCES education_level_options(id) ON DELETE CASCADE,
        locale VARCHAR(10) NOT NULL,
        label VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(education_level_id, locale)
      )
    `)
        console.log('✓ Education level translations table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS medical_status_options (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
        console.log('✓ Medical status options table created')

        await pool.query(`
      CREATE TABLE IF NOT EXISTS medical_status_translations (
        id SERIAL PRIMARY KEY,
        medical_status_id INT REFERENCES medical_status_options(id) ON DELETE CASCADE,
        locale VARCHAR(10) NOT NULL,
        label VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(medical_status_id, locale)
      )
    `)
        console.log('✓ Medical status translations table created')

        // Populate gender options and translations
        await pool.query(`
      INSERT INTO gender_options (slug) VALUES
        ('male'), ('female'), ('other')
      ON CONFLICT (slug) DO NOTHING
    `)
        await pool.query(`
      INSERT INTO gender_translations (gender_id, locale, label)
      SELECT id, 'en',
        CASE slug WHEN 'male' THEN 'Male' WHEN 'female' THEN 'Female' WHEN 'other' THEN 'Other' END
      FROM gender_options
      ON CONFLICT (gender_id, locale) DO NOTHING
    `)
        console.log('✓ Gender options populated')

        // Populate religion options and translations
        await pool.query(`
      INSERT INTO religion_options (slug) VALUES
        ('christianity'), ('islam'), ('hinduism'), ('buddhism'), ('judaism'), ('sikhism'), ('atheism'), ('agnosticism'), ('other')
      ON CONFLICT (slug) DO NOTHING
    `)
        await pool.query(`
      INSERT INTO religion_translations (religion_id, locale, label)
      SELECT id, 'en',
        CASE slug
          WHEN 'christianity' THEN 'Christianity'
          WHEN 'islam' THEN 'Islam'
          WHEN 'hinduism' THEN 'Hinduism'
          WHEN 'buddhism' THEN 'Buddhism'
          WHEN 'judaism' THEN 'Judaism'
          WHEN 'sikhism' THEN 'Sikhism'
          WHEN 'atheism' THEN 'Atheism'
          WHEN 'agnosticism' THEN 'Agnosticism'
          WHEN 'other' THEN 'Other'
        END
      FROM religion_options
      ON CONFLICT (religion_id, locale) DO NOTHING
    `)
        console.log('✓ Religion options populated')

        // Populate marital status options and translations
        await pool.query(`
      INSERT INTO marital_status_options (slug) VALUES
        ('single'), ('married'), ('divorced'), ('widowed')
      ON CONFLICT (slug) DO NOTHING
    `)
        await pool.query(`
      INSERT INTO marital_status_translations (marital_status_id, locale, label)
      SELECT id, 'en',
        CASE slug
          WHEN 'single' THEN 'Single'
          WHEN 'married' THEN 'Married'
          WHEN 'divorced' THEN 'Divorced'
          WHEN 'widowed' THEN 'Widowed'
        END
      FROM marital_status_options
      ON CONFLICT (marital_status_id, locale) DO NOTHING
    `)
        console.log('✓ Marital status options populated')

        // Populate job category options and translations
        await pool.query(`
      INSERT INTO job_category_options (slug) VALUES
        ('housekeepers'), ('cleaners'), ('nannies-and-caregivers'), ('drivers'), ('warehouse-staff'),
        ('retail-store-employees'), ('waiters-waitresses'), ('laundry-services'), ('hotel-security'),
        ('kitchen-helpers'), ('construction-workers'), ('laborers'), ('electricians')
      ON CONFLICT (slug) DO NOTHING
    `)
        await pool.query(`
      INSERT INTO job_category_translations (job_category_id, locale, label)
      SELECT id, 'en',
        CASE slug
          WHEN 'housekeepers' THEN 'Housekeepers'
          WHEN 'cleaners' THEN 'Cleaners'
          WHEN 'nannies-and-caregivers' THEN 'Nannies and caregivers'
          WHEN 'drivers' THEN 'Drivers'
          WHEN 'warehouse-staff' THEN 'Warehouse staff'
          WHEN 'retail-store-employees' THEN 'Retail store employees'
          WHEN 'waiters-waitresses' THEN 'Waiters/waitresses'
          WHEN 'laundry-services' THEN 'Laundry services'
          WHEN 'hotel-security' THEN '5-star hotel security'
          WHEN 'kitchen-helpers' THEN 'Kitchen helpers'
          WHEN 'construction-workers' THEN 'Construction workers'
          WHEN 'laborers' THEN 'Laborers'
          WHEN 'electricians' THEN 'Electricians'
        END
      FROM job_category_options
      ON CONFLICT (job_category_id, locale) DO NOTHING
    `)
        console.log('✓ Job category options populated')

        // Populate education level options and translations
        await pool.query(`
      INSERT INTO education_level_options (slug) VALUES
        ('primary'), ('secondary'), ('diploma'), ('bachelor'), ('master'), ('phd')
      ON CONFLICT (slug) DO NOTHING
    `)
        await pool.query(`
      INSERT INTO education_level_translations (education_level_id, locale, label)
      SELECT id, 'en',
        CASE slug
          WHEN 'primary' THEN 'Primary'
          WHEN 'secondary' THEN 'Secondary'
          WHEN 'diploma' THEN 'Diploma'
          WHEN 'bachelor' THEN 'Bachelor'
          WHEN 'master' THEN 'Master'
          WHEN 'phd' THEN 'PhD'
        END
      FROM education_level_options
      ON CONFLICT (education_level_id, locale) DO NOTHING
    `)
        console.log('✓ Education level options populated')

        // Populate medical status options and translations
        await pool.query(`
      INSERT INTO medical_status_options (slug) VALUES
        ('fit'), ('fit-with-restrictions'), ('unfit'), ('under-review'), ('not-assessed')
      ON CONFLICT (slug) DO NOTHING
    `)
        await pool.query(`
      INSERT INTO medical_status_translations (medical_status_id, locale, label)
      SELECT id, 'en',
        CASE slug
          WHEN 'fit' THEN 'Fit'
          WHEN 'fit-with-restrictions' THEN 'Fit with restrictions'
          WHEN 'unfit' THEN 'Unfit'
          WHEN 'under-review' THEN 'Under review'
          WHEN 'not-assessed' THEN 'Not assessed'
        END
      FROM medical_status_options
      ON CONFLICT (medical_status_id, locale) DO NOTHING
    `)
        console.log('✓ Medical status options populated')

        console.log('Migrations completed successfully')
        process.exit(0)
    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

runMigrations()
