const axios = require('axios');

async function testPlansAPI() {
  try {
    console.log('🔍 Testando API de planos...\n');

    // Primeiro fazer login como estudante
    console.log('1️⃣ Fazendo login como estudante...');
    const loginResponse = await axios.post('http://127.0.0.1:3000/api/auth/login', {
      email: 'expired@example.com',
      password: 'Expired123!'
    }, {
      timeout: 10000
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login realizado com sucesso');
    console.log(`Token: ${token.substring(0, 20)}...`);

    // Testar endpoint de planos
    console.log('\n2️⃣ Buscando planos disponíveis...');
    const plansResponse = await axios.get('http://127.0.0.1:3000/api/subscriptions/plans', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`✅ Resposta recebida: Status ${plansResponse.status}`);
    console.log(`📊 Total de planos: ${plansResponse.data.length}`);
    
    if (plansResponse.data.length > 0) {
      console.log('\n📋 Planos disponíveis:');
      plansResponse.data.forEach(plan => {
        console.log(`  - ${plan.name}: ${plan.currency} ${plan.price}/${plan.interval}`);
      });
    } else {
      console.log('\n⚠️  Nenhum plano retornado pela API!');
    }

  } catch (error) {
    console.error('❌ Erro ao testar API:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPlansAPI();
