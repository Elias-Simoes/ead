const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela assessments...\n');
    
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'assessments'
      ORDER BY ordinal_position;
    `);
    
    console.log('Colunas da tabela assessments:');
    console.table(result.rows);
    
    // Verificar constraints
    const constraints = await pool.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type
      FROM pg_constraint 
      WHERE conrelid = 'assessments'::regclass;
    `);
    
    console.log('\nConstraints:');
    console.table(constraints.rows);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

checkTable();
