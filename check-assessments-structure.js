const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'plataforma_ead',
  user: 'user',
  password: 'password',
});

async function checkStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela assessments\n');
    console.log('='.repeat(70));

    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'assessments'
      ORDER BY ordinal_position
    `);

    console.log(`\n✅ Colunas da tabela assessments:\n`);
    
    result.rows.forEach((row) => {
      console.log(`- ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      if (row.column_default) {
        console.log(`  Default: ${row.column_default}`);
      }
    });

    console.log('\n' + '='.repeat(70));
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

checkStructure();
