require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugSpecificQuestions() {
  try {
    console.log('🔍 Buscando questões específicas...\n');

    // Buscar a questão "Teste de criação de questão"
    const question1 = await pool.query(`
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
      WHERE q.text LIKE '%Teste de criação%'
      ORDER BY q.created_at DESC
      LIMIT 1
    `);

    // Buscar a questão "tttetwqefasdf"
    const question2 = await pool.query(`
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
      WHERE q.text LIKE '%tttetwqefasdf%'
      ORDER BY q.created_at DESC
      LIMIT 1
    `);

    console.log('📝 QUESTÃO 1: "Teste de criação de questão"\n');
    if (question1.rows.length > 0) {
      const q = question1.rows[0];
      console.log('ID:', q.id);
      console.log('Avaliação:', q.assessment_title);
      console.log('Texto:', q.text);
      console.log('Tipo:', q.type);
      console.log('Opções:', JSON.stringify(q.options, null, 2));
      console.log('Resposta Correta (correct_answer):', q.correct_answer);
      console.log('Tipo do correct_answer:', typeof q.correct_answer);
      console.log('Pontos:', q.points);
      console.log('Ordem:', q.order_index);

      if (q.options && Array.isArray(q.options)) {
        console.log(`\n🎯 Análise:`);
        console.log(`   Total de opções: ${q.options.length}`);
        q.options.forEach((opt, idx) => {
          const isCorrect = idx === q.correct_answer;
          console.log(`   ${idx}: "${opt}" ${isCorrect ? '✓ CORRETA' : ''}`);
        });
      }
    } else {
      console.log('❌ Questão não encontrada');
    }

    console.log('\n\n📝 QUESTÃO 2: "tttetwqefasdf sdfsdf w"\n');
    if (question2.rows.length > 0) {
      const q = question2.rows[0];
      console.log('ID:', q.id);
      console.log('Avaliação:', q.assessment_title);
      console.log('Texto:', q.text);
      console.log('Tipo:', q.type);
      console.log('Opções:', JSON.stringify(q.options, null, 2));
      console.log('Resposta Correta (correct_answer):', q.correct_answer);
      console.log('Tipo do correct_answer:', typeof q.correct_answer);
      console.log('Pontos:', q.points);
      console.log('Ordem:', q.order_index);

      if (q.options && Array.isArray(q.options)) {
        console.log(`\n🎯 Análise:`);
        console.log(`   Total de opções: ${q.options.length}`);
        q.options.forEach((opt, idx) => {
          const isCorrect = idx === q.correct_answer;
          console.log(`   ${idx}: "${opt}" ${isCorrect ? '✓ CORRETA' : ''}`);
        });
      }
    } else {
      console.log('❌ Questão não encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

debugSpecificQuestions();
