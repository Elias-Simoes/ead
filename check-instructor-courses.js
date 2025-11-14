require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkInstructorCourses() {
  try {
    const email = 'instructor@example.com'; // Email do instrutor
    
    console.log(`🔍 Verificando cursos do instrutor: ${email}\n`);
    
    // Buscar instrutor
    const userResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.role 
      FROM users u
      WHERE u.email = $1 AND u.role = 'instructor'
    `, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Instrutor não encontrado');
      return;
    }
    
    const instructor = userResult.rows[0];
    console.log(`✅ Instrutor encontrado:`);
    console.log(`   Nome: ${instructor.name}`);
    console.log(`   Email: ${instructor.email}`);
    console.log(`   ID: ${instructor.id}\n`);
    
    // Buscar cursos do instrutor
    const coursesResult = await pool.query(`
      SELECT c.id, c.title, c.status, c.created_at,
             (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as modules_count,
             (SELECT COUNT(*) FROM lessons l 
              JOIN modules m ON l.module_id = m.id 
              WHERE m.course_id = c.id) as lessons_count
      FROM courses c
      WHERE c.instructor_id = $1
      ORDER BY c.created_at DESC
    `, [instructor.id]);
    
    console.log(`📚 Total de cursos: ${coursesResult.rows.length}\n`);
    
    if (coursesResult.rows.length > 0) {
      console.log('📋 Seus cursos:');
      coursesResult.rows.forEach(course => {
        console.log(`\n  📖 ${course.title}`);
        console.log(`     ID: ${course.id}`);
        console.log(`     Status: ${course.status}`);
        console.log(`     Módulos: ${course.modules_count}`);
        console.log(`     Aulas: ${course.lessons_count}`);
        console.log(`     Criado em: ${course.created_at}`);
      });
    } else {
      console.log('⚠️  Você não tem cursos cadastrados ainda.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkInstructorCourses();
