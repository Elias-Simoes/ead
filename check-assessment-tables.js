require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    console.log('🔍 Verificando estrutura das tabelas...\n');

    // Verificar colunas da tabela assessments
    console.log('1️⃣ Estrutura da tabela assessments:');
    const assessmentsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'assessments'
      ORDER BY ordinal_position
    `);
    
    assessmentsColumns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Verificar tabelas relacionadas a questões
    console.log('\n2️⃣ Tabelas relacionadas a questões:');
    const questionTables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%question%'
      ORDER BY table_name
    `);
    
    if (questionTables.rows.length === 0) {
      console.log('   ❌ Nenhuma tabela de questões encontrada!');
    } else {
      questionTables.rows.forEach(table => {
        console.log(`   ✅ ${table.table_name}`);
      });
    }

    // Verificar a última avaliação criada com detalhes
    console.log('\n3️⃣ Última avaliação criada (com todos os campos):');
    const lastAssessment = await pool.query(`
      SELECT *
      FROM assessments
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (lastAssessment.rows.length > 0) {
      console.log(JSON.stringify(lastAssessment.rows[0], null, 2));
    }

    // Verificar módulos e seus cursos
    console.log('\n4️⃣ Módulos e seus cursos:');
    const modules = await pool.query(`
      SELECT 
        m.id as module_id,
        m.title as module_title,
        m.course_id,
        c.title as course_title,
        c.instructor_id
      FROM modules m
      LEFT JOIN courses c ON m.course_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 5
    `);
    
    modules.rows.forEach(mod => {
      console.log(`   Módulo: ${mod.module_title} (ID: ${mod.module_id})`);
      console.log(`   Curso: ${mod.course_title || 'NULL'} (ID: ${mod.course_id || 'NULL'})`);
      console.log(`   Instrutor ID: ${mod.instructor_id || 'NULL'}`);
      console.log('   ---');
    });

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkTables();
