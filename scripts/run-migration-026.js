const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'plataforma_ead',
  user: 'user',
  password: 'password',
});

async function runMigration() {
  try {
    console.log('🚀 Executando migração 026: Add passing_score to assessments\n');
    console.log('='.repeat(70));

    const migrationPath = path.join(__dirname, 'migrations', '026_add_passing_score_to_assessments.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📄 SQL da migração:');
    console.log(sql);
    console.log('\n' + '='.repeat(70));

    console.log('\n⏳ Executando migração...');
    await pool.query(sql);

    console.log('✅ Migração executada com sucesso!');

    // Verificar se a coluna foi criada
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'assessments' AND column_name = 'passing_score'
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ Coluna passing_score criada:');
      console.log(`   Tipo: ${result.rows[0].data_type}`);
      console.log(`   Default: ${result.rows[0].column_default}`);
    }

    console.log('\n' + '='.repeat(70));
    await pool.end();
  } catch (error) {
    console.error('\n❌ Erro ao executar migração:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
