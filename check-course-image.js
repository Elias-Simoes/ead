const axios = require('axios');

async function checkCourseImage() {
  try {
    console.log('🔍 Verificando imagem do curso...\n');
    
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
    
    const course = courseResponse.data.data.course;
    
    console.log('📚 Dados do curso:');
    console.log('  ID:', course.id);
    console.log('  Título:', course.title);
    console.log('  Cover Image:', course.cover_image);
    
    if (course.cover_image) {
      console.log('\n✅ Imagem encontrada no banco de dados!');
      console.log('  URL:', course.cover_image);
      
      // Tentar acessar a imagem
      console.log('\n🌐 Testando acesso à imagem...');
      try {
        const imageResponse = await axios.head(course.cover_image);
        console.log('✅ Imagem acessível!');
        console.log('  Status:', imageResponse.status);
        console.log('  Content-Type:', imageResponse.headers['content-type']);
      } catch (imgError) {
        console.log('❌ Erro ao acessar a imagem:');
        if (imgError.response) {
          console.log('  Status:', imgError.response.status);
          console.log('  Mensagem:', imgError.response.statusText);
        } else {
          console.log('  Erro:', imgError.message);
        }
      }
    } else {
      console.log('\n⚠️  Nenhuma imagem encontrada no banco de dados');
      console.log('  O campo cover_image está null ou vazio');
    }
    
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

checkCourseImage();
