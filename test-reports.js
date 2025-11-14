/**
 * Script de teste para os endpoints de relatórios administrativos
 * Execute com: node test-reports.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    return {
      status: response.status,
      data,
      ok: response.ok,
    };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.message);
    throw error;
  }
}

// Helper to add delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Test state
const testState = {
  adminToken: '',
  studentToken: '',
  instructorToken: '',
};

async function runTests() {
  console.log('\n🧪 TESTE DO MÓDULO DE RELATÓRIOS ADMINISTRATIVOS\n');

  try {
    // Setup: Create admin user and login
    await setupAdminUser();
    await delay(1000);

    // Test 1: Get overview report
    await testOverviewReport();
    await delay(1000);

    // Test 2: Get subscription report
    await testSubscriptionReport();
    await delay(1000);

    // Test 3: Get course report
    await testCourseReport();
    await delay(1000);

    // Test 4: Get financial report
    await testFinancialReport();
    await delay(1000);

    // Test 5: Export report as CSV
    await testExportReportCSV();
    await delay(1000);

    // Test 6: Export report as PDF
    await testExportReportPDF();
    await delay(1000);

    // Test 7: Test access control (non-admin)
    await testAccessControl();
    await delay(1000);

    // Test 8: Test with date filters
    await testDateFilters();

    console.log('\n✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!\n');
  } catch (error) {
    console.error('\n❌ ERRO NOS TESTES:', error.message);
    process.exit(1);
  }
}

async function setupAdminUser() {
  console.log('=== Setup: Criar e autenticar admin ===');

  // Try to login with existing admin
  const loginResult = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@plataforma.com',
      password: 'Admin@123',
    }),
  });

  if (loginResult.ok) {
    testState.adminToken = loginResult.data.accessToken;
    console.log('✓ Admin autenticado com sucesso');
  } else {
    console.error('✗ Falha ao autenticar admin');
    console.error('  Certifique-se de que existe um admin com email: admin@plataforma.com');
    throw new Error('Admin authentication failed');
  }
}

async function testOverviewReport() {
  console.log('\n=== Test 1: Get Overview Report ===');

  const result = await apiRequest('/api/admin/reports/overview', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${testState.adminToken}`,
    },
  });

  if (result.ok) {
    console.log('✓ Overview report retrieved successfully');
    console.log('  Subscriptions:', {
      totalActive: result.data.subscriptions.totalActive,
      newInPeriod: result.data.subscriptions.newInPeriod,
      retentionRate: result.data.subscriptions.retentionRate + '%',
      churnRate: result.data.subscriptions.churnRate + '%',
      mrr: 'R$ ' + result.data.subscriptions.mrr.toFixed(2),
    });
    console.log('  Courses:', result.data.courses);
    console.log('  Students:', result.data.students);
    console.log('  Certificates:', result.data.certificates);
  } else {
    console.error('✗ Failed to get overview report');
    console.error('  Status:', result.status);
    console.error('  Error:', result.data);
    throw new Error('Overview report test failed');
  }
}

async function testSubscriptionReport() {
  console.log('\n=== Test 2: Get Subscription Report ===');

  const result = await apiRequest('/api/admin/reports/subscriptions', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${testState.adminToken}`,
    },
  });

  if (result.ok) {
    console.log('✓ Subscription report retrieved successfully');
    console.log('  Total subscriptions:', result.data.totalSubscriptions);
    console.log('  Active:', result.data.activeSubscriptions);
    console.log('  Suspended:', result.data.suspendedSubscriptions);
    console.log('  Cancelled:', result.data.cancelledSubscriptions);
    console.log('  Plans:', result.data.subscriptionsByPlan.length);
  } else {
    console.error('✗ Failed to get subscription report');
    console.error('  Status:', result.status);
    console.error('  Error:', result.data);
    throw new Error('Subscription report test failed');
  }
}

async function testCourseReport() {
  console.log('\n=== Test 3: Get Course Report ===');

  const result = await apiRequest('/api/admin/reports/courses', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${testState.adminToken}`,
    },
  });

  if (result.ok) {
    console.log('✓ Course report retrieved successfully');
    console.log('  Total courses:', result.data.totalCourses);
    console.log('  Published courses:', result.data.publishedCourses);
    console.log('  Most accessed courses:', result.data.mostAccessedCourses.length);
    console.log('  Categories:', result.data.coursesByCategory.length);
    
    if (result.data.mostAccessedCourses.length > 0) {
      console.log('  Top course:', {
        title: result.data.mostAccessedCourses[0].courseTitle,
        accesses: result.data.mostAccessedCourses[0].totalAccesses,
        completionRate: result.data.mostAccessedCourses[0].completionRate + '%',
      });
    }
  } else {
    console.error('✗ Failed to get course report');
    console.error('  Status:', result.status);
    console.error('  Error:', result.data);
    throw new Error('Course report test failed');
  }
}

async function testFinancialReport() {
  console.log('\n=== Test 4: Get Financial Report ===');

  const result = await apiRequest('/api/admin/reports/financial', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${testState.adminToken}`,
    },
  });

  if (result.ok) {
    console.log('✓ Financial report retrieved successfully');
    console.log('  Total revenue: R$', result.data.totalRevenue.toFixed(2));
    console.log('  Revenue in period: R$', result.data.revenueInPeriod.toFixed(2));
    console.log('  MRR: R$', result.data.mrr.toFixed(2));
    console.log('  Average revenue per user: R$', result.data.averageRevenuePerUser.toFixed(2));
    console.log('  Projected MRR: R$', result.data.projectedMRR.toFixed(2));
    
    if (result.data.gatewayData) {
      console.log('  Gateway data:', {
        totalPayments: result.data.gatewayData.totalPaymentsFromGateway,
        successRate: result.data.gatewayData.paymentSuccessRate + '%',
        refundRate: result.data.gatewayData.refundRate + '%',
      });
    }
  } else {
    console.error('✗ Failed to get financial report');
    console.error('  Status:', result.status);
    console.error('  Error:', result.data);
    throw new Error('Financial report test failed');
  }
}

async function testExportReportCSV() {
  console.log('\n=== Test 5: Export Report as CSV ===');

  const result = await apiRequest('/api/admin/reports/export?format=csv&type=overview', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${testState.adminToken}`,
    },
  });

  if (result.status === 200) {
    console.log('✓ CSV export successful');
    console.log('  Response received (CSV data)');
  } else {
    console.error('✗ Failed to export CSV');
    console.error('  Status:', result.status);
    console.error('  Error:', result.data);
    throw new Error('CSV export test failed');
  }
}

async function testExportReportPDF() {
  console.log('\n=== Test 6: Export Report as PDF ===');

  const result = await apiRequest('/api/admin/reports/export?format=pdf&type=financial', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${testState.adminToken}`,
    },
  });

  if (result.status === 200) {
    console.log('✓ PDF export successful');
    console.log('  Response received (PDF data)');
  } else {
    console.error('✗ Failed to export PDF');
    console.error('  Status:', result.status);
    console.error('  Error:', result.data);
    throw new Error('PDF export test failed');
  }
}

async function testAccessControl() {
  console.log('\n=== Test 7: Test Access Control (Non-Admin) ===');

  // Try to register a student
  const studentEmail = `student-test-${Date.now()}@test.com`;
  const registerResult = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: studentEmail,
      name: 'Test Student',
      password: 'Student@123',
      gdprConsent: true,
    }),
  });

  if (registerResult.ok) {
    testState.studentToken = registerResult.data.accessToken;
    console.log('✓ Student created and authenticated');

    // Try to access reports with student token (should fail)
    const reportResult = await apiRequest('/api/admin/reports/overview', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${testState.studentToken}`,
      },
    });

    if (reportResult.status === 403) {
      console.log('✓ Access correctly denied for non-admin user');
    } else {
      console.error('✗ Non-admin user should not have access to reports');
      throw new Error('Access control test failed');
    }
  } else {
    console.log('⚠ Could not create student for access control test');
  }
}

async function testDateFilters() {
  console.log('\n=== Test 8: Test Date Filters ===');

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const endDate = new Date();

  const result = await apiRequest(
    `/api/admin/reports/overview?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${testState.adminToken}`,
      },
    }
  );

  if (result.ok) {
    console.log('✓ Report with date filters retrieved successfully');
    console.log('  Period:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);
    console.log('  New subscribers in period:', result.data.subscriptions.newInPeriod);
  } else {
    console.error('✗ Failed to get report with date filters');
    console.error('  Status:', result.status);
    console.error('  Error:', result.data);
    throw new Error('Date filters test failed');
  }
}

// Run tests
runTests();
