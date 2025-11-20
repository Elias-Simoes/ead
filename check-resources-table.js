const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTable() {
  const client = await pool.connect();
  
  try {
    // Verificar se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'lesson_resources'
      );
    `);
    
    console.log('📋 Tabela lesson_resources existe:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Ver estrutura da tabela
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'lesson_resources'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📊 Estrutura da tabela:');
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
      // Contar registros
      const count = await client.query('SELECT COUNT(*) FROM lesson_resources');
      console.log(`\n📈 Total de registros: ${count.rows[0].count}`);
      
      // Mostrar últimos registros se houver
      if (parseInt(count.rows[0].count) > 0) {
        const recent = await client.query(`
          SELECT * FROM lesson_resources 
          ORDER BY created_at DESC 
          LIMIT 5
        `);
        
        console.log('\n📝 Últimos registros:');
        recent.rows.forEach((row, i) => {
          console.log(`\n${i + 1}. ${row.title} (${row.type})`);
          console.log(`   Lesson ID: ${row.lesson_id}`);
          console.log(`   File Key: ${row.file_key || 'N/A'}`);
          console.log(`   URL: ${row.url || 'N/A'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable();
