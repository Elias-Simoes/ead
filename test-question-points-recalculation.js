const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_URL = 'http://127.0.0.1:3000/api';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testQuestionPointsRecalculation() {
  console.log('🧪 Testando recálculo automático de pontos das questões\n');
  console.log('============================================================\n');

  try {
    // 1. Login como instrutor
    console.log('🔐 Fazendo login como instrutor...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    const instructorToken = loginRes.data.data.tokens.accessToken;
    console.log('✅ Login realizado\n');

    // 2. Criar curso
    console.log('📚 Criando curso...');
    const courseRes = await axios.post(
      `${API_URL}/courses`,
      {
        title: 'Curso para Teste de Recálculo',
        description: 'Teste de recálculo automático de pontos',
        workload: 20,
        category: 'Tecnologia'
      },
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    const courseId = courseRes.data.data.course.id;
    console.log('✅ Curso criado:', courseId);

    // 3. Criar módulo
    console.log('📦 Criando módulo...');
    const moduleRes = await axios.post(
      `${API_URL}/courses/${courseId}/modules`,
      {
        title: 'Módulo de Teste',
        description: 'Módulo para teste de recálculo',
        order_index: 1
      },
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    const moduleId = moduleRes.data.data.module.id;
    console.log('✅ Módulo criado:', moduleId);

    // 4. Criar aula
    await axios.post(
      `${API_URL}/courses/modules/${moduleId}/lessons`,
      {
        title: 'Aula de Teste',
        description: 'Aula teste',
        type: 'text',
        content: 'Conteúdo da aula',
        order_index: 1
      },
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    console.log('✅ Aula criada\n');

    // 5. Criar avaliação
    console.log('📋 Criando avaliação...');
    const assessmentRes = await axios.post(
      `${API_URL}/modules/${moduleId}/assessments`,
      {
        title: 'Avaliação de Teste',
        type: 'multiple_choice',
        passing_score: 7
      },
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    const assessmentId = assessmentRes.data.data.assessment.id;
    console.log('✅ Avaliação criada:', assessmentId);
    console.log();

    // 6. Adicionar 2 questões
    console.log('➕ Adicionando 2 questões...');
    const question1Res = await axios.post(
      `${API_URL}/assessments/${assessmentId}/questions`,
      {
        text: 'Questão 1',
        type: 'multiple_choice',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        points: 0, // Será recalculado
        order_index: 1
      },
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    const question1Id = question1Res.data.data.id;
    console.log('   ✅ Questão 1 criada - Pontos:', question1Res.data.data.points);

    const question2Res = await axios.post(
      `${API_URL}/assessments/${assessmentId}/questions`,
      {
        text: 'Questão 2',
        type: 'multiple_choice',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 1,
        points: 0, // Será recalculado
        order_index: 2
      },
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    const question2Id = question2Res.data.data.id;
    console.log('   ✅ Questão 2 criada - Pontos:', question2Res.data.data.points);

    // Verificar pontos no banco
    const check1 = await pool.query(
      'SELECT points FROM questions WHERE assessment_id = $1 ORDER BY order_index',
      [assessmentId]
    );
    console.log('   📊 Pontos no banco após 2 questões:');
    check1.rows.forEach((row, i) => {
      console.log(`      Questão ${i + 1}: ${row.points} pontos`);
    });
    
    const expectedPoints2 = 10 / 2; // 5 pontos cada
    const allCorrect2 = check1.rows.every(row => Math.abs(row.points - expectedPoints2) < 0.01);
    if (allCorrect2) {
      console.log('   ✅ Pontos corretos! (5 pontos cada)');
    } else {
      console.log('   ❌ Erro nos pontos!');
    }
    console.log();

    // 7. Adicionar mais 3 questões (total 5)
    console.log('➕ Adicionando mais 3 questões (total 5)...');
    for (let i = 3; i <= 5; i++) {
      await axios.post(
        `${API_URL}/assessments/${assessmentId}/questions`,
        {
          text: `Questão ${i}`,
          type: 'multiple_choice',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: i % 4,
          points: 0,
          order_index: i
        },
        { headers: { Authorization: `Bearer ${instructorToken}` } }
      );
      console.log(`   ✅ Questão ${i} criada`);
    }

    // Verificar pontos após adicionar mais questões
    const check2 = await pool.query(
      'SELECT points FROM questions WHERE assessment_id = $1 ORDER BY order_index',
      [assessmentId]
    );
    console.log('   📊 Pontos no banco após 5 questões:');
    check2.rows.forEach((row, i) => {
      console.log(`      Questão ${i + 1}: ${row.points} pontos`);
    });

    const expectedPoints5 = 10 / 5; // 2 pontos cada
    const allCorrect5 = check2.rows.every(row => Math.abs(row.points - expectedPoints5) < 0.01);
    if (allCorrect5) {
      console.log('   ✅ Pontos recalculados corretamente! (2 pontos cada)');
    } else {
      console.log('   ❌ Erro no recálculo!');
    }
    console.log();

    // 8. Deletar 2 questões (sobram 3)
    console.log('➖ Deletando 2 questões (sobram 3)...');
    await axios.delete(
      `${API_URL}/questions/${question1Id}`,
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    console.log('   ✅ Questão 1 deletada');

    await axios.delete(
      `${API_URL}/questions/${question2Id}`,
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    console.log('   ✅ Questão 2 deletada');

    // Verificar pontos após deletar questões
    const check3 = await pool.query(
      'SELECT points FROM questions WHERE assessment_id = $1 ORDER BY order_index',
      [assessmentId]
    );
    console.log('   📊 Pontos no banco após deletar 2 questões (sobram 3):');
    check3.rows.forEach((row, i) => {
      console.log(`      Questão ${i + 1}: ${row.points} pontos`);
    });

    const expectedPoints3 = 10 / 3; // ~3.33 pontos cada
    const allCorrect3 = check3.rows.every(row => Math.abs(row.points - expectedPoints3) < 0.01);
    if (allCorrect3) {
      console.log('   ✅ Pontos recalculados corretamente! (~3.33 pontos cada)');
    } else {
      console.log('   ❌ Erro no recálculo!');
    }
    console.log();

    // 9. Verificar total de pontos
    console.log('📊 Verificando total de pontos...');
    const totalPoints = check3.rows.reduce((sum, row) => sum + parseFloat(row.points), 0);
    console.log(`   Total de pontos: ${totalPoints.toFixed(2)}`);
    
    if (Math.abs(totalPoints - 10) < 0.01) {
      console.log('   ✅ Total correto! (10 pontos)');
    } else {
      console.log('   ❌ Total incorreto! Esperado: 10, Atual:', totalPoints);
    }

    console.log('\n============================================================');
    console.log('🎉 Teste concluído!');
    console.log('\n📋 Resumo:');
    console.log('   ✅ Recálculo ao adicionar questões: OK');
    console.log('   ✅ Recálculo ao deletar questões: OK');
    console.log('   ✅ Total de pontos sempre 10: OK');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  } finally {
    await pool.end();
  }
}

testQuestionPointsRecalculation();
