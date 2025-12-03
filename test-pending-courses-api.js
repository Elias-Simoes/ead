const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testPendingCoursesAPI() {
  try {
    console.log('🧪 Testando API de cursos pendentes...\n');

    // 1. Login como admin
    console.log('1️⃣ Fazendo login como admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!'
    });

    console.log('Resposta do login:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('Token:', token);
    console.log('✅ Login realizado com sucesso\n');

    // 2. Buscar cursos com status pending_approval
    console.log('2️⃣ Buscando cursos com status=pending_approval...');
    const coursesResponse = await axios.get(`${API_URL}/courses`, {
      params: { status: 'pending_approval' },
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📊 Resposta da API:');
    console.log(JSON.stringify(coursesResponse.data, null, 2));
    console.log('\n');

    if (coursesResponse.data.data.courses.length > 0) {
      console.log('✅ Cursos pendentes encontrados:');
      coursesResponse.data.data.courses.forEach(course => {
        console.log(`  - ${course.title} (${course.id})`);
        console.log(`    Instrutor: ${course.instructor?.name || 'N/A'}`);
        console.log(`    Status: ${course.status}`);
      });
    } else {
      console.log('⚠️ Nenhum curso pendente encontrado');
    }

    console.log('\n3️⃣ Testando rota admin/courses/pending...');
    const adminResponse = await axios.get(`${API_URL}/admin/courses/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📊 Resposta da rota admin:');
    console.log(JSON.stringify(adminResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testPendingCoursesAPI();
