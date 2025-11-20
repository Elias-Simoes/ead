const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkCoursesWithImages() {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.cover_image,
        c.instructor_id,
        u.email as instructor_email
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      WHERE c.cover_image IS NOT NULL
      ORDER BY c.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Cursos com imagens (${result.rows.length}):\n`);
    result.rows.forEach(row => {
      console.log(`Curso: ${row.title}`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Instrutor: ${row.instructor_email}`);
      console.log(`  Cover Image: ${row.cover_image}`);
      console.log('');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await pool.end();
  }
}

checkCoursesWithImages();
