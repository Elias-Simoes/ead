/**
 * Script de teste para os endpoints de avaliações
 * Execute com: node test-assessments.js
 */

const baseUrl = 'http://localhost:3000';

// Cores para output no console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, endpoint, body = null, token = null) {
  const url = `${baseUrl}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Variáveis globais
let instructorToken = null;
let studentToken = null;
let courseId = null;
let assessmentId = null;
let questionId = null;
let studentAssessmentId = null;

// Teste 1: Login como instrutor
async function testInstructorLogin() {
  log('\n=== Teste 1: Login como Instrutor ===', 'cyan');

  const result = await makeRequest('POST', '/api/auth/login', {
    email: 'instructor@test.com',
    password: 'Instructor@123',
  });

  if (result.status === 200 && result.data.data?.tokens?.accessToken) {
    instructorToken = result.data.data.tokens.accessToken;
    log('✓ Login de instrutor bem-sucedido', 'green');
    return true;
  } else {
    log('✗ Falha no login de instrutor', 'red');
    log(JSON.stringify(result.data, null, 2), 'yellow');
    return false;
  }
}

// Teste 2: Login como aluno
async function testStudentLogin() {
  log('\n=== Teste 2: Login como Aluno ===', 'cyan');

  const result = await makeRequest('POST', '/api/auth/login', {
    email: 'student@test.com',
    password: 'Student@123',
  });

  if (result.status === 200 && result.data.data?.tokens?.accessToken) {
    studentToken = result.data.data.tokens.accessToken;
    log('✓ Login de aluno bem-sucedido', 'green');
    return true;
  } else {
    log('✗ Falha no login de aluno', 'red');
    log(JSON.stringify(result.data, null, 2), 'yellow');
    return false;
  }
}

// Teste 3: Criar avaliação (instrutor)
async function testCreateAssessment() {
  log('\n=== Teste 3: Criar Avaliação ===', 'cyan');

  if (!courseId) {
    log('⚠ Pulando teste - courseId não definido', 'yellow');
    return false;
  }

  const result = await makeRequest(
    'POST',
    `/api/courses/${courseId}/assessments`,
    {
      title: 'Avaliação Final',
      type: 'mixed',
      passing_score: 70,
    },
    instructorToken
  );

  if (result.status === 201 && result.data.data?.assessment?.id) {
    assessmentId = result.data.data.assessment.id;
    log('✓ Avaliação criada com sucesso', 'green');
    log(`  ID: ${assessmentId}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao criar avaliação', 'red');
    log(JSON.stringify(result.data, null, 2), 'yellow');
    return false;
  }
}

