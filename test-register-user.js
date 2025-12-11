/**
 * Script para testar o cadastro de novo usuário
 */

const axios = require('axios');

async function testRegisterUser() {
  try {
    console.log('🔍 Testando cadastro de novo usuário...\n');

    const timestamp = Date.now();
    const testUser = {
      name: `Test User ${timestamp}`,
      email: `test.user.${timestamp}@test.com`,
      password: 'Test123!@#',
      gdprConsent: true
    };

    console.log('📝 Dados do usuário:');
    console.log(JSON.stringify(testUser, null, 2));
    console.log('');

    const response = await axios.post('http://localhost:3000/api/auth/register', testUser);

    console.log('✅ Cadastro realizado com sucesso!');
    console.log('');
    console.log('📊 Resposta:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro no cadastro:');
    console.error('');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Mensagem:', error.message);
    }
  }
}

testRegisterUser();
