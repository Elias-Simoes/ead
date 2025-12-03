require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixFirstQuestion() {
  try {
    console.log('🔧 Corrigindo resposta correta da primeira questão...\n');

    // Buscar a questão com correct_answer null
    const questionResult = await pool.query(`
      SELECT id, text, options
      FROM questions
      WHERE text LIKE '%Teste de criação%'
      AND correct_answer IS NULL
      LIMIT 1
    `);

    if (questionResult.rows.length === 0) {
      console.log('❌ Questão não encontrada ou já corrigida');
      return;
    }

    const question = questionResult.rows[0];
    console.log('📝 Questão encontrada:');
    console.log('ID:', question.id);
    console.log('Texto:', question.text);
    console.log('Opções:', question.options);

    // Perguntar qual é a resposta correta
    console.log('\n🎯 Qual é a resposta correta?');
    question.options.forEach((opt, idx) => {
      console.log(`   ${idx}: "${opt}"`);
    });

    // Vamos assumir que a primeira opção "sim" é a correta (índice 0)
    const correctAnswer = 0;

    console.log(`\n✅ Definindo resposta correta como índice ${correctAnswer}: "${question.options[correctAnswer]}"`);

    // Atualizar a questão
    await pool.query(
      'UPDATE questions SET correct_answer = $1 WHERE id = $2',
      [correctAnswer, question.id]
    );

    console.log('\n✅ Questão corrigida com sucesso!');

    // Verificar a correção
    const verifyResult = await pool.query(
      'SELECT id, text, correct_answer FROM questions WHERE id = $1',
      [question.id]
    );

    console.log('\n🔍 Verificação:');
    console.log('correct_answer agora é:', verifyResult.rows[0].correct_answer);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixFirstQuestion();
