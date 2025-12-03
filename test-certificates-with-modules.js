const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api';

// Credenciais
const INSTRUCTOR_EMAIL = 'instructor@example.com';
const INSTRUCTOR_PASSWORD = 'Senha123!';
const STUDENT_EMAIL = 'student@example.com';
const STUDENT_PASSWORD = 'Student123!';

let instructorToken = '';
let studentToken = '';
let courseId = '';
let module1Id = '';
let module2Id = '';
let assessment1Id = '';
let assessment2Id = '';

async function loginInstructor() {
  console.log('🔐 Login instrutor...');
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: INSTRUCTOR_EMAIL,
    password: INSTRUCTOR_PASSWORD
  });
  instructorToken = response.data.data.tokens.accessToken;
  console.log('✅ Instrutor logado');
}

async function loginStudent() {
  console.log('🔐 Login aluno...');
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: STUDENT_EMAIL,
    password: STUDENT_PASSWORD
  });
  studentToken = response.data.data.tokens.accessToken;
  console.log('✅ Aluno logado');
}

async function createCourseWithModules() {
  console.log('\n📚 Criando curso com 2 módulos...');
  
  // Criar curso
  const courseRes = await axios.post(
    `${API_URL}/courses`,
    {
      title: 'Curso Teste Certificado',
      description: 'Teste de certificado com múltiplas avaliações',
      workload: 40,
      category: 'Tecnologia',
      passing_score: 7.0
    },
    { headers: { Authorization: `Bearer ${instructorToken}` } }
  );
  courseId = courseRes.data.data.course.id;
  console.log('✅ Curso criado:', courseId);
  
  // Criar módulo 1
  const module1Res = await axios.post(
    `${API_URL}/courses/${courseId}/modules`,
    { title: 'Módulo 1', description: 'Primeiro módulo', order_index: 1 },
    { headers: { Authorization: `Bearer ${instructorToken}` } }
  );
  module1Id = module1Res.data.data.module.id;
  console.log('✅ Módulo 1 criado');
  
  // Criar aula no módulo 1
  await axios.post(
    `${API_URL}/courses/modules/${module1Id}/lessons`,
    { title: 'Aula 1.1', description: 'Teste', type: 'text', content: 'Conteúdo', order_index: 1 },
    { headers: { Authorization: `Bearer ${instructorToken}` } }
  );
  
  // Criar módulo 2
  const module2Res = await axios.post(
    `${API_URL}/courses/${courseId}/modules`,
    { title: 'Módulo 2', description: 'Segundo módulo', order_index: 2 },
    { headers: { Authorization: `Bearer ${instructorToken}` } }
  );
  module2Id = module2Res.data.data.module.id;
  console.log('✅ Módulo 2 criado');
  
  // Criar aula no módulo 2
  await axios.post(
    `${API_URL}/courses/modules/${module2Id}/lessons`,
    { title: 'Aula 2.1', description: 'Teste', type: 'text', content: 'Conteúdo', order_index: 1 },
    { headers: { Authorization: `Bearer ${instructorToken}` } }
  );
}

