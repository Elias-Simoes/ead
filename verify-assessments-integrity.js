const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyAssessmentsIntegrity() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFICAÇÃO: Integridade de Avaliações\n');
    console.log('=' .repeat(70));
    
    let hasErrors = false;

    // 1. Verificar constraint (OU course_id OU module_id)
    console.log('\n1️⃣ Verificando constraint (OU course_id OU module_id)...');
    const constraintCheck = await client.query(`
      SELECT 
        id,
        title,
        course_id,
        module_id,
        CASE 
          WHEN course_id IS NOT NULL AND module_id IS NULL THEN 'OK - Por Curso'
          WHEN course_id IS NULL AND module_id IS NOT NULL THEN 'OK - Por Módulo'
          WHEN course_id IS NOT NULL AND module_id IS NOT NULL THEN 'ERRO - Ambos'
          WHEN course_id IS NULL AND module_id IS NULL THEN 'ERRO - Nenhum'
        END as status
      FROM assessments
      WHERE NOT (
        (course_id IS NOT NULL AND module_id IS NULL) OR 
        (course_id IS NULL AND module_id IS NOT NULL)
      )
    `);

    if (constraintCheck.rows.length > 0) {
      console.log(`❌ ${constraintCheck.rows.length} avaliações violam a constraint:`);
      constraintCheck.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.title} (${row.id}) - ${row.status}`);
      });
      hasErrors = true;
    } else {
      console.log('✅ Todas as avaliações respeitam a constraint');
    }

    // 2. Verificar avaliações órfãs (módulo inexistente)
    console.log('\n2️⃣ Verificando avaliações órfãs (módulo inexistente)...');
    const orphanModules = await client.query(`
      SELECT 
        a.id,
        a.title,
        a.module_id
      FROM assessments a
      LEFT JOIN modules m ON a.module_id = m.id
      WHERE a.module_id IS NOT NULL AND m.id IS NULL
    `);

    if (orphanModules.rows.length > 0) {
      console.log(`❌ ${orphanModules.rows.length} avaliações com módulo inexistente:`);
      orphanModules.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.title} (${row.id}) - módulo ${row.module_id}`);
      });
      hasErrors = true;
    } else {
      console.log('✅ Nenhuma avaliação órfã (módulo)');
    }

    // 3. Verificar avaliações órfãs (curso inexistente)
    console.log('\n3️⃣ Verificando avaliações órfãs (curso inexistente)...');
    const orphanCourses = await client.query(`
      SELECT 
        a.id,
        a.title,
        a.course_id
      FROM assessments a
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.course_id IS NOT NULL AND c.id IS NULL
    `);

    if (orphanCourses.rows.length > 0) {
      console.log(`❌ ${orphanCourses.rows.length} avaliações com curso inexistente:`);
      orphanCourses.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.title} (${row.id}) - curso ${row.course_id}`);
      });
      hasErrors = true;
    } else {
      console.log('✅ Nenhuma avaliação órfã (curso)');
    }

    // 4. Verificar consistência módulo → curso
    console.log('\n4️⃣ Verificando consistência módulo → curso...');
    const inconsistent = await client.query(`
      SELECT 
        a.id as assessment_id,
        a.title as assessment_title,
        a.course_id as assessment_course_id,
        a.module_id,
        m.title as module_title,
        m.course_id as module_course_id,
        c1.title as assessment_course_title,
        c2.title as module_course_title
      FROM assessments a
      JOIN modules m ON a.module_id = m.id
      LEFT JOIN courses c1 ON a.course_id = c1.id
      LEFT JOIN courses c2 ON m.course_id = c2.id
      WHERE a.course_id IS NOT NULL 
        AND a.course_id != m.course_id
    `);

    if (inconsistent.rows.length > 0) {
      console.log(`❌ ${inconsistent.rows.length} avaliações inconsistentes:`);
      inconsistent.rows.forEach((row, index) => {
        console.log(`\n   ${index + 1}. Avaliação: ${row.assessment_title}`);
        console.log(`      Curso da avaliação: ${row.assessment_course_title}`);
        console.log(`      Curso do módulo: ${row.module_course_title}`);
      });
      hasErrors = true;
    } else {
      console.log('✅ Todas as avaliações estão consistentes');
    }

    // 5. Verificar módulos com múltiplas avaliações
    console.log('\n5️⃣ Verificando módulos com múltiplas avaliações...');
    const duplicates = await client.query(`
      SELECT 
        m.id as module_id,
        m.title as module_title,
        c.title as course_title,
        COUNT(a.id) as assessment_count,
        array_agg(a.title) as assessment_titles
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN assessments a ON m.id = a.module_id
      GROUP BY m.id, m.title, c.title
      HAVING COUNT(a.id) > 1
    `);

    if (duplicates.rows.length > 0) {
      console.log(`❌ ${duplicates.rows.length} módulos com múltiplas avaliações:`);
      duplicates.rows.forEach((row, index) => {
        console.log(`\n   ${index + 1}. Módulo: ${row.module_title} (${row.module_id})`);
        console.log(`      Curso: ${row.course_title}`);
        console.log(`      Avaliações: ${row.assessment_count}`);
        console.log(`      Títulos: ${row.assessment_titles.join(', ')}`);
      });
      hasErrors = true;
    } else {
      console.log('✅ Cada módulo tem no máximo 1 avaliação');
    }

    // 6. Relatório de estatísticas
    console.log('\n6️⃣ Estatísticas gerais...');
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_assessments,
        COUNT(CASE WHEN course_id IS NOT NULL AND module_id IS NULL THEN 1 END) as by_course,
        COUNT(CASE WHEN course_id IS NULL AND module_id IS NOT NULL THEN 1 END) as by_module,
        (SELECT COUNT(*) FROM modules) as total_modules,
        (SELECT COUNT(DISTINCT module_id) FROM assessments WHERE module_id IS NOT NULL) as modules_with_assessment,
        (SELECT COUNT(*) FROM courses) as total_courses
      FROM assessments
    `);

    const s = stats.rows[0];
    console.log('\n📊 Estatísticas:');
    console.log(`   Total de avaliações: ${s.total_assessments}`);
    console.log(`   Por curso (legado): ${s.by_course}`);
    console.log(`   Por módulo (novo): ${s.by_module}`);
    console.log(`   Total de módulos: ${s.total_modules}`);
    console.log(`   Módulos com avaliação: ${s.modules_with_assessment}`);
    console.log(`   Módulos sem avaliação: ${s.total_modules - s.modules_with_assessment}`);
    console.log(`   Total de cursos: ${s.total_courses}`);

    // 7. Resultado final
    console.log('\n' + '='.repeat(70));
    if (hasErrors) {
      console.log('❌ PROBLEMAS ENCONTRADOS!');
      console.log('\nExecute o script de limpeza:');
      console.log('   node cleanup-invalid-assessments.js');
    } else {
      console.log('✅ INTEGRIDADE OK!');
      console.log('✅ Todos os dados estão consistentes');
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Erro durante verificação:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyAssessmentsIntegrity();
