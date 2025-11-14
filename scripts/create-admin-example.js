const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createAdmin() {
  try {
    console.log('Creating admin@example.com user...');
    
    // Check if admin already exists
    const checkResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@example.com']
    );
    
    if (checkResult.rows.length > 0) {
      console.log('User already exists, updating password...');
      
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      await pool.query(
        `UPDATE users 
         SET password_hash = $1, role = 'admin', is_active = true
         WHERE email = 'admin@example.com'`,
        [hashedPassword]
      );
      
      console.log('✓ Admin user updated successfully');
    } else {
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const result = await pool.query(
        `INSERT INTO users (email, name, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, role`,
        [
          'admin@example.com',
          'Administrator',
          hashedPassword,
          'admin',
          true
        ]
      );
      
      console.log('✓ Admin user created successfully');
      console.log('  ID:', result.rows[0].id);
      console.log('  Email:', result.rows[0].email);
      console.log('  Name:', result.rows[0].name);
      console.log('  Role:', result.rows[0].role);
    }
    
    console.log('\nCredentials:');
    console.log('  Email: admin@example.com');
    console.log('  Password: Admin123!');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
