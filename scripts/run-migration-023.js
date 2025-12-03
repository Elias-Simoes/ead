const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'plataforma_ead',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  try {
    console.log('🔄 Conectando ao banco de dados...');
    const client = await pool.connect();
    
    console.log('📖 Lendo arquivo de migration...');
    const migrationPath = path.join(__dirname, 'migrations', '023_assessments_per_module.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Executando migration 023...\n');
    
    // Executar migration
    await client.query(migrationSQL);
    
    console.log('\n✅ Migration 023 executada com sucesso!');
    
    // Mostrar estatísticas
    console.log('\n📊 Estatísticas após migration:');
    const stats = await client.query(`
      SELECT 
        'assessments' as tabela,
        COUNT(*) as total_registros,
        COUNT(module_id) as com_module_id,
        COUNT(*) - COUNT(module_id) as sem_module_id
      FROM assessments
      UNION ALL
      SELECT 
        'student_assessments' as tabela,
        COUNT(*) as total_registros,
        COUNT(CASE WHEN is_latest THEN 1 END) as ultimas_tentativas,
        COUNT(CASE WHEN NOT is_latest THEN 1 END) as tentativas_antigas
      FROM student_assessments
      UNION ALL
      SELECT 
        'courses' as tabela,
        COUNT(*) as total_registros,
        COUNT(passing_score) as com_nota_corte,
        COUNT(*) - COUNT(passing_score) as sem_nota_corte
      FROM courses
    `);
    
    console.table(stats.rows);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