// Teste 4: Adicionar questão de múltipla escolha
async function testCreateMultipleChoiceQuestion() {
  log('\n=== Teste 4: Adicionar Questão de Múltipla Escolha ===', 'cyan');

  if (!assessmentId) {
    log('⚠ Pulando teste - assessmentId não definido', 'yellow');
    return false;
  }

  const result = await makeRequest(
    'POST',
    `/api/assessments/${assessmentId}/questions`,
    {
      text: 'Qual é a capital do Brasil?',
      type: 'multiple_choice',
      options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'],
      correct_answer: 2,
      points: 10,
      order_index: 1,
    },
    instructorToken
  );

  if (result.status === 201 && result.data.data?.question?.id) {
    questionId = result.data.data.question.id;
    log('✓ Questão de múltipla escolha criada', 'green');
    log(`  ID: ${questionId}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao criar questão', 'red');
    log(JSON.stringify(result.data, null, 2), 'yellow');
    return false;
  }
}

// Teste 5: Adicionar questão dissertativa
async function testCreateEssayQuestion() {
  log('\n=== Teste 5: Adicionar Questão Dissertativa ===', 'cyan');

  if (!assessmentId) {
    log('⚠ Pulando teste - assessmentId não definido', 'yellow');
    return false;
  }

  const result = await makeRequest(
    'POST',
    `/api/assessments/${assessmentId}/questions`,
    {
      text: 'Explique a importância da educação a distância.',
      type: 'essay',
      points: 10,
      order_index: 2,
    },
    instructorToken
  );

  if (result.status === 201) {
    log('✓ Questão dissertativa criada', 'green');
    return true;
  } else {
    log('✗ Falha ao criar questão dissertativa', 'red');
    log(JSON.stringify(result.data, null, 2), 'yellow');
    return false;
  }
}

// Teste 6: Visualizar avaliação (aluno)
async function testViewAssessment() {
  log('\n=== Teste 6: Visualizar Avaliação (Aluno) ===', 'cyan');

  if (!assessmentId) {
    log('⚠ Pulando teste - assessmentId não definido', 'yellow');
    return false;
  }

  const result = await makeRequest(
    'GET',
    `/api/assessments/${assessmentId}`,
    null,
    studentToken
  );

  if (result.status === 200 && result.data.data?.assessment) {
    log('✓ Avaliação visualizada com sucesso', 'green');
    log(`  Questões: ${result.data.data.assessment.questions.length}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao visualizar avaliação', 'red');
    log(JSON.stringify(result.data, null, 2), 'yellow');
    return false;
  }
}

// Teste 7: Submeter respostas (aluno)
async function testSubmitAssessment() {
  log('\n=== Teste 7: Submeter Respostas ===', 'cyan');

  if (!assessmentId) {
    log('⚠ Pulando teste - assessmentId não definido', 'yellow');
    return false;
  }

  const result = await makeRequest(
    'POST',
    `/api/assessments/${assessmentId}/submit`,
    {
      answers: [
        { question_id: questionId, answer: 2 },
        { question_id: 'essay-question-id', answer: 'A educação a distância é importante porque...' },
      ],
    },
    studentToken
  );

  if (result.status === 201 && result.data.data?.submission?.id) {
    studentAssessmentId = result.data.data.submission.id;
    log('✓ Respostas submetidas com sucesso', 'green');
    log(`  Score: ${result.data.data.submission.score || 'Pendente'}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao submeter respostas', 'red');
    log(JSON.stringify(result.data, null, 2), 'yellow');
    return false;
  }
}

// Teste 8: Tentar resubmeter (deve falhar)
async function testResubmitAssessment() {
  log('\n=== Teste 8: Tentar Resubmeter (Deve Falhar) ===', 'cyan');

  if (!assessmentId) {
    log('⚠ Pulando teste - assessmentId não definido', 'yellow');
    return false;
  }

  const result = await makeRequest(
    'POST',
    `/api/assessments/${assessmentId}/submit`,
    {
      answers: [{ question_id: questionId, answer: 1 }],
    },
    studentToken
  );

  if (result.status === 400 && result.data.error?.code === 'ASSESSMENT_ALREADY_SUBMITTED') {
    log('✓ Resubmissão bloqueada corretamente', 'green');
    return true;
  } else {
    log('✗ Resubmissão deveria ter sido bloqueada', 'red');
    log(JSON.stringify(result.data, null, 2), 'yellow');
    return false;
  }
}

// Teste 9: Listar avaliações pendentes (instrutor)
async function testGetPendingAssessments() {
  log('\n=== Teste 9: Listar Avaliações Pendentes ===', 'cyan');

  const result = await makeRequest(
    'GET',
    '/api/instructor/assessments/pending',
    null,
    instructorToken
  );

  if (result.status === 200) {
    log('✓ Avaliações pendentes listadas', 'green');
    log(`  Total: ${result.data.data?.assessments?.length || 0}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao listar avaliações pendentes', 'red');
    log(JSON.stringify(result.data, null, 2), 'yellow');
    return false;
  }
}

// Teste 10: Corrigir avaliação (instrutor)
async function testGradeAssessment() {
  log('\n=== Teste 10: Corrigir Avaliação ===', 'cyan');

  if (!studentAssessmentId) {
    log('⚠ Pulando teste - studentAssessmentId não definido', 'yellow');
    return false;
  }

  const result = await makeRequest(
    'PATCH',
    `/api/student-assessments/${studentAssessmentId}/grade`,
    {
      score: 85,
      feedback: 'Ótimo trabalho! Continue assim.',
    },
    instructorToken
  );

  if (result.status === 200) {
    log('✓ Avaliação corrigida com sucesso', 'green');
    log(`  Nota: ${result.data.data?.assessment?.score}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao corrigir avaliação', 'red');
    log(JSON.stringify(result.data, null, 2), 'yellow');
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   TESTES DO MÓDULO DE AVALIAÇÕES      ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');

  const tests = [
    testInstructorLogin,
    testStudentLogin,
    testCreateAssessment,
    testCreateMultipleChoiceQuestion,
    testCreateEssayQuestion,
    testViewAssessment,
    testSubmitAssessment,
    testResubmitAssessment,
    testGetPendingAssessments,
    testGradeAssessment,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║           RESUMO DOS TESTES            ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');
  log(`Total de testes: ${tests.length}`, 'blue');
  log(`Passou: ${passed}`, 'green');
  log(`Falhou: ${failed}`, 'red');
  log(`Taxa de sucesso: ${((passed / tests.length) * 100).toFixed(1)}%`, 'yellow');
}

// Executar testes
runAllTests().catch((error) => {
  log(`\nErro fatal: ${error.message}`, 'red');
  console.error(error);
});
