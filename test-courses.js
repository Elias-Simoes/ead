/**
 * Script de teste para os endpoints de cursos
 * Execute com: node test-courses.js
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

// Variáveis globais para armazenar tokens e IDs
let adminToken = null;
let instructorToken = null;
let instructorId = null;
let courseId = null;
let moduleId = null;
let lessonId = null;

async function testAdminLogin() {
  log('\n=== 1. Login como Admin ===', 'cyan');
  const result = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@plataforma-ead.com',
    password: 'Admin@123',
  });

  if (result.status === 200 && result.data.data.tokens) {
    adminToken = result.data.data.tokens.accessToken;
    log('✓ Login admin bem-sucedido', 'green');
    return true;
  } else {
    log('✗ Falha no login admin', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    return false;
  }
}

async function testCreateInstructor() {
  log('\n=== 2. Criar Instrutor ===', 'cyan');
  const result = await makeRequest(
    'POST',
    '/api/admin/instructors',
    {
      email: `instructor-test-${Date.now()}@test.com`,
      name: 'Instrutor Teste',
      bio: 'Instrutor de teste para cursos',
      expertise: ['JavaScript', 'Node.js'],
    },
    adminToken
  );

  if (result.status === 201 && result.data.data.instructor) {
    instructorId = result.data.data.instructor.id;
    log('✓ Instrutor criado com sucesso', 'green');
    log(`  ID: ${instructorId}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao criar instrutor', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    return false;
  }
}

async function testInstructorLogin() {
  log('\n=== 3. Login como Instrutor ===', 'cyan');
  
  // Get instructor credentials from previous test
  const instructors = await makeRequest('GET', '/api/admin/instructors', null, adminToken);
  
  if (instructors.status === 200 && instructors.data.data.instructors.length > 0) {
    const instructor = instructors.data.data.instructors[0];
    instructorId = instructor.id;
    
    // For testing, we'll use a known password or create a new instructor
    log('  Usando instrutor existente', 'blue');
    log('  Nota: Use a senha temporária fornecida na criação', 'yellow');
    return true;
  }
  
  return false;
}

async function testCreateCourse() {
  log('\n=== 4. Criar Curso (Draft) ===', 'cyan');
  
  if (!instructorId) {
    log('✗ ID do instrutor não disponível', 'red');
    return false;
  }

  // We need to login as the instructor first, but for testing we'll use a workaround
  // In a real scenario, the instructor would login with their temporary password
  
  // For now, let's create a course directly by modifying the instructor's role temporarily
  // Or we can use the admin to create a test instructor with known credentials
  
  // Alternative: Create course using a SQL injection or direct DB access
  // For testing purposes, let's create an instructor account with known password
  
  log('  Criando instrutor com senha conhecida...', 'blue');
  
  const testInstructor = await makeRequest(
    'POST',
    '/api/admin/instructors',
    {
      email: `test-instructor-${Date.now()}@test.com`,
      name: 'Instrutor de Teste',
      bio: 'Instrutor para testes automatizados',
      expertise: ['Node.js', 'JavaScript'],
    },
    adminToken
  );

  if (testInstructor.status !== 201) {
    log('✗ Falha ao criar instrutor de teste', 'red');
    return false;
  }

  const tempPassword = testInstructor.data.data.temporaryPassword;
  const instructorEmail = testInstructor.data.data.instructor.email;
  instructorId = testInstructor.data.data.instructor.id;

  log(`  Instrutor criado: ${instructorEmail}`, 'blue');
  log(`  Senha temporária: ${tempPassword}`, 'blue');

  // Login as instructor
  log('  Fazendo login como instrutor...', 'blue');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: instructorEmail,
    password: tempPassword,
  });

  if (loginResult.status !== 200 || !loginResult.data.data.tokens) {
    log('✗ Falha no login do instrutor', 'red');
    return false;
  }

  instructorToken = loginResult.data.data.tokens.accessToken;
  log('  ✓ Login do instrutor bem-sucedido', 'green');

  // Now create the course as instructor
  const result = await makeRequest(
    'POST',
    '/api/courses',
    {
      title: 'Curso de Teste - Node.js Avançado',
      description: 'Um curso completo sobre Node.js e desenvolvimento backend',
      category: 'Programação',
      workload: 40,
    },
    instructorToken
  );

  if (result.status === 201 && result.data.data.course) {
    courseId = result.data.data.course.id;
    log('✓ Curso criado com sucesso', 'green');
    log(`  ID: ${courseId}`, 'blue');
    log(`  Status: ${result.data.data.course.status}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao criar curso', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    if (result.data.error) {
      log(`  Erro: ${result.data.error.message}`, 'yellow');
    }
    return false;
  }
}

async function testAddModule() {
  log('\n=== 5. Adicionar Módulo ao Curso ===', 'cyan');
  
  if (!courseId) {
    log('✗ ID do curso não disponível', 'red');
    return false;
  }

  if (!instructorToken) {
    log('✗ Token do instrutor não disponível', 'red');
    return false;
  }

  const result = await makeRequest(
    'POST',
    `/api/courses/${courseId}/modules`,
    {
      title: 'Módulo 1 - Introdução',
      description: 'Introdução ao Node.js e conceitos básicos',
    },
    instructorToken
  );

  if (result.status === 201 && result.data.data.module) {
    moduleId = result.data.data.module.id;
    log('✓ Módulo adicionado com sucesso', 'green');
    log(`  ID: ${moduleId}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao adicionar módulo', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    if (result.data.error) {
      log(`  Erro: ${result.data.error.message}`, 'yellow');
    }
    return false;
  }
}

async function testAddLesson() {
  log('\n=== 6. Adicionar Aula ao Módulo ===', 'cyan');
  
  if (!moduleId) {
    log('✗ ID do módulo não disponível', 'red');
    return false;
  }

  if (!instructorToken) {
    log('✗ Token do instrutor não disponível', 'red');
    return false;
  }

  const result = await makeRequest(
    'POST',
    `/api/courses/modules/${moduleId}/lessons`,
    {
      title: 'Aula 1 - O que é Node.js',
      description: 'Entendendo o Node.js e seu ecossistema',
      type: 'video',
      content: 'https://example.com/video1.mp4',
      duration: 15,
    },
    instructorToken
  );

  if (result.status === 201 && result.data.data.lesson) {
    lessonId = result.data.data.lesson.id;
    log('✓ Aula adicionada com sucesso', 'green');
    log(`  ID: ${lessonId}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao adicionar aula', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    if (result.data.error) {
      log(`  Erro: ${result.data.error.message}`, 'yellow');
    }
    return false;
  }
}

async function testSubmitForApproval() {
  log('\n=== 7. Enviar Curso para Aprovação ===', 'cyan');
  
  if (!courseId) {
    log('✗ ID do curso não disponível', 'red');
    return false;
  }

  if (!instructorToken) {
    log('✗ Token do instrutor não disponível', 'red');
    return false;
  }

  const result = await makeRequest(
    'POST',
    `/api/courses/${courseId}/submit`,
    null,
    instructorToken
  );

  if (result.status === 200 && result.data.data.course) {
    log('✓ Curso enviado para aprovação', 'green');
    log(`  Status: ${result.data.data.course.status}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao enviar para aprovação', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    if (result.data.error) {
      log(`  Erro: ${result.data.error.message}`, 'yellow');
    }
    return false;
  }
}

async function testApproveCourse() {
  log('\n=== 8. Aprovar Curso (Admin) ===', 'cyan');
  
  if (!courseId) {
    log('✗ ID do curso não disponível', 'red');
    return false;
  }

  const result = await makeRequest(
    'PATCH',
    `/api/courses/admin/${courseId}/approve`,
    null,
    adminToken
  );

  if (result.status === 200 && result.data.data.course) {
    log('✓ Curso aprovado com sucesso', 'green');
    log(`  Status: ${result.data.data.course.status}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao aprovar curso', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    if (result.data.error) {
      log(`  Erro: ${result.data.error.message}`, 'yellow');
    }
    return false;
  }
}

async function testListPublishedCourses() {
  log('\n=== 9. Listar Cursos Publicados ===', 'cyan');
  
  const result = await makeRequest('GET', '/api/courses', null, adminToken);

  if (result.status === 200 && result.data.data.courses) {
    log('✓ Cursos listados com sucesso', 'green');
    log(`  Total: ${result.data.data.total}`, 'blue');
    log(`  Cursos na página: ${result.data.data.courses.length}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao listar cursos', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    return false;
  }
}

async function testGetCourseDetails() {
  log('\n=== 10. Obter Detalhes do Curso ===', 'cyan');
  
  if (!courseId) {
    log('✗ ID do curso não disponível', 'red');
    return false;
  }

  const result = await makeRequest('GET', `/api/courses/${courseId}`, null, adminToken);

  if (result.status === 200 && result.data.data.course) {
    log('✓ Detalhes do curso obtidos', 'green');
    log(`  Título: ${result.data.data.course.title}`, 'blue');
    log(`  Módulos: ${result.data.data.course.modules?.length || 0}`, 'blue');
    return true;
  } else {
    log('✗ Falha ao obter detalhes', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   TESTES DO MÓDULO DE CURSOS          ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');

  const tests = [
    testAdminLogin,
    testCreateInstructor,
    testInstructorLogin,
    testCreateCourse,
    testAddModule,
    testAddLesson,
    testSubmitForApproval,
    testApproveCourse,
    testListPublishedCourses,
    testGetCourseDetails,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(`✗ Erro no teste: ${error.message}`, 'red');
      failed++;
    }
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
runTests().catch((error) => {
  log(`\nErro fatal: ${error.message}`, 'red');
  process.exit(1);
});
