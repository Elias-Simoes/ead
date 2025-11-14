const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');
    
    const newPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE email = 'admin@example.com'
       RETURNING id, email, name, role`,
      [hashedPassword]
    );
    
    if (result.rows.length > 0) {
      console.log('✓ Admin password reset successfully!');
      console.log('\nAdmin credentials:');
      console.log('Email: admin@example.com');
      console.log('Password: Admin123!');
      console.log('\nUser details:', result.rows[0]);
    } else {
      console.log('✗ Admin user not found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
