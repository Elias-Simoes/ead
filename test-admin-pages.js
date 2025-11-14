/**
 * Script de Teste - Páginas do Administrador
 * 
 * Este script testa os endpoints necessários para as páginas admin
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Credenciais do admin
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'Admin123!'
};

let adminToken = '';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Login como Admin
async function testAdminLogin() {
  log('\n=== Teste 1: Login como Administrador ===', 'blue');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.data.accessToken) {
      adminToken = response.data.accessToken;
      logSuccess('Login realizado com sucesso');
      logInfo(`Token: ${adminToken.substring(0, 20)}...`);
      logInfo(`Role: ${response.data.user.role}`);
      
      if (response.data.user.role !== 'admin') {
        logWarning('Usuário não é admin!');
        return false;
      }
      
      return true;
    }
  } catch (error) {
    logError(`Erro no login: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 2. Testar Dashboard Metrics
async function testDashboardMetrics() {
  log('\n=== Teste 2: Dashboard - Métricas ===', 'blue');
  
  try {
    const response = await axios.get(`${API_URL}/admin/reports/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    logSuccess('Métricas do dashboard carregadas');
    logInfo(`Assinantes Ativos: ${response.data.totalActiveSubscribers || 0}`);
    logInfo(`Total de Cursos: ${response.data.totalCourses || 0}`);
    logInfo(`Total de Instrutores: ${response.data.totalInstructors || 0}`);
    logInfo(`Aprovações Pendentes: ${response.data.pendingApprovals || 0}`);
    logInfo(`Receita Mensal: R$ ${(response.data.monthlyRevenue || 0).toFixed(2)}`);
    
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      logWarning('Endpoint /admin/reports/overview não implementado ainda');
    } else {
      logError(`Erro: ${error.response?.data?.error?.message || error.message}`);
    }
    return false;
  }
}

// 3. Testar Listagem de Instrutores
async function testListInstructors() {
  log('\n=== Teste 3: Listar Instrutores ===', 'blue');
  
  try {
    const response = await axios.get(`${API_URL}/admin/instructors`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const instructors = response.data;
    logSuccess(`${instructors.length} instrutor(es) encontrado(s)`);
    
    if (instructors.length > 0) {
      instructors.slice(0, 3).forEach((instructor, idx) => {
        logInfo(`${idx + 1}. ${instructor.name} (${instructor.email}) - ${instructor.isSuspended ? 'Suspenso' : 'Ativo'}`);
      });
    }
    
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      logWarning('Endpoint /admin/instructors não implementado ainda');
    } else {
      logError(`Erro: ${error.response?.data?.error?.message || error.message}`);
    }
    return false;
  }
}

// 4. Testar Cursos Pendentes
async function testPendingCourses() {
  log('\n=== Teste 4: Cursos Pendentes de Aprovação ===', 'blue');
  
  try {
    const response = await axios.get(`${API_URL}/courses`, {
      params: { status: 'pending_approval' },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const courses = response.data;
    logSuccess(`${courses.length} curso(s) pendente(s) de aprovação`);
    
    if (courses.length > 0) {
      courses.slice(0, 3).forEach((course, idx) => {
        logInfo(`${idx + 1}. ${course.title} - ${course.category}`);
      });
    } else {
      logInfo('Nenhum curso pendente no momento');
    }
    
    return true;
  } catch (error) {
    logError(`Erro: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 5. Testar Estatísticas de Assinaturas
async function testSubscriptionStats() {
  log('\n=== Teste 5: Estatísticas de Assinaturas ===', 'blue');
  
  try {
    const response = await axios.get(`${API_URL}/admin/subscriptions/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    logSuccess('Estatísticas carregadas');
    logInfo(`Ativas: ${response.data.totalActive || 0}`);
    logInfo(`Suspensas: ${response.data.totalSuspended || 0}`);
    logInfo(`Canceladas: ${response.data.totalCancelled || 0}`);
    logInfo(`MRR: R$ ${(response.data.mrr || 0).toFixed(2)}`);
    logInfo(`Churn Rate: ${((response.data.churnRate || 0) * 100).toFixed(1)}%`);
    
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      logWarning('Endpoint /admin/subscriptions/stats não implementado ainda');
    } else {
      logError(`Erro: ${error.response?.data?.error?.message || error.message}`);
    }
    return false;
  }
}

// 6. Testar Listagem de Assinaturas
async function testListSubscriptions() {
  log('\n=== Teste 6: Listar Assinaturas ===', 'blue');
  
  try {
    const response = await axios.get(`${API_URL}/admin/subscriptions`, {
      params: { page: 1, limit: 5 },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const { data, total, page, totalPages } = response.data;
    logSuccess(`${total} assinatura(s) encontrada(s)`);
    logInfo(`Página ${page} de ${totalPages}`);
    
    if (data && data.length > 0) {
      data.forEach((sub, idx) => {
        logInfo(`${idx + 1}. ${sub.student?.name || 'N/A'} - Status: ${sub.status}`);
      });
    }
    
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      logWarning('Endpoint /admin/subscriptions não implementado ainda');
    } else {
      logError(`Erro: ${error.response?.data?.error?.message || error.message}`);
    }
    return false;
  }
}

// 7. Testar Relatórios
async function testReports() {
  log('\n=== Teste 7: Relatórios ===', 'blue');
  
  const reportTypes = ['overview', 'subscriptions', 'courses', 'financial'];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];
  
  for (const type of reportTypes) {
    try {
      const response = await axios.get(`${API_URL}/admin/reports/${type}`, {
        params: { startDate, endDate },
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      logSuccess(`Relatório "${type}" carregado`);
      
      if (type === 'courses' && response.data.courses?.mostAccessedCourses) {
        logInfo(`Cursos mais acessados: ${response.data.courses.mostAccessedCourses.length}`);
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        logWarning(`Endpoint /admin/reports/${type} não implementado ainda`);
      } else {
        logError(`Erro no relatório "${type}": ${error.response?.data?.error?.message || error.message}`);
      }
    }
    
    await sleep(100);
  }
  
  return true;
}

// Executar todos os testes
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║   TESTE DAS PÁGINAS DO ADMINISTRADOR          ║', 'cyan');
  log('╚════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  };
  
  // Teste 1: Login
  results.total++;
  const loginSuccess = await testAdminLogin();
  if (loginSuccess) {
    results.passed++;
  } else {
    results.failed++;
    log('\n❌ Não foi possível fazer login. Verifique se o backend está rodando e se o usuário admin existe.', 'red');
    log('Execute: node scripts/create-admin.js', 'yellow');
    return;
  }
  
  await sleep(500);
  
  // Teste 2: Dashboard
  results.total++;
  if (await testDashboardMetrics()) results.passed++;
  else results.warnings++;
  await sleep(500);
  
  // Teste 3: Instrutores
  results.total++;
  if (await testListInstructors()) results.passed++;
  else results.warnings++;
  await sleep(500);
  
  // Teste 4: Cursos Pendentes
  results.total++;
  if (await testPendingCourses()) results.passed++;
  else results.failed++;
  await sleep(500);
  
  // Teste 5: Stats de Assinaturas
  results.total++;
  if (await testSubscriptionStats()) results.passed++;
  else results.warnings++;
  await sleep(500);
  
  // Teste 6: Lista de Assinaturas
  results.total++;
  if (await testListSubscriptions()) results.passed++;
  else results.warnings++;
  await sleep(500);
  
  // Teste 7: Relatórios
  results.total++;
  if (await testReports()) results.passed++;
  else results.warnings++;
  
  // Resumo
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║              RESUMO DOS TESTES                 ║', 'cyan');
  log('╚════════════════════════════════════════════════╝', 'cyan');
  log(`\nTotal de testes: ${results.total}`);
  logSuccess(`Passou: ${results.passed}`);
  if (results.failed > 0) logError(`Falhou: ${results.failed}`);
  if (results.warnings > 0) logWarning(`Avisos: ${results.warnings} (endpoints não implementados)`);
  
  log('\n📝 Próximos passos:', 'blue');
  log('1. Inicie o frontend: cd frontend && npm run dev');
  log('2. Acesse: http://localhost:5173/login');
  log('3. Faça login com: admin@example.com / Admin123!');
  log('4. Navegue para: http://localhost:5173/admin/dashboard');
  log('\n📖 Guia completo: TESTE_ADMIN_PAGES_GUIA.md\n');
}

// Executar
runAllTests().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});
