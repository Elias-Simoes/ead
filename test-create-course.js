const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testCreateCourse() {
  try {
    console.log('🔐 Fazendo login como instrutor...\n');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Instructor123!'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login bem-sucedido!\n');

    console.log('📚 Criando curso...\n');
    
    const courseData = {
      title: 'Curso de React Avançado',
      description: 'Aprenda React do zero ao avançado com projetos práticos',
      category: 'Programação',
      workload: 40,
      coverImage: 'https://via.placeholder.com/400x300'
    };

    const courseResponse = await axios.post(`${API_URL}/courses`, courseData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Curso criado com sucesso!');
    console.log('\n📦 Dados do curso:');
    console.log(JSON.stringify(courseResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('URL:', error.config?.url);
    }
  }
}

testCreateCourse();
