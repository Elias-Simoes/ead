require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function debugQuestion() {
  try {
    console.log('=== DEBUG: VERIFICANDO QUESTÃO NO BANCO ===\n');

    // Buscar a questão específica
    const result = await pool.query(
      `SELECT id, text, options, correct_answer, points 
       FROM questions 
       WHERE text LIKE '%capital do Brasil%'
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      console.log('❌ Questão não encontrada');
      return;
    }

    const question = result.rows[0];
    console.log('📊 Dados da Questão no Banco:');
    console.log('ID:', question.id);
    console.log('Texto:', question.text);
    console.log('Opções:', question.options);
    console.log('Resposta Correta (índice):', question.correct_answer);
    console.log('\n🔍 Análise:');
    
    if (Array.isArray(question.options)) {
      question.options.forEach((opt, index) => {
        const isCorrect = index === question.correct_answer;
        console.log(`  ${index}. ${opt} ${isCorrect ? '✓ CORRETA' : ''}`);
      });
    }

    console.log('\n💡 Resposta correta é:', question.options[question.correct_answer]);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

debugQuestion();
