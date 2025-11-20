const axios = require('axios');

async function testEditCourseFix() {
  try {
    console.log('🔍 Testando correção do carregamento de dados para edição...\n');
    
    // Fazer login
    console.log('1. Fazendo login como instrutor...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Instructor123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login bem-sucedido\n');
    
    // Buscar curso específico
    const courseId = '65cb2e3f-819f-456a-8efc-3d041bbd1883';
    console.log(`2. Buscando curso ${courseId}...`);
    
    const courseResponse = await axios.get(`http://localhost:3000/api/courses/${courseId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // CORREÇÃO: A API retorna { data: { course: {...} } }
    const course = courseResponse.data.data.course;
    console.log('✅ Curso encontrado\n');
    
    console.log('📋 Dados que o frontend deve receber:');
    console.log('  title:', course.title);
    console.log('  description:', course.description);
    console.log('  category:', course.category);
    console.log('  workload:', course.workload);
    console.log('  cover_image (API):', course.cover_image);
    
    console.log('\n✅ Verificação:');
    console.log('  - Título preenchido?', course.title ? '✓' : '✗');
    console.log('  - Descrição preenchida?', course.description ? '✓' : '✗');
    console.log('  - Categoria preenchida?', course.category ? '✓' : '✗');
    console.log('  - Workload preenchido?', course.workload > 0 ? '✓' : '✗');
    console.log('  - Cover image existe?', course.cover_image ? '✓' : '✗ (null é ok)');
    
    console.log('\n💡 Agora recarregue a página de edição no navegador!');
    console.log('   URL: http://localhost:5173/instructor/courses/' + courseId + '/edit');
    console.log('   Os campos devem estar preenchidos com estes valores.');
    
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

testEditCourseFix();
