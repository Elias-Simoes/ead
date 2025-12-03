const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPendingCourses() {
  try {
    console.log('🔍 Verificando cursos no banco de dados...\n');

    // Todos os cursos
    const allCourses = await pool.query(`
      SELECT c.id, c.title, c.status, c.instructor_id, u.name as instructor_name, c.created_at
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      ORDER BY c.created_at DESC
    `);

    console.log('📚 TODOS OS CURSOS:');
    console.log('==================');
    allCourses.rows.forEach(course => {
      console.log(`ID: ${course.id}`);
      console.log(`Título: ${course.title}`);
      console.log(`Status: ${course.status}`);
      console.log(`Instrutor: ${course.instructor_name} (${course.instructor_id})`);
      console.log(`Criado em: ${course.created_at}`);
      console.log('---');
    });

    // Cursos pendentes
    const pendingCourses = await pool.query(`
      SELECT c.id, c.title, c.status, c.instructor_id, u.name as instructor_name
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.status = 'pending_approval'
      ORDER BY c.created_at DESC
    `);

    console.log('\n⏳ CURSOS PENDENTES DE APROVAÇÃO:');
    console.log('=================================');
    if (pendingCourses.rows.length === 0) {
      console.log('❌ Nenhum curso com status "pending_approval"');
    } else {
      pendingCourses.rows.forEach(course => {
        console.log(`ID: ${course.id}`);
        console.log(`Título: ${course.title}`);
        console.log(`Instrutor: ${course.instructor_name}`);
        console.log('---');
      });
    }

    // Estatísticas
    const stats = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM courses
      GROUP BY status
    `);

    console.log('\n📊 ESTATÍSTICAS POR STATUS:');
    console.log('===========================');
    stats.rows.forEach(stat => {
      console.log(`${stat.status}: ${stat.count} curso(s)`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkPendingCourses();
