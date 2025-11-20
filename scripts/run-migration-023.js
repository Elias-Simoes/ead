const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    const migrationPath = path.join(__dirname, 'migrations', '023_add_multiple_content_to_lessons.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Executando migração 023...');
    await client.query(sql);
    console.log('✅ Migração 023 executada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
