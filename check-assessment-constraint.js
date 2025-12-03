require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkConstraint() {
  try {
    console.log('🔍 Verificando constraints da tabela assessments...\n');

    const result = await pool.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'assessments'::regclass
      ORDER BY conname
    `);

    console.log('📋 Constraints encontradas:\n');
    result.rows.forEach(row => {
      console.log(`   ${row.constraint_name}:`);
      console.log(`   ${row.constraint_definition}\n`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkConstraint();
