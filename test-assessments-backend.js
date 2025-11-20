require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

const API_URL = 'http://localhost:3000/api';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testAssessmentsBackend() {
  let assessmentId, questionId;
  
  try {
    console.log('=== TESTE BACKEND DE AVALIAÇÕES ===\n');

    // 1. Login como instrutor
    console.log('1. Fazendo login como instrutor...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    const token = loginRes.data.data.tokens.accessToken;
    console.log('✅ Login realizado\n');

    // 2. Pegar um curso do instrutor
    console.log('2. Buscando cursos do instrutor...');
    const coursesRes = await axios.get(`${API_URL}/instructor/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (coursesRes.data.data.courses.length === 0) {
      console.log('❌ Instrutor não tem cursos. Crie um curso primeiro.');
      return;
    }
    
    const courseId = coursesRes.data.data.courses[0].id;
    console.log(`✅ Curso encontrado: ${courseId}\n`);

    // 3. Criar avaliação
    console.log('3. Criando avaliação...');
    const createAssessmentRes = await axios.post(
      `${API_URL}/courses/${courseId}/assessments`,
      {
        title: 'Avaliação de Teste - Backend',
        type: 'multiple_choice',
        passing_score: 70
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    assessmentId = createAssessmentRes.data.data.id;
    console.log('✅ Avaliação criada:', assessmentId);
    console.log('   Título:', createAssessmentRes.data.data.title);
    console.log('   Tipo:', createAssessmentRes.data.data.type);
    console.log('   Nota de corte:', createAssessmentRes.data.data.passing_score, '%\n');

    // 4. Adicionar questão 1
    console.log('4. Adicionando questão 1...');
    const question1Res = await axios.post(
      `${API_URL}/assessments/${assessmentId}/questions`,
      {
        text: 'Qual é a capital do Brasil?',
        type: 'multiple_choice',
        options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'],
        correct_answer: 2, // Brasília (índice 2)
        points: 10,
        order_index: 1
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    questionId = question1Res.data.data.id;
    console.log('✅ Questão 1 criada:', questionId);
    console.log('   Texto:', question1Res.data.data.text);
    console.log('   Opções:', question1Res.data.data.options);
    console.log('   Resposta correta (índice):', question1Res.data.data.correct_answer);
    console.log('   Pontos:', question1Res.data.data.points, '\n');

    // 5. Adicionar questão 2
    console.log('5. Adicionando questão 2...');
    const question2Res = await axios.post(
      `${API_URL}/assessments/${assessmentId}/questions`,
      {
        text: 'Quanto é 2 + 2?',
        type: 'multiple_choice',
        options: ['3', '4', '5', '6'],
        correct_answer: 1, // 4 (índice 1)
        points: 10,
        order_index: 2
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Questão 2 criada:', question2Res.data.data.id);
    console.log('   Texto:', question2Res.data.data.text);
    console.log('   Resposta correta (índice):', question2Res.data.data.correct_answer, '\n');

    // 6. Atualizar questão
    console.log('6. Atualizando questão 1...');
    const updateQuestionRes = await axios.patch(
      `${API_URL}/questions/${questionId}`,
      {
        points: 15, // Aumentar pontos de 10 para 15
        text: 'Qual é a capital do Brasil? (Atualizada)'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Questão atualizada');
    console.log('   Novo texto:', updateQuestionRes.data.data.text);
    console.log('   Novos pontos:', updateQuestionRes.data.data.points, '\n');

    // 7. Verificar no banco de dados
    console.log('7. Verificando dados no banco...');
    
    const assessmentResult = await pool.query(
      'SELECT * FROM assessments WHERE id = $1',
      [assessmentId]
    );
    
    console.log('\n📊 Avaliação no banco:');
    console.log('   ID:', assessmentResult.rows[0].id);
    console.log('   Título:', assessmentResult.rows[0].title);
    console.log('   Tipo:', assessmentResult.rows[0].type);
    console.log('   Nota de corte:', assessmentResult.rows[0].passing_score, '%');
    
    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE assessment_id = $1 ORDER BY order_index',
      [assessmentId]
    );
    
    console.log('\n📝 Questões no banco:');
    console.log('   Total:', questionsResult.rows.length);
    questionsResult.rows.forEach((q, index) => {
      console.log(`\n   Questão ${index + 1}:`);
      console.log('     Texto:', q.text);
      console.log('     Opções:', q.options);
      console.log('     Resposta correta:', q.correct_answer);
      console.log('     Pontos:', q.points);
    });

    // 8. Deletar uma questão
    console.log('\n8. Deletando questão 2...');
    await axios.delete(
      `${API_URL}/questions/${question2Res.data.data.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Questão deletada\n');

    // 9. Verificar questões restantes
    const remainingQuestions = await pool.query(
      'SELECT COUNT(*) FROM questions WHERE assessment_id = $1',
      [assessmentId]
    );
    console.log('9. Questões restantes:', remainingQuestions.rows[0].count);

    console.log('\n✅ TODOS OS TESTES PASSARAM!');
    console.log('\n📝 Resumo:');
    console.log('   ✅ Criação de avaliação');
    console.log('   ✅ Adição de questões de múltipla escolha');
    console.log('   ✅ Marcação de resposta correta');
    console.log('   ✅ Definição de nota de corte');
    console.log('   ✅ Atualização de questão');
    console.log('   ✅ Deleção de questão');
    console.log('   ✅ Persistência no banco de dados');

  } catch (error) {
    console.error('\n❌ ERRO:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await pool.end();
  }
}

testAssessmentsBackend();
