require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function debugCorrectAnswerIssue() {
  try {
    console.log('🔍 DIAGNÓSTICO: Resposta Correta - Backend vs Frontend\n');
    console.log('=' .repeat(60));

    // 1. Verificar estrutura da tabela
    console.log('\n1️⃣ ESTRUTURA DA TABELA questions:');
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'questions'
      ORDER BY ordinal_position;
    `);
    console.table(tableStructure.rows);

    // 2. Buscar todas as questões com suas opções
    console.log('\n2️⃣ QUESTÕES E OPÇÕES NO BANCO DE DADOS:');
    const questions = await pool.query(`
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
      JOIN assessments a ON a.id = q.assessment_id
      ORDER BY q.assessment_id, q.order_index;
    `);

    if (questions.rows.length === 0) {
      console.log('❌ Nenhuma questão encontrada no banco de dados');
    } else {
      questions.rows.forEach((q, index) => {
        console.log(`\n--- Questão ${index + 1} ---`);
        console.log(`ID: ${q.id}`);
        console.log(`Avaliação: ${q.assessment_title} (ID: ${q.assessment_id})`);
        console.log(`Tipo: ${q.type}`);
        console.log(`Texto: ${q.text}`);
        console.log(`Ordem: ${q.order_index}`);
        console.log(`Pontos: ${q.points}`);
        console.log(`\nOPÇÕES (tipo: ${typeof q.options}):`);
        
        if (typeof q.options === 'string') {
          console.log('⚠️  PROBLEMA: options está como STRING, deveria ser ARRAY');
          console.log(`Valor: ${q.options}`);
          try {
            const parsed = JSON.parse(q.options);
            console.log('Parsed:', parsed);
          } catch (e) {
            console.log('Erro ao fazer parse:', e.message);
          }
        } else if (Array.isArray(q.options)) {
          console.log('✅ options é um ARRAY');
          q.options.forEach((opt, i) => {
            console.log(`  ${i}: ${opt}`);
          });
        } else {
          console.log('❓ Tipo inesperado:', q.options);
        }

        console.log(`\nRESPOSTA CORRETA (tipo: ${typeof q.correct_answer}):`);
        if (q.correct_answer === null || q.correct_answer === undefined) {
          console.log('❌ NULL ou UNDEFINED');
        } else if (typeof q.correct_answer === 'string') {
          console.log(`✅ STRING: "${q.correct_answer}"`);
        } else if (typeof q.correct_answer === 'number') {
          console.log(`✅ NUMBER: ${q.correct_answer}`);
        } else {
          console.log(`❓ Tipo inesperado: ${q.correct_answer}`);
        }
      });
    }

    // 3. Simular o que a API retorna
    console.log('\n3️⃣ SIMULAÇÃO DA RESPOSTA DA API:');
    if (questions.rows.length > 0) {
      const sampleQuestion = questions.rows[0];
      const apiResponse = {
        id: sampleQuestion.id,
        assessmentId: sampleQuestion.assessment_id,
        text: sampleQuestion.text,
        type: sampleQuestion.type,
        options: sampleQuestion.options,
        correctAnswer: sampleQuestion.correct_answer,
        points: sampleQuestion.points,
        orderIndex: sampleQuestion.order_index
      };
      console.log('Exemplo de questão como seria retornada pela API:');
      console.log(JSON.stringify(apiResponse, null, 2));
    }

    // 4. Verificar se há alguma avaliação específica
    console.log('\n4️⃣ RESUMO POR AVALIAÇÃO:');
    const summary = await pool.query(`
      SELECT 
        a.id,
        a.title,
        COUNT(q.id) as total_questions,
        COUNT(q.correct_answer) as questions_with_answer,
        COUNT(q.id) - COUNT(q.correct_answer) as questions_without_answer
      FROM assessments a
      LEFT JOIN questions q ON q.assessment_id = a.id
      GROUP BY a.id, a.title
      ORDER BY a.id;
    `);
    console.table(summary.rows);

    // 5. Verificar questões sem resposta correta
    console.log('\n5️⃣ QUESTÕES SEM RESPOSTA CORRETA:');
    const noAnswer = await pool.query(`
      SELECT 
        q.id,
        a.title as assessment_title,
        q.text,
        q.correct_answer
      FROM questions q
      JOIN assessments a ON a.id = q.assessment_id
      WHERE q.correct_answer IS NULL;
    `);
    
    if (noAnswer.rows.length === 0) {
      console.log('✅ Todas as questões têm resposta correta definida');
    } else {
      console.log(`❌ ${noAnswer.rows.length} questão(ões) sem resposta correta:`);
      console.table(noAnswer.rows);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 CONCLUSÃO:');
    console.log('Verifique os pontos acima para identificar:');
    console.log('1. Se correct_answer está NULL no banco (problema de backend)');
    console.log('2. Se correct_answer tem valor mas tipo errado (problema de backend)');
    console.log('3. Se os dados estão corretos no banco (problema de frontend)');
    console.log('\nPróximo passo: Testar a API diretamente para ver o que ela retorna');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

debugCorrectAnswerIssue();
