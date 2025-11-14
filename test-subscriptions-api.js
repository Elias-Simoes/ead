const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testSubscriptionsAPI() {
  try {
    console.log('🔐 Fazendo login como admin...\n');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login bem-sucedido!');
    console.log('Token:', token.substring(0, 50) + '...\n');

    console.log('📊 Testando GET /admin/subscriptions...\n');
    
    const subsResponse = await axios.get(`${API_URL}/admin/subscriptions`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📦 Estrutura da resposta:');
    console.log(JSON.stringify(subsResponse.data, null, 2));
    
    console.log('\n🔍 Análise:');
    console.log('- response.data:', typeof subsResponse.data);
    console.log('- response.data.subscriptions:', typeof subsResponse.data.subscriptions);
    console.log('- response.data.data:', typeof subsResponse.data.data);
    
    if (subsResponse.data.subscriptions) {
      console.log('- É array?', Array.isArray(subsResponse.data.subscriptions));
      console.log('- Quantidade:', subsResponse.data.subscriptions.length);
    }
    
    if (subsResponse.data.data) {
      console.log('- response.data.data.subscriptions:', typeof subsResponse.data.data?.subscriptions);
      if (subsResponse.data.data.subscriptions) {
        console.log('- É array?', Array.isArray(subsResponse.data.data.subscriptions));
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testSubscriptionsAPI();
