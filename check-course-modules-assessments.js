const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'plataforma_ead',
  user: 'user',
  password: 'password',
});

async function checkData() {
  try {
    console.log('🔍 DIAGNÓSTICO DIRETO NO BANCO DE DADOS\n');
    console.log('=' .repeat(70));

    // Buscar cursos
    console.log('\n1️⃣ Cursos cadastrados:');
    const coursesResult = await pool.query(`
      SELECT id, title, instructor_id 
      FROM courses 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (coursesResult.rows.length === 0) {
      console.log('   ❌ Nenhum curso encontrado');
      await pool.end();
      return;
    }

    coursesResult.rows.forEach((course, index) => {
      console.log(`   ${index + 1}. ${course.title} (ID: ${course.id})`);
    });

    const courseId = coursesResult.rows[0].id;
    const courseTitle = coursesResult.rows[0].title;
    
    console.log(`\n📚 Analisando curso: "${courseTitle}" (ID: ${courseId})`);
    console.log('=' .repeat(70));

    // Buscar módulos do curso
    console.log('\n2️⃣ Módulos do curso:');
    const modulesResult = await pool.query(`
      SELECT id, title, order_index 
      FROM modules 
      WHERE course_id = $1 
      ORDER BY order_index ASC
    `, [courseId]);

    if (modulesResult.rows.length === 0) {
      console.log('   ❌ Nenhum módulo encontrado');
      await pool.end();
      return;
    }

    console.log(`   Total: ${modulesResult.rows.length} módulo(s)\n`);
    modulesResult.rows.forEach((module, index) => {
      console.log(`   ${index + 1}. ${module.title} (ID: ${module.id})`);
    });

    // Buscar avaliações do curso
    console.log('\n3️⃣ Avaliações do curso:');
    const assessmentsResult = await pool.query(`
      SELECT a.id, a.title, a.module_id, m.title as module_title
      FROM assessments a
      LEFT JOIN modules m ON a.module_id = m.id
      WHERE a.course_id = $1 OR m.course_id = $1
      ORDER BY a.created_at ASC
    `, [courseId]);

    console.log(`   Total: ${assessmentsResult.rows.length} avaliação(ões)\n`);
    
    if (assessmentsResult.rows.length > 0) {
      assessmentsResult.rows.forEach((assessment, index) => {
        console.log(`   ${index + 1}. ${assessment.title}`);
        console.log(`      - ID: ${assessment.id}`);
        console.log(`      - Module ID: ${assessment.module_id}`);
        console.log(`      - Module Title: ${assessment.module_title || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️ Nenhuma avaliação encontrada');
    }

    // Análise detalhada: módulo por módulo
    console.log('\n4️⃣ Análise módulo por módulo:');
    console.log('\n' + '='.repeat(70));
    console.log('MÓDULO'.padEnd(35) + ' | ' + 'TEM AVALIAÇÃO?'.padEnd(20) + ' | AVALIAÇÃO');
    console.log('='.repeat(70));

    for (const module of modulesResult.rows) {
      const assessment = assessmentsResult.rows.find(a => a.module_id === module.id);
      const hasAssessment = !!assessment;
      const status = hasAssessment ? '✅ SIM' : '❌ NÃO';
      const assessmentTitle = assessment ? assessment.title : '-';
      
      console.log(
        `${module.title.substring(0, 33).padEnd(35)} | ${status.padEnd(20)} | ${assessmentTitle}`
      );
    }
    console.log('='.repeat(70));

    // Verificar módulos SEM avaliação
    console.log('\n5️⃣ Módulos SEM avaliação (query do backend):');
    const modulesWithoutResult = await pool.query(`
      SELECT m.id, m.title, m.description, m.order_index
      FROM modules m
      LEFT JOIN assessments a ON m.id = a.module_id
      WHERE m.course_id = $1 AND a.id IS NULL
      ORDER BY m.order_index ASC
    `, [courseId]);

    console.log(`   Total: ${modulesWithoutResult.rows.length} módulo(s) sem avaliação\n`);
    
    if (modulesWithoutResult.rows.length > 0) {
      modulesWithoutResult.rows.forEach((module, index) => {
        console.log(`   ${index + 1}. ${module.title} (ID: ${module.id})`);
      });
    } else {
      console.log('   ℹ️ Todos os módulos já possuem avaliação');
    }

    // Resumo
    console.log('\n6️⃣ Resumo:');
    console.log('=' .repeat(70));
    console.log(`   📊 Total de módulos: ${modulesResult.rows.length}`);
    console.log(`   ✅ Módulos COM avaliação: ${assessmentsResult.rows.length}`);
    console.log(`   ❌ Módulos SEM avaliação: ${modulesWithoutResult.rows.length}`);
    console.log(`   📝 Total de avaliações: ${assessmentsResult.rows.length}`);
    console.log('=' .repeat(70));

    // Verificar inconsistências
    const modulesWithAssessment = modulesResult.rows.filter(m =>
      assessmentsResult.rows.some(a => a.module_id === m.id)
    );

    const expectedWithout = modulesResult.rows.length - modulesWithAssessment.length;
    const actualWithout = modulesWithoutResult.rows.length;

    if (expectedWithout !== actualWithout) {
      console.log(`\n⚠️ INCONSISTÊNCIA DETECTADA!`);
      console.log(`   Esperado: ${expectedWithout} módulos sem avaliação`);
      console.log(`   Encontrado: ${actualWithout} módulos sem avaliação`);
    } else {
      console.log(`\n✅ Dados consistentes!`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Diagnóstico concluído!\n');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    await pool.end();
  }
}

checkData();
