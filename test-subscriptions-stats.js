const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testStatsAPI() {
  try {
    console.log('🔐 Fazendo login como admin...\n');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login bem-sucedido!\n');

    console.log('📊 Testando GET /admin/subscriptions/stats...\n');
    
    const statsResponse = await axios.get(`${API_URL}/admin/subscriptions/stats`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📦 Estrutura da resposta:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
    
    console.log('\n🔍 Análise:');
    console.log('- response.data:', typeof statsResponse.data);
    console.log('- response.data.data:', typeof statsResponse.data.data);
    
    if (statsResponse.data.data) {
      console.log('- totalActive:', statsResponse.data.data.totalActive);
      console.log('- totalSuspended:', statsResponse.data.data.totalSuspended);
      console.log('- totalCancelled:', statsResponse.data.data.totalCancelled);
      console.log('- mrr:', statsResponse.data.data.mrr);
      console.log('- churnRate:', statsResponse.data.data.churnRate);
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testStatsAPI();
