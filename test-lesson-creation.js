const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api';

async function test() {
  try {
    // Login
    console.log('🔐 Login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    const token = loginRes.data.data.tokens.accessToken;
    
    // Criar curso
    console.log('📚 Criando curso...');
    const courseRes = await axios.post(
      `${API_URL}/courses`,
      { title: 'Teste', description: 'Teste', workload: 40, category: 'Tech' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const courseId = courseRes.data.data.course.id;
    console.log('✅ Curso:', courseId);
    
    // Criar módulo
    console.log('📦 Criando módulo...');
    const moduleRes = await axios.post(
      `${API_URL}/courses/${courseId}/modules`,
      { title: 'Módulo 1', description: 'Teste', order_index: 1 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const moduleId = moduleRes.data.data?.module?.id || moduleRes.data.data?.id || moduleRes.data.id;
    console.log('✅ Módulo:', moduleId);
    console.log('Resposta módulo:', JSON.stringify(moduleRes.data, null, 2));
    
    // Criar aula
    console.log('📝 Criando aula...');
    console.log('URL:', `${API_URL}/courses/modules/${moduleId}/lessons`);
    const lessonRes = await axios.post(
      `${API_URL}/courses/modules/${moduleId}/lessons`,
      { title: 'Aula 1', description: 'Teste', type: 'text', content: 'Teste', order_index: 1 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Aula criada');
    console.log('Resposta:', JSON.stringify(lessonRes.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('URL:', error.config.url);
    }
  }
}

test();
