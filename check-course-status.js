const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkCourse() {
  try {
    const courseId = '65cb2e3f-819f-456a-8efc-3d041bbd1883';
    
    console.log(`🔍 Verificando curso ${courseId}...\n`);

    const result = await pool.query(`
      SELECT c.*, u.name as instructor_name
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = $1
    `, [courseId]);

    if (result.rows.length === 0) {
      console.log('❌ Curso não encontrado!');
      return;
    }

    const course = result.rows[0];
    console.log('📚 CURSO:');
    console.log(`Título: ${course.title}`);
    console.log(`Status: ${course.status}`);
    console.log(`Instrutor: ${course.instructor_name}`);
    console.log(`Criado em: ${course.created_at}`);

    // Verificar módulos
    const modules = await pool.query(`
      SELECT * FROM modules WHERE course_id = $1
    `, [courseId]);

    console.log(`\n📦 MÓDULOS: ${modules.rows.length}`);

    // Verificar aulas
    const lessons = await pool.query(`
      SELECT l.* FROM lessons l
      INNER JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = $1
    `, [courseId]);

    console.log(`📝 AULAS: ${lessons.rows.length}`);

    if (modules.rows.length === 0) {
      console.log('\n⚠️ Curso não tem módulos!');
    }

    if (lessons.rows.length === 0) {
      console.log('⚠️ Curso não tem aulas!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkCourse();
