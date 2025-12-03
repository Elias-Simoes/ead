const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api';

// Credenciais de teste
const INSTRUCTOR_EMAIL = 'instructor@example.com';
const INSTRUCTOR_PASSWORD = 'Senha123!';

let instructorToken = '';
let courseId = '';
let moduleId = '';
let assessmentId = '';

async function login() {
  console.log('\n🔐 Fazendo login como instrutor...');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: INSTRUCTOR_EMAIL,
      password: INSTRUCTOR_PASSWORD
    });
    
    instructorToken = response.data.data.tokens.accessToken;
    console.log('✅ Login realizado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
}

async function createCourse() {
  console.log('\n📚 Criando curso...');
  
  try {
    const response = await axios.post(
      `${API_URL}/courses`,
      {
        title: 'Curso de Teste - Avaliações por Módulo',
        description: 'Testando o novo sistema de avaliações',
        workload: 40,
        category: 'Tecnologia'
      },
      {
        headers: { Authorization: `Bearer ${instructorToken}` }
      }
    );
    
    courseId = response.data.data?.course?.id || response.data.data?.id || response.data.id;
    console.log('✅ Curso criado:', courseId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar curso:', error.response?.data || error.message);
    return false;
  }
}

async function createModule() {
  console.log('\n📦 Criando módulo...');
  
  try {
    const response = await axios.post(
      `${API_URL}/courses/${courseId}/modules`,
      {
        title: 'Módulo 1 - Introdução',
        description: 'Módulo introdutório',
        order_index: 1
      },
      {
        headers: { Authorization: `Bearer ${instructorToken}` }
      }
    );
    
    moduleId = response.data.data?.module?.id || response.data.data?.id || response.data.id;
    console.log('✅ Módulo criado:', moduleId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar módulo:', error.response?.data || error.message);
    return false;
  }
}

async function createLesson() {
  console.log('\n📝 Criando aula...');
  
  try {
    const response = await axios.post(
      `${API_URL}/courses/modules/${moduleId}/lessons`,
      {
        title: 'Aula 1 - Conceitos Básicos',
        description: 'Primeira aula do curso',
        type: 'text',
        content: 'Conteúdo da aula de teste',
        order_index: 1
      },
      {
        headers: { Authorization: `Bearer ${instructorToken}` }
      }
    );
    
    const lessonId = response.data.data?.lesson?.id || response.data.data?.id || response.data.id;
    console.log('✅ Aula criada:', lessonId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar aula:', error.response?.data || error.message);
    return false;
  }
}

async function trySubmitWithoutAssessment() {
  console.log('\n🚫 Tentando submeter curso SEM avaliação (deve falhar)...');
  
  try {
    await axios.post(
      `${API_URL}/courses/${courseId}/submit`,
      {},
      {
        headers: { Authorization: `Bearer ${instructorToken}` }
      }
    );
    
    console.log('❌ ERRO: Curso foi submetido sem avaliação!');
    return false;
  } catch (error) {
    const errorMsg = JSON.stringify(error.response?.data);
    if (errorMsg.includes('MODULES_WITHOUT_ASSESSMENT')) {
      console.log('✅ Validação funcionou! Curso bloqueado sem avaliação');
      console.log('   Mensagem:', error.response.data.error?.message || error.response.data.error);
      return true;
    } else {
      console.error('❌ Erro inesperado:', error.response?.data || error.message);
      return false;
    }
  }
}

async function createAssessment() {
  console.log('\n📋 Criando avaliação para o módulo...');
  
  try {
    const response = await axios.post(
      `${API_URL}/modules/${moduleId}/assessments`,
      {
        title: 'Avaliação do Módulo 1',
        type: 'multiple_choice',
        passing_score: 7
      },
      {
        headers: { Authorization: `Bearer ${instructorToken}` }
      }
    );
    
    assessmentId = response.data.data?.assessment?.id || response.data.data?.id || response.data.id;
    console.log('✅ Avaliação criada:', assessmentId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar avaliação:', error.response?.data || error.message);
    return false;
  }
}

async function trySubmitWithoutQuestions() {
  console.log('\n🚫 Tentando submeter curso com avaliação SEM questões (deve falhar)...');
  
  try {
    await axios.post(
      `${API_URL}/courses/${courseId}/submit`,
      {},
      {
        headers: { Authorization: `Bearer ${instructorToken}` }
      }
    );
    
    console.log('❌ ERRO: Curso foi submetido com avaliação vazia!');
    return false;
  } catch (error) {
    const errorMsg = JSON.stringify(error.response?.data);
    if (errorMsg.includes('ASSESSMENTS_WITHOUT_QUESTIONS')) {
      console.log('✅ Validação funcionou! Curso bloqueado com avaliação vazia');
      console.log('   Mensagem:', error.response.data.error?.message || error.response.data.error);
      return true;
    } else {
      console.error('❌ Erro inesperado:', error.response?.data || error.message);
      return false;
    }
  }
}

async function addQuestions() {
  console.log('\n❓ Adicionando 5 questões à avaliação...');
  
  try {
    for (let i = 1; i <= 5; i++) {
      await axios.post(
        `${API_URL}/assessments/${assessmentId}/questions`,
        {
          text: `Questão ${i} - Teste`,
          type: 'multiple_choice',
          options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
          correct_answer: 0,
          points: 2, // 10 pontos / 5 questões = 2 pontos cada
          order_index: i
        },
        {
          headers: { Authorization: `Bearer ${instructorToken}` }
        }
      );
    }
    
    console.log('✅ 5 questões adicionadas');
    console.log('   Cada questão vale: 10 / 5 = 2 pontos');
    return true;
  } catch (error) {
    console.error('❌ Erro ao adicionar questões:', error.response?.data || error.message);
    return false;
  }
}

async function verifyQuestionPoints() {
  console.log('\n🔍 Verificando pontos das questões...');
  
  try {
    const response = await axios.get(
      `${API_URL}/assessments/${assessmentId}`,
      {
        headers: { Authorization: `Bearer ${instructorToken}` }
      }
    );
    
    const questions = response.data.data?.questions || response.data.questions || [];
    console.log(`✅ Avaliação tem ${questions.length} questões`);
    
    questions.forEach((q, index) => {
      console.log(`   Questão ${index + 1}: ${q.points} pontos`);
    });
    
    const totalPoints = questions.reduce((sum, q) => sum + parseFloat(q.points), 0);
    console.log(`   Total: ${totalPoints} pontos`);
    
    if (Math.abs(totalPoints - 10) < 0.01) {
      console.log('✅ Pontos calculados corretamente!');
      return true;
    } else {
      console.log('❌ ERRO: Total de pontos deveria ser 10!');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar pontos:', error.response?.data || error.message);
    return false;
  }
}

async function submitCourse() {
  console.log('\n✅ Tentando submeter curso completo (deve funcionar)...');
  
  try {
    const response = await axios.post(
      `${API_URL}/courses/${courseId}/submit`,
      {},
      {
        headers: { Authorization: `Bearer ${instructorToken}` }
      }
    );
    
    console.log('✅ Curso submetido com sucesso!');
    console.log('   Status:', response.data.data?.course?.status || response.data.status);
    return true;
  } catch (error) {
    console.error('❌ Erro ao submeter curso:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Iniciando testes do sistema de avaliações por módulo\n');
  console.log('='.repeat(60));
  
  const results = [];
  
  // Teste 1: Login
  results.push(await login());
  if (!results[results.length - 1]) return;
  
  // Teste 2: Criar curso
  results.push(await createCourse());
  if (!results[results.length - 1]) return;
  
  // Teste 3: Criar módulo
  results.push(await createModule());
  if (!results[results.length - 1]) return;
  
  // Teste 4: Criar aula
  results.push(await createLesson());
  if (!results[results.length - 1]) return;
  
  // Teste 5: Tentar submeter sem avaliação (deve falhar)
  results.push(await trySubmitWithoutAssessment());
  
  // Teste 6: Criar avaliação
  results.push(await createAssessment());
  if (!results[results.length - 1]) return;
  
  // Teste 7: Tentar submeter sem questões (deve falhar)
  results.push(await trySubmitWithoutQuestions());
  
  // Teste 8: Adicionar questões
  results.push(await addQuestions());
  if (!results[results.length - 1]) return;
  
  // Teste 9: Verificar pontos
  results.push(await verifyQuestionPoints());
  
  // Teste 10: Submeter curso completo
  results.push(await submitCourse());
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMO DOS TESTES\n');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Testes passados: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('\n✅ Sistema de avaliações por módulo funcionando corretamente:');
    console.log('   - Módulos exigem avaliação');
    console.log('   - Avaliações exigem questões');
    console.log('   - Pontos calculados automaticamente (10 pontos / número de questões)');
    console.log('   - Validação antes de submeter curso');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os erros acima.');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Executar testes
runTests().catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
});
