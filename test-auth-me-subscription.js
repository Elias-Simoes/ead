const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAuthMe() {
  console.log('🧪 Testando endpoint /auth/me com informações de assinatura\n');

  try {
    // 1. Login como estudante
    console.log('1️⃣ Fazendo login como estudante...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'student@example.com',
      password: 'Student123!'
    });

    const { accessToken } = loginResponse.data.data.tokens;
    console.log('✅ Login bem-sucedido\n');

    // 2. Buscar informações do usuário
    console.log('2️⃣ Buscando informações do usuário (/auth/me)...');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const userData = meResponse.data;
    console.log('✅ Dados do usuário recebidos:\n');
    console.log(JSON.stringify(userData, null, 2));

    // 3. Verificar campos de assinatura
    console.log('\n3️⃣ Verificando campos de assinatura...');
    
    if (userData.role === 'student') {
      if (userData.subscriptionStatus) {
        console.log(`✅ subscriptionStatus: ${userData.subscriptionStatus}`);
      } else {
        console.log('❌ subscriptionStatus não encontrado');
      }

      if (userData.subscriptionExpiresAt) {
        const expiresAt = new Date(userData.subscriptionExpiresAt);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
        
        console.log(`✅ subscriptionExpiresAt: ${userData.subscriptionExpiresAt}`);
        console.log(`   Expira em: ${daysUntilExpiry} dias`);
        
        if (expiresAt < now) {
          console.log('   ⚠️  ASSINATURA EXPIRADA');
        } else {
          console.log('   ✅ Assinatura ativa');
        }
      } else {
        console.log('❌ subscriptionExpiresAt não encontrado');
      }
    } else {
      console.log(`ℹ️  Usuário não é estudante (role: ${userData.role})`);
    }

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro no teste:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Executar teste
testAuthMe();
