const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testLogin() {
  try {
    console.log('🔐 Testando login...\n');
    
    const credentials = {
      email: 'instructor@example.com',
      password: 'Senha123!'
    };
    
    console.log('Credenciais:', credentials);
    
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    
    console.log('\n✅ Login bem-sucedido!');
    console.log('Status:', response.status);
    console.log('Resposta completa:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Erro no login:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Mensagem:', error.response.data);
    } else if (error.request) {
      console.error('Sem resposta do servidor');
      console.error('Request:', error.request);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testLogin();
