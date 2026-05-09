import 'dotenv/config'
import pool from './config.ts'

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
        occupation VARCHAR(255),
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

    console.log('✓ Partnerships table created')

    console.log('Migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()
