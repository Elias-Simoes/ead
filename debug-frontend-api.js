const axios = require('axios');

async function debugFrontendAPI() {
  try {
    console.log('🔍 Testando chamadas do frontend...\n');
    
    // 1. Login
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Instructor123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    const user = loginResponse.data.data.user;
    console.log('✅ Login OK');
    console.log('   User:', user.name, '-', user.role);
    console.log('   Token:', token.substring(0, 20) + '...\n');
    
    // 2. Testar endpoint de cursos do instrutor
    console.log('2. Buscando cursos do instrutor...');
    console.log('   URL: http://localhost:3000/api/instructor/courses');
    console.log('   Headers: Authorization: Bearer ' + token.substring(0, 20) + '...\n');
    
    const coursesResponse = await axios.get('http://localhost:3000/api/instructor/courses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Resposta recebida:');
    console.log('   Status:', coursesResponse.status);
    console.log('   Data structure:', Object.keys(coursesResponse.data));
    
    if (coursesResponse.data.data) {
      console.log('   Data.data structure:', Object.keys(coursesResponse.data.data));
      
      if (coursesResponse.data.data.courses) {
        console.log('   Total courses:', coursesResponse.data.data.courses.length);
        console.log('\n📚 Cursos:');
        coursesResponse.data.data.courses.forEach((course, i) => {
          console.log(`   ${i + 1}. ${course.title} (${course.status})`);
        });
      } else {
        console.log('   ⚠️  data.data.courses não existe');
        console.log('   Estrutura completa:', JSON.stringify(coursesResponse.data, null, 2));
      }
    } else {
      console.log('   ⚠️  data.data não existe');
      console.log('   Estrutura completa:', JSON.stringify(coursesResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Erro:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   URL:', error.config?.url);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   Sem resposta do servidor');
      console.error('   URL:', error.config?.url);
    } else {
      console.error('   ', error.message);
    }
  }
}

debugFrontendAPI();
