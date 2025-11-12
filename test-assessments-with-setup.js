/**
 * Script de teste completo para avaliações (com setup integrado)
 * Execute com: node test-assessments-with-setup.js
 */

const baseUrl = 'http://localhost:3000';

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

let instructorToken = null;
let studentToken = null;
let courseId = null;
let assessmentId = null;
let questionIds = [];
let studentAssessmentId = null;

async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   TESTES DO MÓDULO DE AVALIAÇÕES      ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');

  let passed = 0;
  let failed = 0;

  // Teste 1: Login instrutor
  log('\n=== Teste 1: Login como Instrutor ===', 'cyan');
  const instructorLogin = await makeRequest('POST', '/api/auth/login', {
    email: 'instructor@test.com',
    password: 'j3$UBo&RYF1K', // Senha temporária gerada
  });

  if (instructorLogin.status === 200 && instructorLogin.data.data?.tokens?.accessToken) {
    instructorToken = instructorLogin.data.data.tokens.accessToken;
    log('✓ Login de instrutor bem-sucedido', 'green');
    passed++;
  } else {
    log('✗ Falha no login de instrutor', 'red');
    log(JSON.stringify(instructorLogin.data, null, 2), 'yellow');
    failed++;
  }

  // Teste 2: Login aluno
  log('\n=== Teste 2: Login como Aluno ===', 'cyan');
  const studentLogin = await makeRequest('POST', '/api/auth/login', {
    email: 'student@test.com',
    password: 'Student@123',
  });

  if (studentLogin.status === 200 && studentLogin.data.data?.tokens?.accessToken) {
    studentToken = studentLogin.data.data.tokens.accessToken;
    log('✓ Login de aluno bem-sucedido', 'green');
    passed++;
  } else {
    log('✗ Falha no login de aluno', 'red');
    log(JSON.stringify(studentLogin.data, null, 2), 'yellow');
    failed++;
  }

  // Teste 3: Criar curso
  log('\n=== Teste 3: Criar Curso ===', 'cyan');
  const createCourse = await makeRequest(
    'POST',
    '/api/courses',
    {
      title: 'Curso para Teste de Avaliações',
      description: 'Curso criado automaticamente para testar avaliações',
      category: 'Testes',
      workload: 10,
    },
    instructorToken
  );

  if (createCourse.status === 201 && createCourse.data.data?.course?.id) {
    courseId = createCourse.data.data.course.id;
    log('✓ Curso criado com sucesso', 'green');
    log(`  Curso ID: ${courseId}`, 'blue');
    passed++;
  } else {
    log('✗ Falha ao criar curso', 'red');
    log(JSON.stringify(createCourse.data, null, 2), 'yellow');
    failed++;
  }

  if (!courseId) {
    log('\n⚠️  Não foi possível continuar sem um curso. Parando testes.', 'yellow');
    return { passed, failed, total: 3 };
  }

  // Teste 4: Criar avaliação
  log('\n=== Teste 4: Criar Avaliação ===', 'cyan');
  const createAssessment = await makeRequest(
    'POST',
    `/api/courses/${courseId}/assessments`,
    {
      title: 'Avaliação Final - Teste Automatizado',
      type: 'mixed',
      passing_score: 70,
    },
    instructorToken
  );

  if (createAssessment.status === 201 && createAssessment.data.data?.assessment?.id) {
    assessmentId = createAssessment.data.data.assessment.id;
    log('✓ Avaliação criada com sucesso', 'green');
    log(`  ID: ${assessmentId}`, 'blue');
    passed++;
  } else {
    log('✗ Falha ao criar avaliação', 'red');
    log(JSON.stringify(createAssessment.data, null, 2), 'yellow');
    failed++;
  }

  if (!assessmentId) {
    log('\n⚠️  Não foi possível continuar sem uma avaliação. Parando testes.', 'yellow');
    return { passed, failed, total: 4 };
  }

  // Teste 5: Adicionar questão de múltipla escolha
  log('\n=== Teste 5: Adicionar Questão de Múltipla Escolha ===', 'cyan');
  const createMCQuestion = await makeRequest(
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

  if (createMCQuestion.status === 201 && createMCQuestion.data.data?.question?.id) {
    questionIds.push(createMCQuestion.data.data.question.id);
    log('✓ Questão de múltipla escolha criada', 'green');
    log(`  ID: ${createMCQuestion.data.data.question.id}`, 'blue');
    passed++;
  } else {
    log('✗ Falha ao criar questão', 'red');
    log(JSON.stringify(createMCQuestion.data, null, 2), 'yellow');
    failed++;
  }

  // Teste 6: Adicionar questão dissertativa
  log('\n=== Teste 6: Adicionar Questão Dissertativa ===', 'cyan');
  const createEssayQuestion = await makeRequest(
    'POST',
    `/api/assessments/${assessmentId}/questions`,
    {
      text: 'Explique a importância da educação a distância no contexto atual.',
      type: 'essay',
      points: 10,
      order_index: 2,
    },
    instructorToken
  );

  if (createEssayQuestion.status === 201 && createEssayQuestion.data.data?.question?.id) {
    questionIds.push(createEssayQuestion.data.data.question.id);
    log('✓ Questão dissertativa criada', 'green');
    log(`  ID: ${createEssayQuestion.data.data.question.id}`, 'blue');
    passed++;
  } else {
    log('✗ Falha ao criar questão dissertativa', 'red');
    log(JSON.stringify(createEssayQuestion.data, null, 2), 'yellow');
    failed++;
  }

  // Teste 7: Visualizar avaliação (aluno)
  log('\n=== Teste 7: Visualizar Avaliação (Aluno) ===', 'cyan');
  const viewAssessment = await makeRequest(
    'GET',
    `/api/assessments/${assessmentId}`,
    null,
    studentToken
  );

  if (viewAssessment.status === 200 && viewAssessment.data.data?.assessment) {
    log('✓ Avaliação visualizada com sucesso', 'green');
    log(`  Questões: ${viewAssessment.data.data.assessment.questions.length}`, 'blue');
    log(`  Já submetida: ${viewAssessment.data.data.hasSubmitted}`, 'blue');
    passed++;
  } else {
    log('✗ Falha ao visualizar avaliação', 'red');
    log(JSON.stringify(viewAssessment.data, null, 2), 'yellow');
    failed++;
  }

  // Teste 8: Submeter respostas (aluno)
  log('\n=== Teste 8: Submeter Respostas ===', 'cyan');
  const submitAssessment = await makeRequest(
    'POST',
    `/api/assessments/${assessmentId}/submit`,
    {
      answers: [
        { question_id: questionIds[0], answer: 2 }, // Resposta correta
        { question_id: questionIds[1], answer: 'A educação a distância é fundamental porque permite acesso ao conhecimento de forma flexível e democrática.' },
      ],
    },
    studentToken
  );

  if (submitAssessment.status === 201 && submitAssessment.data.data?.submission?.id) {
    studentAssessmentId = submitAssessment.data.data.submission.id;
    log('✓ Respostas submetidas com sucesso', 'green');
    log(`  ID da submissão: ${studentAssessmentId}`, 'blue');
    log(`  Score: ${submitAssessment.data.data.submission.score || 'Pendente'}`, 'blue');
    log(`  Status: ${submitAssessment.data.data.submission.status}`, 'blue');
    passed++;
  } else {
    log('✗ Falha ao submeter respostas', 'red');
    log(JSON.stringify(submitAssessment.data, null, 2), 'yellow');
    failed++;
  }

  // Teste 9: Tentar resubmeter (deve falhar)
  log('\n=== Teste 9: Tentar Resubmeter (Deve Falhar) ===', 'cyan');
  const resubmit = await makeRequest(
    'POST',
    `/api/assessments/${assessmentId}/submit`,
    {
      answers: [{ question_id: questionIds[0], answer: 1 }],
    },
    studentToken
  );

  if (resubmit.status === 400 && resubmit.data.error?.code === 'ASSESSMENT_ALREADY_SUBMITTED') {
    log('✓ Resubmissão bloqueada corretamente', 'green');
    passed++;
  } else {
    log('✗ Resubmissão deveria ter sido bloqueada', 'red');
    log(JSON.stringify(resubmit.data, null, 2), 'yellow');
    failed++;
  }

  // Teste 10: Listar avaliações pendentes (instrutor)
  log('\n=== Teste 10: Listar Avaliações Pendentes ===', 'cyan');
  const getPending = await makeRequest(
    'GET',
    '/api/instructor/assessments/pending',
    null,
    instructorToken
  );

  if (getPending.status === 200) {
    log('✓ Avaliações pendentes listadas', 'green');
    log(`  Total: ${getPending.data.data?.assessments?.length || 0}`, 'blue');
    passed++;
  } else {
    log('✗ Falha ao listar avaliações pendentes', 'red');
    log(JSON.stringify(getPending.data, null, 2), 'yellow');
    failed++;
  }

  // Teste 11: Corrigir avaliação (instrutor)
  if (studentAssessmentId) {
    log('\n=== Teste 11: Corrigir Avaliação ===', 'cyan');
    const gradeAssessment = await makeRequest(
      'PATCH',
      `/api/student-assessments/${studentAssessmentId}/grade`,
      {
        score: 90,
        feedback: 'Excelente trabalho! Resposta muito bem elaborada.',
      },
      instructorToken
    );

    if (gradeAssessment.status === 200) {
      log('✓ Avaliação corrigida com sucesso', 'green');
      log(`  Nota final: ${gradeAssessment.data.data?.assessment?.score}`, 'blue');
      log(`  Status: ${gradeAssessment.data.data?.assessment?.status}`, 'blue');
      passed++;
    } else {
      log('✗ Falha ao corrigir avaliação', 'red');
      log(JSON.stringify(gradeAssessment.data, null, 2), 'yellow');
      failed++;
    }
  }

  return { passed, failed, total: 11 };
}

runTests()
  .then(({ passed, failed, total }) => {
    log('\n╔════════════════════════════════════════╗', 'cyan');
    log('║           RESUMO DOS TESTES            ║', 'cyan');
    log('╚════════════════════════════════════════╝', 'cyan');
    log(`Total de testes: ${total}`, 'blue');
    log(`Passou: ${passed}`, 'green');
    log(`Falhou: ${failed}`, 'red');
    log(`Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%`, 'yellow');
  })
  .catch((error) => {
    log(`\nErro fatal: ${error.message}`, 'red');
    console.error(error);
  });
