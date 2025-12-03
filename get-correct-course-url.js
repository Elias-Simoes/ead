const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'plataforma_ead',
  user: 'user',
  password: 'password',
});

async function getCorrectCourseUrl() {
  try {
    console.log('\n🎯 ENCONTRANDO O CURSO CORRETO\n');
    console.log('=' .repeat(70));

    // Buscar o curso com 2 avaliações
    const result = await pool.query(`
      SELECT c.id, c.title, c.instructor_id,
             COUNT(DISTINCT a.id) as assessment_count,
             COUNT(DISTINCT m.id) as module_count
      FROM courses c
      LEFT JOIN modules m ON c.id = m.course_id
      LEFT JOIN assessments a ON m.id = a.module_id
      WHERE c.title LIKE '%Test Course%' OR c.title LIKE '%Module Assessment%'
      GROUP BY c.id, c.title, c.instructor_id
      HAVING COUNT(DISTINCT a.id) = 2
      ORDER BY c.created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('❌ Nenhum curso com 2 avaliações encontrado');
      await pool.end();
      return;
    }

    const course = result.rows[0];
    const courseId = course.id;

    console.log('✅ Curso encontrado!\n');
    console.log(`Título: ${course.title}`);
    console.log(`ID: ${courseId}`);
    console.log(`Módulos: ${course.module_count}`);
    console.log(`Avaliações: ${course.assessment_count}`);

    // Buscar detalhes das avaliações
    const assessmentsResult = await pool.query(`
      SELECT a.id, a.title, m.title as module_title
      FROM assessments a
      JOIN modules m ON a.module_id = m.id
      WHERE m.course_id = $1
      ORDER BY m.order_index ASC
    `, [courseId]);

    console.log('\n📋 Avaliações:');
    assessmentsResult.rows.forEach((assessment, index) => {
      console.log(`   ${index + 1}. ${assessment.title} (${assessment.module_title})`);
    });

    // Gerar URLs
    console.log('\n\n🔗 URLs para acessar:\n');
    console.log('=' .repeat(70));
    
    const baseUrl = 'http://localhost:5173';
    
    console.log('\n1️⃣ Gerenciar Avaliações:');
    console.log(`   ${baseUrl}/instructor/courses/${courseId}/assessments`);
    
    console.log('\n2️⃣ Criar Nova Avaliação:');
    console.log(`   ${baseUrl}/instructor/courses/${courseId}/assessments/new`);
    
    console.log('\n3️⃣ Gerenciar Curso:');
    console.log(`   ${baseUrl}/instructor/courses/${courseId}`);

    console.log('\n\n💡 INSTRUÇÕES:\n');
    console.log('=' .repeat(70));
    console.log('1. Copie a URL "Gerenciar Avaliações" acima');
    console.log('2. Cole no navegador');
    console.log('3. Você deve ver 2 avaliações listadas');
    console.log('4. Ao clicar em "Criar Avaliação", deve ver:');
    console.log('   "Todos os módulos já possuem avaliações"');
    console.log('=' .repeat(70));

    console.log('\n✅ Pronto!\n');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    await pool.end();
  }
}

getCorrectCourseUrl();
