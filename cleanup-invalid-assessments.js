const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanupInvalidAssessments() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 LIMPEZA: Avaliações Inválidas\n');
    console.log('=' .repeat(70));
    
    await client.query('BEGIN');
    
    // 1. Identificar avaliações com course_id E module_id
    console.log('\n1️⃣ Identificando avaliações com course_id E module_id...');
    const bothFieldsResult = await client.query(`
      SELECT 
        a.id,
        a.title,
        a.course_id,
        a.module_id,
        m.title as module_title,
        m.course_id as module_course_id,
        c1.title as assessment_course_title,
        c2.title as module_course_title
      FROM assessments a
      LEFT JOIN modules m ON a.module_id = m.id
      LEFT JOIN courses c1 ON a.course_id = c1.id
      LEFT JOIN courses c2 ON m.course_id = c2.id
      WHERE a.course_id IS NOT NULL AND a.module_id IS NOT NULL
    `);

    if (bothFieldsResult.rows.length > 0) {
      console.log(`⚠️  Encontradas ${bothFieldsResult.rows.length} avaliações com ambos os campos:`);
      bothFieldsResult.rows.forEach((row, index) => {
        console.log(`\n   ${index + 1}. Avaliação: ${row.title} (${row.id})`);
        console.log(`      course_id: ${row.course_id} (${row.assessment_course_title})`);
        console.log(`      module_id: ${row.module_id} (${row.module_title})`);
        console.log(`      Módulo pertence ao curso: ${row.module_course_id} (${row.module_course_title})`);
        
        if (row.course_id !== row.module_course_id) {
          console.log(`      ❌ INCONSISTENTE! course_id ≠ curso do módulo`);
        } else {
          console.log(`      ⚠️  Redundante mas consistente`);
        }
      });
      
      // Corrigir: remover course_id, manter apenas module_id
      console.log('\n   Corrigindo: removendo course_id...');
      const updateResult = await client.query(`
        UPDATE assessments
        SET course_id = NULL
        WHERE course_id IS NOT NULL AND module_id IS NOT NULL
        RETURNING id, title
      `);
      console.log(`   ✅ ${updateResult.rows.length} avaliações corrigidas`);
    } else {
      console.log('✅ Nenhuma avaliação com ambos os campos');
    }

    // 2. Identificar avaliações órfãs (module_id aponta para módulo inexistente)
    console.log('\n2️⃣ Identificando avaliações órfãs (módulo inexistente)...');
    const orphanModuleResult = await client.query(`
      SELECT 
        a.id,
        a.title,
        a.module_id
      FROM assessments a
      LEFT JOIN modules m ON a.module_id = m.id
      WHERE a.module_id IS NOT NULL AND m.id IS NULL
    `);

    if (orphanModuleResult.rows.length > 0) {
      console.log(`❌ Encontradas ${orphanModuleResult.rows.length} avaliações órfãs:`);
      orphanModuleResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.title} (${row.id}) - módulo ${row.module_id} não existe`);
      });
      
      // Deletar avaliações órfãs
      console.log('\n   Deletando avaliações órfãs...');
      
      // Primeiro deletar as questões
      const deleteQuestionsResult = await client.query(`
        DELETE FROM questions
        WHERE assessment_id IN (
          SELECT a.id
          FROM assessments a
          LEFT JOIN modules m ON a.module_id = m.id
          WHERE a.module_id IS NOT NULL AND m.id IS NULL
        )
        RETURNING id
      `);
      console.log(`   ✅ ${deleteQuestionsResult.rows.length} questões deletadas`);
      
      // Depois deletar as avaliações
      const deleteAssessmentsResult = await client.query(`
        DELETE FROM assessments
        WHERE id IN (
          SELECT a.id
          FROM assessments a
          LEFT JOIN modules m ON a.module_id = m.id
          WHERE a.module_id IS NOT NULL AND m.id IS NULL
        )
        RETURNING id, title
      `);
      console.log(`   ✅ ${deleteAssessmentsResult.rows.length} avaliações deletadas`);
    } else {
      console.log('✅ Nenhuma avaliação órfã encontrada');
    }

    // 3. Identificar avaliações órfãs (course_id aponta para curso inexistente)
    console.log('\n3️⃣ Identificando avaliações órfãs (curso inexistente)...');
    const orphanCourseResult = await client.query(`
      SELECT 
        a.id,
        a.title,
        a.course_id
      FROM assessments a
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.course_id IS NOT NULL AND c.id IS NULL
    `);

    if (orphanCourseResult.rows.length > 0) {
      console.log(`❌ Encontradas ${orphanCourseResult.rows.length} avaliações órfãs:`);
      orphanCourseResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.title} (${row.id}) - curso ${row.course_id} não existe`);
      });
      
      // Deletar avaliações órfãs
      console.log('\n   Deletando avaliações órfãs...');
      
      // Primeiro deletar as questões
      const deleteQuestionsResult = await client.query(`
        DELETE FROM questions
        WHERE assessment_id IN (
          SELECT a.id
          FROM assessments a
          LEFT JOIN courses c ON a.course_id = c.id
          WHERE a.course_id IS NOT NULL AND c.id IS NULL
        )
        RETURNING id
      `);
      console.log(`   ✅ ${deleteQuestionsResult.rows.length} questões deletadas`);
      
      // Depois deletar as avaliações
      const deleteAssessmentsResult = await client.query(`
        DELETE FROM assessments
        WHERE id IN (
          SELECT a.id
          FROM assessments a
          LEFT JOIN courses c ON a.course_id = c.id
          WHERE a.course_id IS NOT NULL AND c.id IS NULL
        )
        RETURNING id, title
      `);
      console.log(`   ✅ ${deleteAssessmentsResult.rows.length} avaliações deletadas`);
    } else {
      console.log('✅ Nenhuma avaliação órfã encontrada');
    }

    // 4. Verificar avaliações com module_id onde módulo pertence a curso diferente
    console.log('\n4️⃣ Verificando consistência módulo → curso...');
    const inconsistentResult = await client.query(`
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

    if (inconsistentResult.rows.length > 0) {
      console.log(`❌ Encontradas ${inconsistentResult.rows.length} avaliações inconsistentes:`);
      inconsistentResult.rows.forEach((row, index) => {
        console.log(`\n   ${index + 1}. Avaliação: ${row.assessment_title} (${row.assessment_id})`);
        console.log(`      Curso da avaliação: ${row.assessment_course_id} (${row.assessment_course_title})`);
        console.log(`      Módulo: ${row.module_title} (${row.module_id})`);
        console.log(`      Curso do módulo: ${row.module_course_id} (${row.module_course_title})`);
        console.log(`      ❌ INCONSISTENTE!`);
      });
      
      // Corrigir: remover course_id inconsistente
      console.log('\n   Corrigindo: removendo course_id inconsistente...');
      const fixResult = await client.query(`
        UPDATE assessments a
        SET course_id = NULL
        FROM modules m
        WHERE a.module_id = m.id
          AND a.course_id IS NOT NULL
          AND a.course_id != m.course_id
        RETURNING a.id, a.title
      `);
      console.log(`   ✅ ${fixResult.rows.length} avaliações corrigidas`);
    } else {
      console.log('✅ Todas as avaliações estão consistentes');
    }

    // 5. Relatório final
    console.log('\n5️⃣ Relatório final...');
    const finalReport = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN course_id IS NOT NULL AND module_id IS NULL THEN 1 END) as por_curso,
        COUNT(CASE WHEN course_id IS NULL AND module_id IS NOT NULL THEN 1 END) as por_modulo,
        COUNT(CASE WHEN course_id IS NOT NULL AND module_id IS NOT NULL THEN 1 END) as ambos,
        COUNT(CASE WHEN course_id IS NULL AND module_id IS NULL THEN 1 END) as nenhum
      FROM assessments
    `);

    const report = finalReport.rows[0];
    console.log('\n📊 Estatísticas:');
    console.log(`   Total de avaliações: ${report.total}`);
    console.log(`   Por curso (legado): ${report.por_curso}`);
    console.log(`   Por módulo (novo): ${report.por_modulo}`);
    console.log(`   Ambos (erro): ${report.ambos}`);
    console.log(`   Nenhum (erro): ${report.nenhum}`);

    if (parseInt(report.ambos) > 0 || parseInt(report.nenhum) > 0) {
      console.log('\n❌ AINDA EXISTEM PROBLEMAS!');
      await client.query('ROLLBACK');
      console.log('⚠️  Rollback executado - nenhuma mudança foi aplicada');
    } else {
      await client.query('COMMIT');
      console.log('\n✅ Limpeza concluída com sucesso!');
      console.log('✅ Todas as mudanças foram aplicadas');
    }

    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erro durante limpeza:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n⚠️  Rollback executado - nenhuma mudança foi aplicada');
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupInvalidAssessments();
