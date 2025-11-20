const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function findLessons() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT id, title, description, text_content IS NOT NULL as has_text_content
       FROM lessons 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    console.log('📚 Aulas encontradas:');
    console.log('='.repeat(80));
    
    result.rows.forEach((lesson, index) => {
      console.log(`\n${index + 1}. ${lesson.title}`);
      console.log(`   ID: ${lesson.id}`);
      console.log(`   Descrição: ${lesson.description || 'N/A'}`);
      console.log(`   Tem conteúdo: ${lesson.has_text_content ? 'SIM' : 'NÃO'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

findLessons();
