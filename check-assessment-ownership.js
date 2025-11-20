require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkOwnership() {
  try {
    console.log('🔍 Verificando propriedade das avaliações...\n');

    const result = await pool.query(`
      SELECT 
        a.id as assessment_id,
        a.title as assessment_title,
        a.course_id,
        c.title as course_title,
        c.instructor_id,
        u.email as instructor_email,
        u.name as instructor_name
      FROM assessments a
      JOIN courses c ON c.id = a.course_id
      JOIN users u ON u.id = c.instructor_id
      ORDER BY a.created_at DESC;
    `);

    console.table(result.rows);

    console.log('\n📋 Instrutor logado: instructor@example.com');
    console.log('Verificar se o email acima corresponde ao instrutor das avaliações');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkOwnership();
