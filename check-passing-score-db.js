const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'plataforma_ead',
  user: 'user',
  password: 'password',
});

async function checkPassingScore() {
  try {
    console.log('🔍 Verificando passing_score no banco de dados\n');
    console.log('='.repeat(70));

    const result = await pool.query(`
      SELECT id, title, passing_score, module_id
      FROM assessments
      LIMIT 5
    `);

    console.log(`\n✅ ${result.rows.length} avaliações encontradas:\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.title}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Module ID: ${row.module_id}`);
      console.log(`   Passing Score: ${row.passing_score}`);
      console.log('');
    });

    console.log('='.repeat(70));
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

checkPassingScore();
