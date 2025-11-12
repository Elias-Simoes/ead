/**
 * Script de teste para os endpoints de autenticação
 * Execute com: node test-auth.js
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

async function makeRequest(method, endpoint, body = null) {
  const url = `${baseUrl}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

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

async function testHealthCheck() {
  log('\n=== 1. Testando Health Check ===', 'cyan');
  const result = await makeRequest('GET', '/health');
  
  if (result.status === 200) {
    log('✓ Health check passou', 'green');
    log(`  Status: ${result.data.status}`, 'blue');
  } else {
    log('✗ Health check falhou', 'red');
  }
  
  return result;
}

async function testRegister() {
  log('\n=== 2. Testando Registro de Usuário ===', 'cyan');
  
  // Teste 1: Registro válido
  log('\nTeste 2.1: Registro com dados válidos', 'yellow');
  const validUser = {
    email: `test${Date.now()}@example.com`,
    name: 'Usuário Teste',
    password: 'SecurePass123!',
    gdprConsent: true,
  };
  
  const result1 = await makeRequest('POST', '/api/auth/register', validUser);
  
  if (result1.status === 201) {
    log('✓ Registro bem-sucedido', 'green');
    log(`  Email: ${validUser.email}`, 'blue');
    log(`  Access Token: ${result1.data.data.accessToken.substring(0, 20)}...`, 'blue');
  } else {
    log('✗ Registro falhou', 'red');
    log(`  Erro: ${JSON.stringify(result1.data)}`, 'red');
  }
  
  // Teste 2: Registro duplicado
  log('\nTeste 2.2: Registro com email duplicado (deve falhar)', 'yellow');
  const result2 = await makeRequest('POST', '/api/auth/register', validUser);
  
  if (result2.status === 409) {
    log('✓ Erro de duplicação detectado corretamente', 'green');
  } else {
    log('✗ Deveria ter retornado erro 409', 'red');
  }
  
  // Teste 3: Senha fraca
  log('\nTeste 2.3: Registro com senha fraca (deve falhar)', 'yellow');
  const weakPassword = {
    email: `weak${Date.now()}@example.com`,
    name: 'Senha Fraca',
    password: '123456',
    gdprConsent: true,
  };
  
  const result3 = await makeRequest('POST', '/api/auth/register', weakPassword);
  
  if (result3.status === 400) {
    log('✓ Senha fraca rejeitada corretamente', 'green');
    if (result3.data.error && result3.data.error.details) {
      log(`  Erros de validação: ${JSON.stringify(result3.data.error.details)}`, 'blue');
    }
  } else {
    log('✗ Deveria ter rejeitado senha fraca', 'red');
    log(`  Status recebido: ${result3.status}`, 'red');
    log(`  Resposta: ${JSON.stringify(result3.data)}`, 'red');
  }
  
  return { email: validUser.email, password: validUser.password };
}

async function testLogin(credentials) {
  log('\n=== 3. Testando Login ===', 'cyan');
  
  // Teste 1: Login válido
  log('\nTeste 3.1: Login com credenciais válidas', 'yellow');
  const result1 = await makeRequest('POST', '/api/auth/login', credentials);
  
  let tokens = null;
  if (result1.status === 200) {
    log('✓ Login bem-sucedido', 'green');
    log(`  User ID: ${result1.data.data.user.id}`, 'blue');
    log(`  Role: ${result1.data.data.user.role}`, 'blue');
    tokens = result1.data.data.tokens;
  } else {
    log('✗ Login falhou', 'red');
    log(`  Erro: ${JSON.stringify(result1.data)}`, 'red');
  }
  
  // Teste 2: Login com senha errada
  log('\nTeste 3.2: Login com senha incorreta (deve falhar)', 'yellow');
  const result2 = await makeRequest('POST', '/api/auth/login', {
    email: credentials.email,
    password: 'WrongPassword123!',
  });
  
  if (result2.status === 401) {
    log('✓ Credenciais inválidas detectadas corretamente', 'green');
  } else {
    log('✗ Deveria ter retornado erro 401', 'red');
  }
  
  return tokens;
}

async function testRefreshToken(refreshToken) {
  log('\n=== 4. Testando Refresh Token ===', 'cyan');
  
  if (!refreshToken) {
    log('✗ Refresh token não disponível', 'red');
    return null;
  }
  
  log('\nTeste 4.1: Renovar access token', 'yellow');
  const result = await makeRequest('POST', '/api/auth/refresh', {
    refreshToken,
  });
  
  if (result.status === 200) {
    log('✓ Token renovado com sucesso', 'green');
    log(`  Novo Access Token: ${result.data.data.accessToken.substring(0, 20)}...`, 'blue');
    return result.data.data;
  } else {
    log('✗ Renovação falhou', 'red');
    log(`  Erro: ${JSON.stringify(result.data)}`, 'red');
    return null;
  }
}

async function testForgotPassword(email) {
  log('\n=== 5. Testando Forgot Password ===', 'cyan');
  
  log('\nTeste 5.1: Solicitar reset de senha', 'yellow');
  const result = await makeRequest('POST', '/api/auth/forgot-password', {
    email,
  });
  
  if (result.status === 200) {
    log('✓ Solicitação de reset enviada', 'green');
    log('  Nota: Em produção, o token seria enviado por email', 'blue');
  } else {
    log('✗ Solicitação falhou', 'red');
  }
}

async function testLogout(refreshToken) {
  log('\n=== 6. Testando Logout ===', 'cyan');
  
  if (!refreshToken) {
    log('✗ Refresh token não disponível', 'red');
    return;
  }
  
  log('\nTeste 6.1: Fazer logout', 'yellow');
  const result = await makeRequest('POST', '/api/auth/logout', {
    refreshToken,
  });
  
  if (result.status === 200) {
    log('✓ Logout bem-sucedido', 'green');
  } else {
    log('✗ Logout falhou', 'red');
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║  Testes de Autenticação - Plataforma EAD  ║', 'cyan');
  log('╚════════════════════════════════════════════╝', 'cyan');
  
  try {
    // 1. Health Check
    await testHealthCheck();
    
    // 2. Registro
    const credentials = await testRegister();
    
    // Aguardar um pouco para evitar problemas de timing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Login
    const tokens = await testLogin(credentials);
    
    // 4. Refresh Token
    if (tokens) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newTokens = await testRefreshToken(tokens.refreshToken);
      
      // 5. Forgot Password
      await testForgotPassword(credentials.email);
      
      // 6. Logout
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testLogout(newTokens ? newTokens.refreshToken : tokens.refreshToken);
    }
    
    log('\n╔════════════════════════════════════════════╗', 'cyan');
    log('║         Testes Concluídos!                 ║', 'cyan');
    log('╚════════════════════════════════════════════╝', 'cyan');
    
  } catch (error) {
    log(`\n✗ Erro durante os testes: ${error.message}`, 'red');
    log('  Certifique-se de que o servidor está rodando em http://localhost:3000', 'yellow');
  }
}

// Executar testes
runTests();
