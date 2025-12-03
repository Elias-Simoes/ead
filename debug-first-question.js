require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugFirstQuestion() {
  try {
    console.log('🔍 Verificando dados da primeira questão...\n');

    // Buscar a primeira questão da avaliação
    const questionsResult = await pool.query(`
      SELECT 
        q.id,
        q.assessment_id,
        q.text,
        q.type,
        q.options,
        q.correct_answer,
        q.points,
        q.order_index,
        a.title as assessment_title
      FROM questions q
      JOIN assessments a ON q.assessment_id = a.id
      ORDER BY q.created_at ASC
      LIMIT 2
    `);

    if (questionsResult.rows.length === 0) {
      console.log('❌ Nenhuma questão encontrada');
      return;
    }

    console.log(`✅ Encontradas ${questionsResult.rows.length} questões\n`);

    questionsResult.rows.forEach((question, index) => {
      console.log(`\n📝 Questão ${index + 1}:`);
      console.log('ID:', question.id);
      console.log('Avaliação:', question.assessment_title);
      console.log('Texto:', question.text);
      console.log('Tipo:', question.type);
      console.log('Opções:', JSON.stringify(question.options, null, 2));
      console.log('Resposta Correta (correct_answer):', question.correct_answer);
      console.log('Pontos:', question.points);
      console.log('Ordem:', question.order_index);
      console.log('---');

      // Verificar se correct_answer é válido
      if (question.options && Array.isArray(question.options)) {
        const correctIndex = question.correct_answer;
        console.log(`\n🎯 Análise da resposta correta:`);
        console.log(`   Índice da resposta correta: ${correctIndex}`);
        console.log(`   Total de opções: ${question.options.length}`);
        
        if (correctIndex >= 0 && correctIndex < question.options.length) {
          console.log(`   ✅ Resposta correta válida: "${question.options[correctIndex]}"`);
        } else {
          console.log(`   ❌ ERRO: Índice ${correctIndex} está fora do range (0-${question.options.length - 1})`);
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

debugFirstQuestion();
