const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkInstructor() {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.role, i.id as instructor_id
      FROM users u
      LEFT JOIN instructors i ON u.id = i.id
      WHERE u.role = 'instructor'
      LIMIT 5
    `);
    
    console.log('Instrutores encontrados:');
    result.rows.forEach(row => {
      console.log(`- Email: ${row.email}, User ID: ${row.id}, Instructor ID: ${row.instructor_id}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await pool.end();
  }
}

checkInstructor();
