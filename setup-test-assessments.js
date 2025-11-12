/**
 * Script para configurar dados de teste para o módulo de avaliações
 * Execute com: node setup-test-assessments.js
 */

const baseUrl = 'http://localhost:3000';

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

async function setup() {
  console.log('🔧 Configurando dados de teste para avaliações...\n');

  // 1. Login como admin
  console.log('1. Fazendo login como admin...');
  const adminLogin = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@plataforma-ead.com',
    password: 'Admin@123',
  });

  if (adminLogin.status !== 200) {
    console.log('❌ Falha no login do admin');
    return;
  }

  const adminToken = adminLogin.data.data.tokens.accessToken;
  console.log('✅ Admin logado\n');

  // 2. Criar instrutor de teste
  console.log('2. Criando instrutor de teste...');
  const createInstructor = await makeRequest(
    'POST',
    '/api/admin/instructors',
    {
      name: 'Professor Teste',
      email: 'instructor@test.com',
      bio: 'Instrutor para testes de avaliações',
      expertise: ['Testes', 'Avaliações'],
    },
    adminToken
  );

  if (createInstructor.status === 201) {
    console.log('✅ Instrutor criado');
    console.log(`   Email: instructor@test.com`);
    console.log(`   Senha temporária: ${createInstructor.data.data.temporaryPassword}\n`);
  } else if (createInstructor.data.error?.code === 'EMAIL_ALREADY_EXISTS') {
    console.log('⚠️  Instrutor já existe\n');
  } else {
    console.log('❌ Falha ao criar instrutor');
    console.log(JSON.stringify(createInstructor.data, null, 2));
    return;
  }

  // 3. Registrar aluno de teste
  console.log('3. Registrando aluno de teste...');
  const registerStudent = await makeRequest('POST', '/api/auth/register', {
    name: 'Aluno Teste',
    email: 'student@test.com',
    password: 'Student@123',
    gdprConsent: true,
  });

  if (registerStudent.status === 201) {
    console.log('✅ Aluno registrado');
    console.log(`   Email: student@test.com`);
    console.log(`   Senha: Student@123\n`);
  } else if (registerStudent.data.error?.code === 'EMAIL_ALREADY_EXISTS') {
    console.log('⚠️  Aluno já existe\n');
  } else {
    console.log('❌ Falha ao registrar aluno');
    console.log(JSON.stringify(registerStudent.data, null, 2));
    return;
  }

  // 4. Login como instrutor
  console.log('4. Fazendo login como instrutor...');
  let instructorPassword = 'Instructor@123';
  
  // Se o instrutor foi recém-criado, usar a senha temporária
  if (createInstructor.status === 201 && createInstructor.data.data.temporaryPassword) {
    instructorPassword = createInstructor.data.data.temporaryPassword;
  }
  
  const instructorLogin = await makeRequest('POST', '/api/auth/login', {
    email: 'instructor@test.com',
    password: instructorPassword,
  });

  if (instructorLogin.status !== 200) {
    console.log('❌ Falha no login do instrutor');
    console.log(`   Tente usar a senha: ${instructorPassword}\n`);
    return;
  }

  const instructorToken = instructorLogin.data.data.tokens.accessToken;
  console.log('✅ Instrutor logado\n');

  // 5. Criar curso de teste
  console.log('5. Criando curso de teste...');
  const createCourse = await makeRequest(
    'POST',
    '/api/courses',
    {
      title: 'Curso de Teste para Avaliações',
      description: 'Curso criado para testar o módulo de avaliações',
      category: 'Testes',
      workload: 10,
    },
    instructorToken
  );

  if (createCourse.status !== 201) {
    console.log('❌ Falha ao criar curso');
    console.log(JSON.stringify(createCourse.data, null, 2));
    return;
  }

  const courseId = createCourse.data.data.course.id;
  console.log('✅ Curso criado');
  console.log(`   ID: ${courseId}\n`);

  // 6. Criar módulo no curso
  console.log('6. Criando módulo no curso...');
  const createModule = await makeRequest(
    'POST',
    `/api/courses/${courseId}/modules`,
    {
      title: 'Módulo 1',
      description: 'Primeiro módulo',
      order_index: 1,
    },
    instructorToken
  );

  if (createModule.status !== 201) {
    console.log('❌ Falha ao criar módulo');
    return;
  }

  const moduleId = createModule.data.data.module.id;
  console.log('✅ Módulo criado\n');

  // 7. Criar aula no módulo
  console.log('7. Criando aula no módulo...');
  const createLesson = await makeRequest(
    'POST',
    `/api/modules/${moduleId}/lessons`,
    {
      title: 'Aula 1',
      description: 'Primeira aula',
      type: 'video',
      content_url: 'https://example.com/video.mp4',
      duration: 600,
      order_index: 1,
    },
    instructorToken
  );

  if (createLesson.status !== 201) {
    console.log('❌ Falha ao criar aula');
    return;
  }

  console.log('✅ Aula criada\n');

  // 8. Submeter curso para aprovação
  console.log('8. Submetendo curso para aprovação...');
  const submitCourse = await makeRequest(
    'POST',
    `/api/courses/${courseId}/submit`,
    null,
    instructorToken
  );

  if (submitCourse.status !== 200) {
    console.log('❌ Falha ao submeter curso');
    return;
  }

  console.log('✅ Curso submetido para aprovação\n');

  // 9. Aprovar curso como admin
  console.log('9. Aprovando curso como admin...');
  const approveCourse = await makeRequest(
    'PATCH',
    `/api/admin/courses/${courseId}/approve`,
    null,
    adminToken
  );

  if (approveCourse.status !== 200) {
    console.log('❌ Falha ao aprovar curso');
    return;
  }

  console.log('✅ Curso aprovado e publicado\n');

  // 10. Criar plano de assinatura (se não existir)
  console.log('10. Verificando plano de assinatura...');
  const createPlan = await makeRequest(
    'POST',
    '/api/admin/subscriptions/plans',
    {
      name: 'Plano Mensal Teste',
      price: 49.9,
      duration_days: 30,
      features: ['Acesso a todos os cursos', 'Certificados'],
    },
    adminToken
  );

  if (createPlan.status === 201) {
    console.log('✅ Plano criado\n');
  } else {
    console.log('⚠️  Plano já existe ou erro ao criar\n');
  }

  // 11. Login como aluno
  console.log('11. Fazendo login como aluno...');
  const studentLogin = await makeRequest('POST', '/api/auth/login', {
    email: 'student@test.com',
    password: 'Student@123',
  });

  if (studentLogin.status !== 200) {
    console.log('❌ Falha no login do aluno');
    return;
  }

  const studentToken = studentLogin.data.data.tokens.accessToken;
  console.log('✅ Aluno logado\n');

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ SETUP COMPLETO!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📋 Credenciais para testes:\n');
  console.log('Instrutor:');
  console.log('  Email: instructor@test.com');
  console.log(`  Senha: ${instructorPassword}`);
  console.log('\nAluno:');
  console.log('  Email: student@test.com');
  console.log('  Senha: Student@123');
  console.log('\n🎯 Curso ID:', courseId);
  console.log('\n▶️  Execute agora: node test-assessments.js');
}

setup().catch((error) => {
  console.error('❌ Erro fatal:', error.message);
  console.error(error);
});