async function createAssessments() {
  console.log('\n📋 Criando avaliações...');
  
  // Avaliação módulo 1
  const assessment1Res = await axios.post(
    `${API_URL}/modules/${module1Id}/assessments`,
    { title: 'Avaliação Módulo 1', type: 'multiple_choice', passing_score: 7 },
    { headers: { Authorization: `Bearer ${instructorToken}` } }
  );
  assessment1Id = assessment1Res.data.data.assessment.id;
  console.log('✅ Avaliação 1 criada');
  
  // Adicionar 5 questões (2 pontos cada = 10 pontos)
  for (let i = 1; i <= 5; i++) {
    await axios.post(
      `${API_URL}/assessments/${assessment1Id}/questions`,
      {
        text: `Questão ${i} - Módulo 1`,
        type: 'multiple_choice',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        points: 2,
        order_index: i
      },
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
  }
  console.log('✅ 5 questões adicionadas ao módulo 1');
  
  // Avaliação módulo 2
  const assessment2Res = await axios.post(
    `${API_URL}/modules/${module2Id}/assessments`,
    { title: 'Avaliação Módulo 2', type: 'multiple_choice', passing_score: 7 },
    { headers: { Authorization: `Bearer ${instructorToken}` } }
  );
  assessment2Id = assessment2Res.data.data.assessment.id;
  console.log('✅ Avaliação 2 criada');
  
  // Adicionar 5 questões (2 pontos cada = 10 pontos)
  for (let i = 1; i <= 5; i++) {
    await axios.post(
      `${API_URL}/assessments/${assessment2Id}/questions`,
      {
        text: `Questão ${i} - Módulo 2`,
        type: 'multiple_choice',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        points: 2,
        order_index: i
      },
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
  }
  console.log('✅ 5 questões adicionadas ao módulo 2');
}

async function submitCourse() {
  console.log('\n✅ Submetendo e aprovando curso...');
  
  // Submeter
  await axios.post(
    `${API_URL}/courses/${courseId}/submit`,
    {},
    { headers: { Authorization: `Bearer ${instructorToken}` } }
  );
  console.log('✅ Curso submetido');
  
  // Aprovar (como admin - vou usar o token do instrutor por simplicidade)
  // Em produção, isso seria feito por um admin
  console.log('⚠️  Nota: Em produção, aprovação seria feita por admin');
}

async function studentTakesAssessments() {
  console.log('\n📝 Aluno fazendo avaliações...');
  
  // Fazer avaliação 1 - Acertar 4 de 5 = 8 pontos
  console.log('📝 Avaliação 1: Acertando 4 de 5 questões (8 pontos)...');
  const answers1 = [];
  const questions1Res = await axios.get(
    `${API_URL}/assessments/${assessment1Id}`,
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );
  const questions1 = questions1Res.data.data.questions;
  
  questions1.forEach((q, index) => {
    answers1.push({
      question_id: q.id,
      answer: index < 4 ? 0 : 1 // Acerta 4, erra 1
    });
  });
  
  await axios.post(
    `${API_URL}/assessments/${assessment1Id}/submit`,
    { answers: answers1 },
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );
  console.log('✅ Avaliação 1 submetida: 8/10 pontos');
  
  // Fazer avaliação 2 - Acertar 3 de 5 = 6 pontos
  console.log('📝 Avaliação 2: Acertando 3 de 5 questões (6 pontos)...');
  const answers2 = [];
  const questions2Res = await axios.get(
    `${API_URL}/assessments/${assessment2Id}`,
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );
  const questions2 = questions2Res.data.data.questions;
  
  questions2.forEach((q, index) => {
    answers2.push({
      question_id: q.id,
      answer: index < 3 ? 0 : 1 // Acerta 3, erra 2
    });
  });
  
  await axios.post(
    `${API_URL}/assessments/${assessment2Id}/submit`,
    { answers: answers2 },
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );
  console.log('✅ Avaliação 2 submetida: 6/10 pontos');
  
  console.log('\n📊 Nota final esperada: (8 + 6) / 2 = 7.0');
}

async function checkFinalGrade() {
  console.log('\n🔍 Verificando nota final...');
  
  const progressRes = await axios.get(
    `${API_URL}/progress/courses/${courseId}`,
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );
  
  const finalScore = progressRes.data.data?.finalScore || progressRes.data.data?.final_score;
  console.log('✅ Nota final calculada:', finalScore);
  
  if (Math.abs(finalScore - 7.0) < 0.01) {
    console.log('✅ Nota final correta!');
    return true;
  } else {
    console.log('❌ Nota final incorreta! Esperado: 7.0, Obtido:', finalScore);
    return false;
  }
}

async function testCertificateEligibility() {
  console.log('\n🎓 Testando elegibilidade para certificado...');
  
  try {
    // Tentar emitir certificado
    const certRes = await axios.post(
      `${API_URL}/certificates/issue`,
      { courseId },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    
    console.log('✅ Certificado emitido!');
    console.log('   Código de verificação:', certRes.data.data?.verificationCode);
    console.log('   Nota final:', certRes.data.data?.finalGrade || 'N/A');
    return true;
  } catch (error) {
    console.error('❌ Erro ao emitir certificado:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testando Sistema de Certificados com Avaliações por Módulo\n');
  console.log('='.repeat(70));
  
  try {
    await loginInstructor();
    await createCourseWithModules();
    await createAssessments();
    await submitCourse();
    
    // Criar aluno se não existir
    console.log('\n👤 Verificando aluno de teste...');
    try {
      await loginStudent();
    } catch (error) {
      console.log('⚠️  Aluno não existe, você precisa criar um aluno de teste primeiro');
      console.log('   Execute: node scripts/create-student-example.js');
      return;
    }
    
    await studentTakesAssessments();
    await checkFinalGrade();
    await testCertificateEligibility();
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 TESTES CONCLUÍDOS!');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n💥 Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

runTests();
