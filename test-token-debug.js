const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api';

async function testToken() {
  try {
    // Login
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    
    console.log('✅ Login realizado');
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Testar criação de curso
    console.log('\n📚 Testando criação de curso...');
    const courseResponse = await axios.post(
      `${API_URL}/courses`,
      {
        title: 'Curso Teste',
        description: 'Teste',
        workload: 40,
        category: 'Tecnologia'
      },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Curso criado');
    console.log('Resposta:', JSON.stringify(courseResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers enviados:', error.config.headers);
    }
  }
}

testToken();
