/**
 * Teste Simplificado - Módulo de Assinaturas
 * 
 * Versão simplificada com delays para evitar rate limiting
 * 
 * Uso: node test-subscriptions-simple.js
 */

require('dotenv').config();
const API_URL = 'http://localhost:3000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return { status: response.status, data, success: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, success: false };
  }
}

async function runTest() {
  console.log(`\n${colors.bold}${colors.blue}🧪 TESTE SIMPLIFICADO DE ASSINATURAS${colors.reset}\n`);

  const testEmail = `test-${Date.now()}@example.com`;
  let token = '';
  let userId = '';

  // 1. Registrar usuário
  log('\n1️⃣  Registrando usuário...', 'yellow');
  const registerResult = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Teste Assinatura',
      email: testEmail,
      password: 'Test@123',
      gdprConsent: true
    })
  });

  if (registerResult.success) {
    logSuccess(`Usuário registrado: ${testEmail}`);
  } else {
    logError(`Falha no registro: ${JSON.stringify(registerResult.data)}`);
    process.exit(1);
  }

  // Aguardar para evitar rate limit
  logInfo('Aguardando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 2. Fazer login
  log('\n2️⃣  Fazendo login...', 'yellow');
  const loginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'Test@123'
    })
  });

  if (loginResult.success) {
    token = loginResult.data.data.tokens.accessToken;
    userId = loginResult.data.data.user.id;
    logSuccess('Login realizado com sucesso');
    logInfo(`User ID: ${userId}`);
  } else {
    logError(`Falha no login: ${JSON.stringify(loginResult.data)}`);
    process.exit(1);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Listar planos
  log('\n3️⃣  Listando planos disponíveis...', 'yellow');
  const plansResult = await apiRequest('/subscriptions/plans', {
    headers: { Authorization: `Bearer ${token}` }
  });

  let planId = '';
  if (plansResult.success && plansResult.data.length > 0) {
    planId = plansResult.data[0].id;
    logSuccess(`Planos encontrados: ${plansResult.data.length}`);
    logInfo(`Usando plano: ${plansResult.data[0].name} - R$ ${plansResult.data[0].price}`);
  } else {
    logError('Nenhum plano encontrado');
    process.exit(1);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 4. Criar assinatura
  log('\n4️⃣  Criando assinatura...', 'yellow');
  const subscriptionResult = await apiRequest('/subscriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ planId })
  });

  if (subscriptionResult.success) {
    logSuccess('Checkout criado com sucesso!');
    logInfo(`URL: ${subscriptionResult.data.checkoutUrl.substring(0, 50)}...`);
    logInfo(`Session ID: ${subscriptionResult.data.sessionId}`);
  } else {
    logError(`Falha ao criar assinatura: ${JSON.stringify(subscriptionResult.data)}`);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 5. Verificar assinatura atual
  log('\n5️⃣  Verificando assinatura atual...', 'yellow');
  const currentResult = await apiRequest('/subscriptions/current', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (currentResult.success) {
    logSuccess('Assinatura encontrada');
    logInfo(`Status: ${currentResult.data.status}`);
  } else if (currentResult.status === 404) {
    logInfo('Nenhuma assinatura ativa (esperado antes do pagamento)');
  } else {
    logError(`Erro: ${JSON.stringify(currentResult.data)}`);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 6. Testar validação
  log('\n6️⃣  Testando validação de erros...', 'yellow');
  const invalidResult = await apiRequest('/subscriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({})
  });

  if (invalidResult.status === 400) {
    logSuccess('Validação de erro funcionando corretamente');
  } else {
    logError('Validação não está funcionando como esperado');
  }

  // Resumo
  console.log(`\n${colors.bold}${colors.green}✨ TESTE CONCLUÍDO COM SUCESSO!${colors.reset}\n`);
  console.log(`📧 Email de teste: ${testEmail}`);
  console.log(`🆔 User ID: ${userId}`);
  console.log(`📦 Plan ID: ${planId}`);
  console.log(`\n${colors.yellow}💡 Próximos passos:${colors.reset}`);
  console.log(`   1. Acesse a URL do checkout para completar o pagamento`);
  console.log(`   2. Use o Stripe CLI para simular webhooks`);
  console.log(`   3. Verifique a assinatura novamente após o pagamento\n`);
}

// Verificar se fetch está disponível
if (typeof fetch === 'undefined') {
  console.error('❌ Este teste requer Node.js 18+');
  process.exit(1);
}

runTest().catch(error => {
  console.error(`${colors.red}Erro fatal: ${error.message}${colors.reset}`);
  process.exit(1);
});
