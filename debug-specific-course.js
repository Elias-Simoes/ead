require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugSpecificCourse() {
  try {
    console.log('🔍 Investigando curso específico...\n');

    // Buscar o curso do instrutor João Silva
    console.log('1️⃣ Buscando cursos do instrutor João Silva:');
    const instructorResult = await pool.query(`
      SELECT id, name, email
      FROM users
      WHERE email = 'instructor@example.com'
    `);

    if (instructorResult.rows.length === 0) {
      console.log('❌ Instrutor não encontrado!\n');
      return;
    }

    const instructorId = instructorResult.rows[0].id;
    console.log(`   Instrutor: ${instructorResult.rows[0].name} (ID: ${instructorId})\n`);

    // Buscar cursos desse instrutor
    console.log('2️⃣ Cursos do instrutor:');
    const coursesResult = await pool.query(`
      SELECT id, title, status
      FROM courses
      WHERE instructor_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [instructorId]);

    if (coursesResult.rows.length === 0) {
      console.log('❌ Nenhum curso encontrado!\n');
      return;
    }

    coursesResult.rows.forEach((course, idx) => {
      console.log(`   ${idx + 1}. ${course.title} (ID: ${course.id})`);
      console.log(`      Status: ${course.status}`);
    });

    // Pegar o primeiro curso
    const courseId = coursesResult.rows[0].id;
    const courseTitle = coursesResult.rows[0].title;

    console.log(`\n3️⃣ Analisando curso: ${courseTitle}\n`);

    // Buscar módulos do curso
    console.log('   Módulos:');
    const modulesResult = await pool.query(`
      SELECT id, title, order_index
      FROM modules
      WHERE course_id = $1
      ORDER BY order_index ASC
    `, [courseId]);

    if (modulesResult.rows.length === 0) {
      console.log('   ❌ Nenhum módulo encontrado!\n');
      return;
    }

    for (const module of modulesResult.rows) {
      console.log(`   - ${module.title} (ID: ${module.id})`);
      
      // Verificar se tem avaliação
      const assessmentResult = await pool.query(`
        SELECT id, title, type
        FROM assessments
        WHERE module_id = $1
      `, [module.id]);

      if (assessmentResult.rows.length > 0) {
        console.log(`     ✅ Avaliação: ${assessmentResult.rows[0].title}`);
      } else {
        console.log(`     ❌ Sem avaliação`);
      }
    }

    // Testar a query que o backend usa
    console.log(`\n4️⃣ Testando query do backend (getCourseAssessments):\n`);
    const backendQueryResult = await pool.query(`
      SELECT a.*, m.title as module_title
      FROM assessments a
      JOIN modules m ON a.module_id = m.id
      WHERE m.course_id = $1
      ORDER BY m.order_index ASC, a.created_at ASC
    `, [courseId]);

    if (backendQueryResult.rows.length === 0) {
      console.log('   ❌ Query do backend retornou 0 avaliações!\n');
      
      // Verificar se o problema é no JOIN
      console.log('5️⃣ Verificando se o problema é no JOIN:\n');
      
      const directQueryResult = await pool.query(`
        SELECT 
          a.id as assessment_id,
          a.title as assessment_title,
          a.module_id,
          m.id as module_id_from_join,
          m.title as module_title,
          m.course_id
        FROM assessments a
        LEFT JOIN modules m ON a.module_id = m.id
        WHERE a.module_id IN (
          SELECT id FROM modules WHERE course_id = $1
        )
      `, [courseId]);

      console.log(`   Avaliações encontradas com LEFT JOIN: ${directQueryResult.rows.length}`);
      
      if (directQueryResult.rows.length > 0) {
        directQueryResult.rows.forEach(row => {
          console.log(`   - Avaliação: ${row.assessment_title}`);
          console.log(`     Module ID na avaliação: ${row.module_id}`);
          console.log(`     Module ID do JOIN: ${row.module_id_from_join}`);
          console.log(`     Módulo: ${row.module_title || 'NULL'}`);
          console.log(`     Course ID: ${row.course_id || 'NULL'}`);
        });
      }
    } else {
      console.log(`   ✅ Query retornou ${backendQueryResult.rows.length} avaliação(ões):\n`);
      backendQueryResult.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. ${row.title}`);
        console.log(`      Módulo: ${row.module_title}`);
        console.log(`      Tipo: ${row.type}`);
      });
    }

    console.log('\n✅ Diagnóstico concluído!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

debugSpecificCourse();
