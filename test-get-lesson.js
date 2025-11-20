const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// ID da aula que você está tentando editar (pegar da URL do navegador)
const LESSON_ID = '7874cf97-90b7-4374-8d55-f92bce17d8cf'; // Aula 4 com conteúdo

async function testGetLesson() {
  try {
    console.log('🔍 Buscando aula:', LESSON_ID);
    
    // Fazer login primeiro
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    
    const token = loginRes.data.data.tokens.accessToken;
    console.log('✅ Login realizado');
    console.log('Token:', token.substring(0, 30) + '...');
    
    // Buscar a aula
    console.log('\n🔍 Buscando aula na rota:', `${API_URL}/courses/lessons/${LESSON_ID}`);
    const lessonRes = await axios.get(`${API_URL}/courses/lessons/${LESSON_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n📝 Dados da aula retornados:');
    console.log(JSON.stringify(lessonRes.data.data, null, 2));
    
    // Buscar recursos da aula
    try {
      const resourcesRes = await axios.get(`${API_URL}/courses/lessons/${LESSON_ID}/resources`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('\n📎 Recursos da aula:');
      console.log(JSON.stringify(resourcesRes.data.data, null, 2));
    } catch (err) {
      console.log('\n⚠️ Erro ao buscar recursos:', err.response?.data || err.message);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testGetLesson();
