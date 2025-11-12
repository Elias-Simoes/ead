/**
 * Script to create the default admin user
 * Run with: node scripts/create-admin.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/plataforma_ead',
});

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('Creating admin user...');
    
    // Check if admin already exists
    const checkResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@plataforma-ead.com']
    );
    
    if (checkResult.rows.length > 0) {
      console.log('✓ Admin user already exists');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    // Create admin user
    const result = await client.query(
      `INSERT INTO users (email, name, password_hash, role, email_verified, gdpr_consent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, role`,
      [
        'admin@plataforma-ead.com',
        'Administrator',
        hashedPassword,
        'admin',
        true,
        true
      ]
    );
    
    console.log('✓ Admin user created successfully');
    console.log('  Email:', result.rows[0].email);
    console.log('  Name:', result.rows[0].name);
    console.log('  Role:', result.rows[0].role);
    console.log('  Password: Admin@123');
    console.log('\n⚠️  IMPORTANT: Change this password in production!');
    
  } catch (error) {
    console.error('✗ Error creating admin user:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin()
  .then(() => {
    console.log('\nAdmin user setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFailed to create admin user:', error);
    process.exit(1);
  });
