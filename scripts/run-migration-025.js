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
    const migrationPath = path.join(__dirname, 'migrations', '025_make_type_content_nullable.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Executando migração 025...');
    await client.query(sql);
    console.log('✅ Migração 025 executada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
