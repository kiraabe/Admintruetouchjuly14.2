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
        skill_level VARCHAR(100),
        education_level VARCHAR(100),
        language_skills TEXT,
        country VARCHAR(255),
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
        console.log('✓ Foreign key constraint added from users to partnerships')
      }
    } catch (fkError) {
      console.log('Foreign key constraint may already exist or error:', fkError instanceof Error ? fkError.message : fkError)
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
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_readed ON notifications(readed)`)
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`)
      console.log('✓ Notification indexes created')
    } catch (indexError) {
      console.log('Note: Notification indexes may already exist')
    }


    // Add image_data column to jobs if it doesn't exist
    try {
      const jobsTableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'jobs'
        )
      `)
      if (jobsTableCheck.rows[0].exists) {
        const checkColumn = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'jobs' AND column_name = 'image_data'
          )
        `)
        if (!checkColumn.rows[0].exists) {
          await pool.query(`ALTER TABLE jobs ADD COLUMN image_data BYTEA`)
          console.log('✓ Added image_data column to jobs table')
        }
      }
    } catch (err) {
      console.log('Note: image_data column check/creation:', err instanceof Error ? err.message : err)
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

    console.log('Migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()
