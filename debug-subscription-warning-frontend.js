const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function debugFrontendWarning() {
  console.log('=== DEBUG: AVISO DE ASSINATURA NO FRONTEND ===\n');

  try {
    // 1. Login
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'expired@example.com',
      password: 'Expired123!'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    const userFromLogin = loginResponse.data.data.user;
    
    console.log('✓ Login realizado');
    console.log('Dados do usuário no login:');
    console.log(JSON.stringify(userFromLogin, null, 2));
    console.log('');

    // 2. Verificar /auth/me
    console.log('2. Verificando /auth/me...');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const userFromMe = meResponse.data;
    console.log('✓ Dados do /auth/me:');
    console.log(JSON.stringify(userFromMe, null, 2));
    console.log('');

    // 3. Análise dos dados
    console.log('3. ANÁLISE DOS DADOS:');
    console.log('');
    
    console.log('a) Dados necessários para SubscriptionWarning:');
    console.log('   - user.role:', userFromMe.role);
    console.log('   - user.subscriptionStatus:', userFromMe.subscriptionStatus);
    console.log('   - user.subscriptionExpiresAt:', userFromMe.subscriptionExpiresAt);
    console.log('');

    console.log('b) Verificação da lógica do componente:');
    
    // Verificar se é estudante
    const isStudent = userFromMe.role === 'student';
    console.log('   - É estudante?', isStudent ? 'SIM ✓' : 'NÃO ✗');
    
    if (!isStudent) {
      console.log('   ⚠️  Componente não será exibido (não é estudante)');
      return;
    }

    // Verificar se está inativo
    const isInactive = userFromMe.subscriptionStatus === 'inactive' || 
                       userFromMe.subscriptionStatus === 'cancelled';
    console.log('   - Status é inactive/cancelled?', isInactive ? 'SIM ✓' : 'NÃO ✗');

    // Verificar se está expirado
    let isExpired = false;
    if (userFromMe.subscriptionExpiresAt) {
      const expiresAt = new Date(userFromMe.subscriptionExpiresAt);
      const now = new Date();
      isExpired = expiresAt < now;
      console.log('   - Data de expiração:', expiresAt.toISOString());
      console.log('   - Data atual:', now.toISOString());
      console.log('   - Está expirado?', isExpired ? 'SIM ✓' : 'NÃO ✗');
    } else {
      console.log('   - subscriptionExpiresAt não definido');
    }

    console.log('');
    console.log('c) Resultado final:');
    const shouldShow = isInactive || isExpired;
    console.log('   - Deve mostrar aviso?', shouldShow ? 'SIM ✓' : 'NÃO ✗');
    console.log('');

    if (shouldShow) {
      // Calcular mensagem
      let daysExpired = 0;
      if (userFromMe.subscriptionExpiresAt) {
        const expiredDate = new Date(userFromMe.subscriptionExpiresAt);
        const today = new Date();
        daysExpired = Math.floor((today.getTime() - expiredDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      console.log('d) Mensagem que deve aparecer:');
      console.log('   Título:', isExpired ? 'Assinatura Expirada' : 'Assinatura Inativa');
      if (isExpired && daysExpired > 0) {
        console.log(`   Texto: Sua assinatura expirou há ${daysExpired} ${daysExpired === 1 ? 'dia' : 'dias'}.`);
      } else {
        console.log('   Texto: Sua assinatura está inativa.');
      }
      console.log('');

      console.log('✅ CONCLUSÃO: O aviso DEVE aparecer no frontend!');
      console.log('');
      console.log('📋 CHECKLIST PARA VERIFICAR NO NAVEGADOR:');
      console.log('   1. Abra http://localhost:5173');
      console.log('   2. Faça login com expired@example.com / Expired123!');
      console.log('   3. Você deve ser redirecionado para /courses');
      console.log('   4. Deve aparecer um banner amarelo no topo da página');
      console.log('   5. O banner deve dizer "Assinatura Expirada"');
      console.log(`   6. Deve mostrar "expirou há ${daysExpired} dias"`);
      console.log('');
      console.log('❓ SE O AVISO NÃO APARECER:');
      console.log('   1. Abra o DevTools (F12)');
      console.log('   2. Vá na aba Console');
      console.log('   3. Digite: localStorage.getItem("accessToken")');
      console.log('   4. Verifique se há um token');
      console.log('   5. Digite: useAuthStore.getState().user');
      console.log('   6. Verifique se subscriptionStatus e subscriptionExpiresAt estão presentes');
      console.log('');
      console.log('🔧 POSSÍVEIS PROBLEMAS:');
      console.log('   - O componente SubscriptionWarning não está importado na página');
      console.log('   - O AuthContext não está propagando os dados corretamente');
      console.log('   - O checkAuth() não está sendo chamado após o login');
      console.log('   - Há um erro de renderização no componente');
    } else {
      console.log('⚠️  O aviso NÃO deve aparecer com estes dados');
    }

  } catch (error) {
    console.error('✗ Erro:', error.response?.data || error.message);
  }
}

debugFrontendWarning();
