const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'plataforma_ead',
  user: 'user',
  password: 'password',
});

async function testPassingScoreFix() {
  try {
    console.log('🧪 Testando correção do passing_score\n');
    console.log('='.repeat(70));

    // 1. Verificar avaliações existentes
    console.log('\n📋 Avaliações existentes:');
    const existing = await pool.query(`
      SELECT a.id, a.title, a.passing_score, m.title as module_title
      FROM assessments a
      JOIN modules m ON a.module_id = m.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    existing.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.title}`);
      console.log(`   Módulo: ${row.module_title}`);
      console.log(`   Passing Score: ${row.passing_score}%`);
      console.log('');
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Teste concluído!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Reinicie o backend: npm run dev');
    console.log('2. Crie uma nova avaliação com 90% de nota mínima');
    console.log('3. Verifique se o valor 90% é salvo corretamente');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

testPassingScoreFix();
