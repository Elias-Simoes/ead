const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function resetPassword() {
  try {
    const email = 'instructor@example.com';
    const newPassword = 'Senha123!';
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
      [hashedPassword, email]
    );
    
    if (result.rows.length > 0) {
      console.log('✓ Senha resetada com sucesso!');
      console.log('Email:', result.rows[0].email);
      console.log('Nova senha:', newPassword);
    } else {
      console.log('✗ Usuário não encontrado');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await pool.end();
  }
}

resetPassword();
