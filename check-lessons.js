const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkLessons() {
  try {
    const result = await pool.query(`
      SELECT 
        l.id,
        l.title,
        l.module_id,
        l.type,
        l.order_index,
        l.created_at,
        m.title as module_title,
        c.title as course_title
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Aulas encontradas (${result.rows.length}):\n`);
    result.rows.forEach(row => {
      console.log(`Aula: ${row.title}`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Módulo: ${row.module_title} (${row.module_id})`);
      console.log(`  Curso: ${row.course_title}`);
      console.log(`  Tipo: ${row.type}`);
      console.log(`  Ordem: ${row.order_index}`);
      console.log(`  Criada em: ${row.created_at}`);
      console.log('');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await pool.end();
  }
}

checkLessons();
