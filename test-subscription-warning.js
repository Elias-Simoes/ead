const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testSubscriptionWarning() {
  console.log('=== TESTE DE AVISO DE ASSINATURA VENCIDA ===\n');

  try {
    // 1. Login com estudante expirado
    console.log('1. Fazendo login com estudante expirado...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'expired@example.com',
      password: 'Expired123!'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✓ Login realizado com sucesso');
    console.log('Token:', token.substring(0, 20) + '...\n');

    // 2. Buscar dados do usuário
    console.log('2. Buscando dados do usuário (/auth/me)...');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✓ Dados do usuário recebidos:');
    console.log(JSON.stringify(meResponse.data, null, 2));
    console.log('');

    // 3. Verificar se os dados de assinatura estão presentes
    console.log('3. Verificando dados de assinatura...');
    const userData = meResponse.data;
    
    if (!userData.subscriptionStatus) {
      console.log('✗ ERRO: subscriptionStatus não está presente na resposta!');
      console.log('  O componente SubscriptionWarning precisa deste campo.');
      return;
    }
    
    if (!userData.subscriptionExpiresAt) {
      console.log('✗ ERRO: subscriptionExpiresAt não está presente na resposta!');
      console.log('  O componente SubscriptionWarning precisa deste campo.');
      return;
    }

    console.log('✓ subscriptionStatus:', userData.subscriptionStatus);
    console.log('✓ subscriptionExpiresAt:', userData.subscriptionExpiresAt);
    console.log('');

    // 4. Verificar se a assinatura está expirada
    console.log('4. Verificando se a assinatura está expirada...');
    const expiresAt = new Date(userData.subscriptionExpiresAt);
    const now = new Date();
    const isExpired = expiresAt < now;
    
    console.log('Data de expiração:', expiresAt.toISOString());
    console.log('Data atual:', now.toISOString());
    console.log('Está expirada?', isExpired ? 'SIM' : 'NÃO');
    console.log('');

    // 5. Calcular dias desde a expiração
    if (isExpired) {
      const daysExpired = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));
      console.log('5. Dias desde a expiração:', daysExpired);
      console.log('');
    }

    // 6. Verificar lógica do componente
    console.log('6. Verificando lógica do SubscriptionWarning...');
    const isInactive = userData.subscriptionStatus === 'inactive' || userData.subscriptionStatus === 'cancelled';
    const shouldShowWarning = isInactive || isExpired;
    
    console.log('Status é inactive/cancelled?', isInactive);
    console.log('Assinatura expirada?', isExpired);
    console.log('Deve mostrar aviso?', shouldShowWarning ? 'SIM ✓' : 'NÃO ✗');
    console.log('');

    if (shouldShowWarning) {
      console.log('✓ SUCESSO: O aviso de assinatura vencida DEVE aparecer!');
      console.log('  - O backend está retornando os dados corretos');
      console.log('  - A lógica do componente deve detectar a expiração');
    } else {
      console.log('✗ PROBLEMA: O aviso NÃO deve aparecer com estes dados');
      console.log('  Verifique se o usuário de teste está configurado corretamente');
    }

  } catch (error) {
    console.error('✗ Erro no teste:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\nDica: Verifique se o usuário expired@example.com existe');
      console.log('Execute: node create-expired-student.js');
    }
  }
}

testSubscriptionWarning();
