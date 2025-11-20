require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTables() {
  try {
    console.log('🔍 Verificando tabelas relacionadas a assessments...\n');

    // Listar todas as tabelas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%assess%'
      ORDER BY table_name;
    `);

    console.log('Tabelas encontradas:');
    console.table(tables.rows);

    // Verificar também tabelas com 'question'
    const questionTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%question%'
      ORDER BY table_name;
    `);

    console.log('\nTabelas com "question":');
    console.table(questionTables.rows);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
