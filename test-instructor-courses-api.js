const axios = require('axios');

async function testInstructorCoursesAPI() {
  try {
    console.log('🔍 Testando API /api/instructor/courses...\n');
    
    // Primeiro fazer login
    console.log('1. Fazendo login como instrutor...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Instructor123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login bem-sucedido\n');
    
    // Buscar cursos do instrutor
    console.log('2. Buscando cursos do instrutor...');
    const coursesResponse = await axios.get('http://localhost:3000/api/instructor/courses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Resposta recebida:');
    console.log(JSON.stringify(coursesResponse.data, null, 2));
    
    if (coursesResponse.data.data && coursesResponse.data.data.length > 0) {
      console.log(`\n📚 Total de cursos: ${coursesResponse.data.data.length}`);
      coursesResponse.data.data.forEach((course, index) => {
        console.log(`\n${index + 1}. ${course.title}`);
        console.log(`   Status: ${course.status}`);
        console.log(`   ID: ${course.id}`);
      });
    } else {
      console.log('\n⚠️  Nenhum curso retornado pela API');
    }
    
  } catch (error) {
    console.error('\n❌ Erro ao testar API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testInstructorCoursesAPI();
