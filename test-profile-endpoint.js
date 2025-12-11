/**
 * Script para testar o endpoint /students/profile
 */

const axios = require('axios');

async function testProfileEndpoint() {
  try {
    console.log('🔍 Testando endpoint /students/profile...\n');

    // Primeiro fazer login
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test.student.1765284983885@test.com',
      password: 'Test123!@#'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login realizado com sucesso');
    console.log('');

    // Buscar perfil
    const profileResponse = await axios.get('http://localhost:3000/api/students/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const responseData = profileResponse.data.data;
    const profile = responseData.profile || responseData;

    console.log('📊 Estrutura da resposta:');
    console.log(JSON.stringify(profileResponse.data, null, 2));
    console.log('');

    console.log('📊 Dados do perfil:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Nome:                    ${profile.name}`);
    console.log(`  Email:                   ${profile.email}`);
    console.log(`  Subscription Status:     ${profile.subscriptionStatus || profile.subscription_status}`);
    console.log(`  Subscription Expires At: ${profile.subscriptionExpiresAt || profile.subscription_expires_at || 'N/A'}`);
    console.log(`  Total Study Time:        ${profile.totalStudyTime || profile.total_study_time || 0}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (profile.subscriptionStatus === 'active' || profile.subscription_status === 'active') {
      console.log('✅ Endpoint retornando status ACTIVE corretamente!');
      console.log('   O problema é cache no frontend.\n');
    } else {
      console.log('❌ Endpoint retornando status INCORRETO!');
      console.log(`   Status atual: ${profile.subscriptionStatus || profile.subscription_status}`);
      console.log('   Deveria ser: active\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testProfileEndpoint();
