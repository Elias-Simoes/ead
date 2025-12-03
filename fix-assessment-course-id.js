require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixAssessmentCourseIds() {
  try {
    console.log('🔧 Corrigindo course_id das avaliações...\n');

    // 1. Buscar avaliações com course_id NULL
    const assessmentsResult = await pool.query(`
      SELECT 
        a.id as assessment_id,
        a.title,
        a.module_id,
        m.course_id,
        m.title as module_title,
        c.title as course_title
      FROM assessments a
      JOIN modules m ON a.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE a.course_id IS NULL
    `);

    if (assessmentsResult.rows.length === 0) {
      console.log('✅ Todas as avaliações já têm course_id definido!\n');
      return;
    }

    console.log(`📋 Encontradas ${assessmentsResult.rows.length} avaliação(ões) para corrigir:\n`);
    
    assessmentsResult.rows.forEach(row => {
      console.log(`   Avaliação: ${row.title}`);
      console.log(`   Módulo: ${row.module_title}`);
      console.log(`   Curso: ${row.course_title}`);
      console.log(`   Course ID a ser definido: ${row.course_id}`);
      console.log('   ---');
    });

    // 2. Atualizar cada avaliação
    console.log('\n🔄 Atualizando avaliações...\n');
    
    for (const row of assessmentsResult.rows) {
      await pool.query(
        'UPDATE assessments SET course_id = $1 WHERE id = $2',
        [row.course_id, row.assessment_id]
      );
      
      console.log(`✅ Avaliação "${row.title}" atualizada com course_id: ${row.course_id}`);
    }

    // 3. Verificar resultado
    console.log('\n📊 Verificando resultado...\n');
    
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM assessments
      WHERE course_id IS NULL
    `);

    const remainingNull = parseInt(verifyResult.rows[0].count);
    
    if (remainingNull === 0) {
      console.log('✅ Todas as avaliações foram corrigidas com sucesso!');
    } else {
      console.log(`⚠️  Ainda existem ${remainingNull} avaliação(ões) com course_id NULL`);
    }

  } catch (error) {
    console.error('❌ Erro ao corrigir avaliações:', error);
  } finally {
    await pool.end();
  }
}

fixAssessmentCourseIds();
