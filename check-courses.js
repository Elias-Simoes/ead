const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'plataforma_ead',
  user: 'postgres',
  password: 'postgres',
});

async function checkCourses() {
  try {
    console.log('Verificando cursos no banco...\n');

    // Buscar todos os cursos
    const coursesResult = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.status,
        c.instructor_id,
        u.name as instructor_name,
        u.email as instructor_email
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      ORDER BY c.created_at DESC
    `);

    console.log(`Total de cursos: ${coursesResult.rows.length}\n`);

    if (coursesResult.rows.length > 0) {
      console.log('Cursos encontrados:');
      coursesResult.rows.forEach((course, index) => {
        console.log(`\n${index + 1}. ${course.title}`);
        console.log(`   ID: ${course.id}`);
        console.log(`   Status: ${course.status}`);
        console.log(`   Instrutor: ${course.instructor_name} (${course.instructor_email})`);
      });
    } else {
      console.log('❌ Nenhum curso encontrado no banco de dados.');
      console.log('\nPara criar um curso de teste, use o formulário em:');
      console.log('http://localhost:5173/instructor/courses/new');
    }

    // Buscar instrutor específico
    console.log('\n\n--- Verificando instrutor instructor@example.com ---\n');
    const instructorResult = await pool.query(`
      SELECT id, name, email, role
      FROM users
      WHERE email = 'instructor@example.com'
    `);

    if (instructorResult.rows.length > 0) {
      const instructor = instructorResult.rows[0];
      console.log(`✓ Instrutor encontrado:`);
      console.log(`  ID: ${instructor.id}`);
      console.log(`  Nome: ${instructor.name}`);
      console.log(`  Email: ${instructor.email}`);
      console.log(`  Role: ${instructor.role}`);

      // Buscar cursos desse instrutor
      const instructorCoursesResult = await pool.query(`
        SELECT id, title, status, created_at
        FROM courses
        WHERE instructor_id = $1
        ORDER BY created_at DESC
      `, [instructor.id]);

      console.log(`\n  Cursos deste instrutor: ${instructorCoursesResult.rows.length}`);
      
      if (instructorCoursesResult.rows.length > 0) {
        instructorCoursesResult.rows.forEach((course, index) => {
          console.log(`\n  ${index + 1}. ${course.title}`);
          console.log(`     ID: ${course.id}`);
          console.log(`     Status: ${course.status}`);
          console.log(`     Criado em: ${course.created_at}`);
        });
      }
    } else {
      console.log('❌ Instrutor não encontrado!');
    }

  } catch (error) {
    console.error('Erro ao verificar cursos:', error);
  } finally {
    await pool.end();
  }
}

checkCourses();
