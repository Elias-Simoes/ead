const axios = require('axios');

async function debugCourseResponse() {
  try {
    console.log('🔍 Debugando resposta completa da API...\n');
    
    // Fazer login
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Instructor123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login bem-sucedido\n');
    
    // Buscar curso
    const courseId = '65cb2e3f-819f-456a-8efc-3d041bbd1883';
    const courseResponse = await axios.get(`http://localhost:3000/api/courses/${courseId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📦 Estrutura completa da resposta:');
    console.log(JSON.stringify(courseResponse.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Erro:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

debugCourseResponse();
