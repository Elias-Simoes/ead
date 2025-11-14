require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verifyCourses() {
  try {
    console.log('🔍 Verificando cursos na base de dados...\n');
    
    // Verificar total de cursos
    const coursesResult = await pool.query('SELECT COUNT(*) as total FROM courses');
    console.log(`📚 Total de cursos: ${coursesResult.rows[0].total}`);
    
    // Listar cursos
    const allCourses = await pool.query(`
      SELECT id, title, instructor_id, status, created_at 
      FROM courses 
      ORDER BY created_at DESC
    `);
    
    if (allCourses.rows.length > 0) {
      console.log('\n📋 Cursos cadastrados:');
      allCourses.rows.forEach(course => {
        console.log(`  - ID: ${course.id}`);
        console.log(`    Título: ${course.title}`);
        console.log(`    Instrutor ID: ${course.instructor_id}`);
        console.log(`    Status: ${course.status}`);
        console.log(`    Criado em: ${course.created_at}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  Nenhum curso encontrado na base de dados');
    }
    
    // Verificar usuários
    const usersResult = await pool.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE role IN ('instructor', 'student')
      ORDER BY role, created_at DESC
    `);
    
    console.log(`\n👥 Usuários cadastrados: ${usersResult.rows.length}`);
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} - ID: ${user.id}`);
    });
    
    // Verificar progresso
    const progressResult = await pool.query('SELECT COUNT(*) as total FROM course_progress');
    console.log(`\n📊 Registros de progresso: ${progressResult.rows[0].total}`);
    
    // Verificar assinaturas ativas
    const subscriptionsResult = await pool.query(`
      SELECT COUNT(*) as total 
      FROM subscriptions 
      WHERE status = 'active' AND end_date > NOW()
    `);
    console.log(`💳 Assinaturas ativas: ${subscriptionsResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verifyCourses();
