require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testGetAssessments() {
  try {
    console.log('🧪 Testando busca de avaliações por curso...\n');

    // 1. Buscar um curso com módulos e avaliações
    console.log('1️⃣ Buscando cursos com avaliações:');
    const coursesResult = await pool.query(`
      SELECT 
        c.id as course_id,
        c.title as course_title,
        COUNT(DISTINCT m.id) as module_count,
        COUNT(DISTINCT a.id) as assessment_count
      FROM courses c
      LEFT JOIN modules m ON m.course_id = c.id
      LEFT JOIN assessments a ON a.module_id = m.id
      GROUP BY c.id, c.title
      HAVING COUNT(DISTINCT a.id) > 0
      ORDER BY c.created_at DESC
      LIMIT 3
    `);

    if (coursesResult.rows.length === 0) {
      console.log('❌ Nenhum curso com avaliações encontrado!\n');
      return;
    }

    coursesResult.rows.forEach(course => {
      console.log(`   Curso: ${course.course_title}`);
      console.log(`   ID: ${course.course_id}`);
      console.log(`   Módulos: ${course.module_count}`);
      console.log(`   Avaliações: ${course.assessment_count}`);
      console.log('   ---');
    });

    // 2. Testar a query corrigida para o primeiro curso
    const testCourseId = coursesResult.rows[0].course_id;
    console.log(`\n2️⃣ Testando query corrigida para curso: ${coursesResult.rows[0].course_title}\n`);

    const assessmentsResult = await pool.query(`
      SELECT a.*, m.title as module_title
      FROM assessments a
      JOIN modules m ON a.module_id = m.id
      WHERE m.course_id = $1
      ORDER BY m.order_index ASC, a.created_at ASC
    `, [testCourseId]);

    if (assessmentsResult.rows.length === 0) {
      console.log('❌ Nenhuma avaliação encontrada com a query corrigida!\n');
    } else {
      console.log(`✅ ${assessmentsResult.rows.length} avaliação(ões) encontrada(s):\n`);
      assessmentsResult.rows.forEach((assessment, idx) => {
        console.log(`   ${idx + 1}. ${assessment.title}`);
        console.log(`      Módulo: ${assessment.module_title}`);
        console.log(`      ID: ${assessment.id}`);
        console.log(`      Tipo: ${assessment.type}`);
        console.log('      ---');
      });
    }

    // 3. Comparar com a query antiga (que não funcionava)
    console.log('\n3️⃣ Comparando com query antiga (course_id direto):\n');
    const oldQueryResult = await pool.query(
      'SELECT * FROM assessments WHERE course_id = $1',
      [testCourseId]
    );

    console.log(`   Query antiga retornou: ${oldQueryResult.rows.length} avaliação(ões)`);
    console.log(`   Query nova retornou: ${assessmentsResult.rows.length} avaliação(ões)`);
    
    if (oldQueryResult.rows.length === 0 && assessmentsResult.rows.length > 0) {
      console.log('\n✅ Correção funcionou! A query nova encontra as avaliações através dos módulos.');
    }

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro ao testar:', error);
  } finally {
    await pool.end();
  }
}

testGetAssessments();
