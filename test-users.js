/**
 * Script de teste para os endpoints de gestão de usuários
 * Execute com: node test-users.js
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

async function loginAsAdmin() {
  log('\n=== Fazendo login como Admin ===', 'cyan');
  const result = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@plataforma-ead.com',
    password: 'Admin@123',
  });

  if (result.status === 200) {
    log('✓ Login admin bem-sucedido', 'green');
    return result.data.data.tokens.accessToken;
  } else {
    log('✗ Login admin falhou', 'red');
    log(`  Erro: ${JSON.stringify(result.data)}`, 'red');
    return null;
  }
}

async function registerStudent() {
  log('\n=== Registrando um aluno de teste ===', 'cyan');
  const studentData = {
    email: `student${Date.now()}@example.com`,
    name: 'Aluno Teste',
    password: 'StudentPass123!',
    gdprConsent: true,
  };

  const result = await makeRequest('POST', '/api/auth/register', studentData);

  if (result.status === 201) {
    log('✓ Aluno registrado com sucesso', 'green');
    return {
      email: studentData.email,
      password: studentData.password,
      token: result.data.data.accessToken,
    };
  } else {
    log('✗ Registro de aluno falhou', 'red');
    return null;
  }
}

async function testCreateInstructor(adminToken) {
  log('\n=== 1. Testando Criação de Instrutor ===', 'cyan');

  // Teste 1.1: Criar instrutor como admin
  log('\nTeste 1.1: Criar instrutor com dados válidos (admin)', 'yellow');
  const instructorData = {
    email: `instructor${Date.now()}@example.com`,
    name: 'Instrutor Teste',
    bio: 'Especialista em desenvolvimento web',
    expertise: ['JavaScript', 'Node.js', 'React'],
  };

  const result1 = await makeRequest(
    'POST',
    '/api/admin/instructors',
    instructorData,
    adminToken
  );

  let instructorId = null;
  if (result1.status === 201) {
    log('✓ Instrutor criado com sucesso', 'green');
    log(`  ID: ${result1.data.data.instructor.id}`, 'blue');
    log(`  Email: ${result1.data.data.instructor.email}`, 'blue');
    log(`  Senha temporária: ${result1.data.data.temporaryPassword}`, 'blue');
    instructorId = result1.data.data.instructor.id;
  } else {
    log('✗ Criação de instrutor falhou', 'red');
    log(`  Erro: ${JSON.stringify(result1.data)}`, 'red');
  }

  // Teste 1.2: Tentar criar instrutor sem ser admin
  log('\nTeste 1.2: Tentar criar instrutor sem ser admin (deve falhar)', 'yellow');
  const studentCredentials = await registerStudent();
  
  if (studentCredentials) {
    const result2 = await makeRequest(
      'POST',
      '/api/admin/instructors',
      {
        email: `another${Date.now()}@example.com`,
        name: 'Outro Instrutor',
      },
      studentCredentials.token
    );

    if (result2.status === 403) {
      log('✓ Acesso negado corretamente para não-admin', 'green');
    } else {
      log('✗ Deveria ter retornado erro 403', 'red');
      log(`  Status recebido: ${result2.status}`, 'red');
    }
  }

  // Teste 1.3: Criar instrutor com email duplicado
  log('\nTeste 1.3: Criar instrutor com email duplicado (deve falhar)', 'yellow');
  const result3 = await makeRequest(
    'POST',
    '/api/admin/instructors',
    instructorData,
    adminToken
  );

  if (result3.status === 409) {
    log('✓ Email duplicado detectado corretamente', 'green');
  } else {
    log('✗ Deveria ter retornado erro 409', 'red');
  }

  return instructorId;
}

async function testListInstructors(adminToken) {
  log('\n=== 2. Testando Listagem de Instrutores ===', 'cyan');

  // Teste 2.1: Listar instrutores como admin
  log('\nTeste 2.1: Listar instrutores (admin)', 'yellow');
  const result1 = await makeRequest(
    'GET',
    '/api/admin/instructors?page=1&limit=10',
    null,
    adminToken
  );

  if (result1.status === 200) {
    log('✓ Listagem bem-sucedida', 'green');
    log(`  Total de instrutores: ${result1.data.data.total}`, 'blue');
    log(`  Página: ${result1.data.data.page}`, 'blue');
    log(`  Total de páginas: ${result1.data.data.totalPages}`, 'blue');
  } else {
    log('✗ Listagem falhou', 'red');
  }

  // Teste 2.2: Tentar listar sem ser admin
  log('\nTeste 2.2: Tentar listar instrutores sem ser admin (deve falhar)', 'yellow');
  const studentCredentials = await registerStudent();
  
  if (studentCredentials) {
    const result2 = await makeRequest(
      'GET',
      '/api/admin/instructors',
      null,
      studentCredentials.token
    );

    if (result2.status === 403) {
      log('✓ Acesso negado corretamente para não-admin', 'green');
    } else {
      log('✗ Deveria ter retornado erro 403', 'red');
    }
  }
}

async function testSuspendInstructor(adminToken, instructorId) {
  log('\n=== 3. Testando Suspensão de Instrutor ===', 'cyan');

  if (!instructorId) {
    log('✗ ID do instrutor não disponível', 'red');
    return;
  }

  // Teste 3.1: Suspender instrutor
  log('\nTeste 3.1: Suspender instrutor', 'yellow');
  const result1 = await makeRequest(
    'PATCH',
    `/api/admin/instructors/${instructorId}/suspend`,
    { suspend: true },
    adminToken
  );

  if (result1.status === 200) {
    log('✓ Instrutor suspenso com sucesso', 'green');
    log(`  Status: ${result1.data.data.instructor.is_suspended ? 'Suspenso' : 'Ativo'}`, 'blue');
  } else {
    log('✗ Suspensão falhou', 'red');
    log(`  Erro: ${JSON.stringify(result1.data)}`, 'red');
  }

  // Teste 3.2: Reativar instrutor
  log('\nTeste 3.2: Reativar instrutor', 'yellow');
  const result2 = await makeRequest(
    'PATCH',
    `/api/admin/instructors/${instructorId}/suspend`,
    { suspend: false },
    adminToken
  );

  if (result2.status === 200) {
    log('✓ Instrutor reativado com sucesso', 'green');
    log(`  Status: ${result2.data.data.instructor.is_suspended ? 'Suspenso' : 'Ativo'}`, 'blue');
  } else {
    log('✗ Reativação falhou', 'red');
  }

  // Teste 3.3: Tentar suspender sem ser admin
  log('\nTeste 3.3: Tentar suspender sem ser admin (deve falhar)', 'yellow');
  const studentCredentials = await registerStudent();
  
  if (studentCredentials) {
    const result3 = await makeRequest(
      'PATCH',
      `/api/admin/instructors/${instructorId}/suspend`,
      { suspend: true },
      studentCredentials.token
    );

    if (result3.status === 403) {
      log('✓ Acesso negado corretamente para não-admin', 'green');
    } else {
      log('✗ Deveria ter retornado erro 403', 'red');
    }
  }
}

async function testStudentProfile() {
  log('\n=== 4. Testando Perfil de Aluno ===', 'cyan');

  // Registrar um aluno
  const studentCredentials = await registerStudent();
  
  if (!studentCredentials) {
    log('✗ Não foi possível registrar aluno', 'red');
    return;
  }

  // Teste 4.1: Visualizar perfil próprio
  log('\nTeste 4.1: Visualizar perfil próprio', 'yellow');
  const result1 = await makeRequest(
    'GET',
    '/api/students/profile',
    null,
    studentCredentials.token
  );

  if (result1.status === 200) {
    log('✓ Perfil recuperado com sucesso', 'green');
    log(`  Nome: ${result1.data.data.profile.name}`, 'blue');
    log(`  Email: ${result1.data.data.profile.email}`, 'blue');
    log(`  Status da assinatura: ${result1.data.data.profile.subscription_status}`, 'blue');
  } else {
    log('✗ Recuperação de perfil falhou', 'red');
  }

  // Teste 4.2: Atualizar perfil
  log('\nTeste 4.2: Atualizar nome do perfil', 'yellow');
  const result2 = await makeRequest(
    'PATCH',
    '/api/students/profile',
    { name: 'Aluno Teste Atualizado' },
    studentCredentials.token
  );

  if (result2.status === 200) {
    log('✓ Perfil atualizado com sucesso', 'green');
    log(`  Novo nome: ${result2.data.data.profile.name}`, 'blue');
  } else {
    log('✗ Atualização de perfil falhou', 'red');
  }

  // Teste 4.3: Tentar acessar perfil sem autenticação
  log('\nTeste 4.3: Tentar acessar perfil sem autenticação (deve falhar)', 'yellow');
  const result3 = await makeRequest('GET', '/api/students/profile', null, null);

  if (result3.status === 401) {
    log('✓ Acesso negado corretamente sem autenticação', 'green');
  } else {
    log('✗ Deveria ter retornado erro 401', 'red');
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║  Testes de Gestão de Usuários - EAD       ║', 'cyan');
  log('╚════════════════════════════════════════════╝', 'cyan');

  try {
    // Login como admin
    const adminToken = await loginAsAdmin();
    
    if (!adminToken) {
      log('\n✗ Não foi possível fazer login como admin', 'red');
      log('  Certifique-se de que o servidor está rodando e o admin existe', 'yellow');
      return;
    }

    // Aguardar um pouco entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 1. Criar instrutor
    const instructorId = await testCreateInstructor(adminToken);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Listar instrutores
    await testListInstructors(adminToken);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Suspender instrutor
    await testSuspendInstructor(adminToken, instructorId);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Perfil de aluno
    await testStudentProfile();

    log('\n╔════════════════════════════════════════════╗', 'cyan');
    log('║         Testes Concluídos!                 ║', 'cyan');
    log('╚════════════════════════════════════════════╝', 'cyan');

  } catch (error) {
    log(`\n✗ Erro durante os testes: ${error.message}`, 'red');
    log('  Certifique-se de que o servidor está rodando em http://localhost:3000', 'yellow');
    console.error(error);
  }
}

// Executar testes
runTests();
