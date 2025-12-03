const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'plataforma_ead',
  user: 'user',
  password: 'password',
});

async function checkSpecificCourse() {
  try {
    console.log('🔍 VERIFICANDO CURSO ESPECÍFICO DO FRONTEND\n');
    console.log('=' .repeat(70));

    // Primeiro, vamos ver TODOS os cursos e suas avaliações
    console.log('\n1️⃣ Listando TODOS os cursos com avaliações:\n');
    
    const allCoursesResult = await pool.query(`
      SELECT c.id, c.title, c.instructor_id, c.created_at,
             COUNT(DISTINCT a.id) as assessment_count,
             COUNT(DISTINCT m.id) as module_count
      FROM courses c
      LEFT JOIN modules m ON c.id = m.course_id
      LEFT JOIN assessments a ON m.id = a.module_id
      GROUP BY c.id, c.title, c.instructor_id, c.created_at
      ORDER BY c.created_at DESC
      LIMIT 10
    `);

    console.log('Cursos encontrados:');
    allCoursesResult.rows.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.title}`);
      console.log(`   ID: ${course.id}`);
      console.log(`   Módulos: ${course.module_count}`);
      console.log(`   Avaliações: ${course.assessment_count}`);
    });

    // Agora vamos verificar o curso que tem a avaliação "tESTE"
    console.log('\n\n2️⃣ Procurando curso com avaliação "tESTE":\n');
    
    const testeResult = await pool.query(`
      SELECT c.id as course_id, c.title as course_title,
             m.id as module_id, m.title as module_title,
             a.id as assessment_id, a.title as assessment_title
      FROM assessments a
      JOIN modules m ON a.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE a.title ILIKE '%teste%'
      ORDER BY a.created_at DESC
    `);

    if (testeResult.rows.length > 0) {
      console.log('✅ Encontrado!');
      testeResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. Avaliação: ${row.assessment_title}`);
        console.log(`   Assessment ID: ${row.assessment_id}`);
        console.log(`   Módulo: ${row.module_title} (${row.module_id})`);
        console.log(`   Curso: ${row.course_title} (${row.course_id})`);
      });

      // Pegar o course_id do primeiro resultado
      const courseId = testeResult.rows[0].course_id;
      
      console.log(`\n\n3️⃣ Analisando curso ${courseId} em detalhes:\n`);
      
      // Buscar TODOS os módulos deste curso
      const modulesResult = await pool.query(`
        SELECT id, title, order_index, course_id
        FROM modules
        WHERE course_id = $1
        ORDER BY order_index ASC
      `, [courseId]);

      console.log(`Total de módulos: ${modulesResult.rows.length}\n`);
      modulesResult.rows.forEach((module, index) => {
        console.log(`${index + 1}. ${module.title} (ID: ${module.id})`);
      });

      // Buscar TODAS as avaliações deste curso
      console.log(`\n\n4️⃣ Avaliações do curso ${courseId}:\n`);
      
      const assessmentsResult = await pool.query(`
        SELECT a.id, a.title, a.module_id, a.course_id, a.created_at,
               m.title as module_title
        FROM assessments a
        LEFT JOIN modules m ON a.module_id = m.id
        WHERE a.course_id = $1 OR m.course_id = $1
        ORDER BY a.created_at ASC
      `, [courseId]);

      console.log(`Total de avaliações: ${assessmentsResult.rows.length}\n`);
      assessmentsResult.rows.forEach((assessment, index) => {
        console.log(`${index + 1}. ${assessment.title}`);
        console.log(`   ID: ${assessment.id}`);
        console.log(`   Module ID: ${assessment.module_id}`);
        console.log(`   Course ID (direto): ${assessment.course_id}`);
        console.log(`   Module Title: ${assessment.module_title || 'N/A'}`);
        console.log(`   Created: ${assessment.created_at}`);
        console.log('');
      });

      // Verificar a query que o backend usa
      console.log(`\n5️⃣ Simulando query do backend (getCourseAssessments):\n`);
      
      const backendQueryResult = await pool.query(`
        SELECT a.*, m.title as module_title
        FROM assessments a
        JOIN modules m ON a.module_id = m.id
        WHERE m.course_id = $1
        ORDER BY m.order_index ASC, a.created_at ASC
      `, [courseId]);

      console.log(`Resultado da query do backend: ${backendQueryResult.rows.length} avaliação(ões)\n`);
      backendQueryResult.rows.forEach((assessment, index) => {
        console.log(`${index + 1}. ${assessment.title}`);
        console.log(`   ID: ${assessment.id}`);
        console.log(`   Module ID: ${assessment.module_id}`);
        console.log(`   Module Title: ${assessment.module_title}`);
        console.log('');
      });

      // Verificar se há avaliações órfãs (com course_id mas sem module_id válido)
      console.log(`\n6️⃣ Verificando avaliações órfãs:\n`);
      
      const orphanResult = await pool.query(`
        SELECT a.id, a.title, a.module_id, a.course_id
        FROM assessments a
        LEFT JOIN modules m ON a.module_id = m.id
        WHERE a.course_id = $1 AND m.id IS NULL
      `, [courseId]);

      if (orphanResult.rows.length > 0) {
        console.log(`⚠️ Encontradas ${orphanResult.rows.length} avaliação(ões) órfã(s):`);
        orphanResult.rows.forEach((assessment, index) => {
          console.log(`\n${index + 1}. ${assessment.title}`);
          console.log(`   ID: ${assessment.id}`);
          console.log(`   Module ID: ${assessment.module_id} (módulo não existe!)`);
          console.log(`   Course ID: ${assessment.course_id}`);
        });
      } else {
        console.log('✅ Nenhuma avaliação órfã encontrada');
      }

    } else {
      console.log('❌ Nenhuma avaliação com "teste" no título encontrada');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Verificação concluída!\n');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
    await pool.end();
  }
}

checkSpecificCourse();
