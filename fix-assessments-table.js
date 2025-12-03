const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Ajustando tabela assessments...\n');
    
    await client.query('BEGIN');
    
    // 1. Tornar course_id opcional
    console.log('1. Tornando course_id opcional...');
    await client.query(`
      ALTER TABLE assessments 
      ALTER COLUMN course_id DROP NOT NULL;
    `);
    console.log('✅ course_id agora é opcional\n');
    
    // 2. Adicionar check constraint: deve ter course_id OU module_id
    console.log('2. Adicionando constraint de validação...');
    await client.query(`
      ALTER TABLE assessments 
      ADD CONSTRAINT assessments_course_or_module_check 
      CHECK (
        (course_id IS NOT NULL AND module_id IS NULL) OR 
        (course_id IS NULL AND module_id IS NOT NULL)
      );
    `);
    console.log('✅ Constraint adicionada: deve ter course_id OU module_id\n');
    
    await client.query('COMMIT');
    
    console.log('✅ Tabela assessments ajustada com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixTable();
