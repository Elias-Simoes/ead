const axios = require('axios');

async function testFrontendImageDisplay() {
  try {
    // 1. Login
    console.log('1. Fazendo login como instrutor...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✓ Login realizado\n');

    // 2. Buscar cursos (mesma rota que o frontend usa agora)
    console.log('2. Buscando cursos do instrutor...');
    const coursesResponse = await axios.get('http://localhost:3000/api/courses/instructor/my-courses', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✓ Cursos recebidos:', coursesResponse.data.data.courses.length);
    
    // 3. Verificar cursos com imagens
    const coursesWithImages = coursesResponse.data.data.courses.filter(c => c.cover_image_url);
    console.log(`✓ Cursos com imagens: ${coursesWithImages.length}\n`);
    
    if (coursesWithImages.length > 0) {
      console.log('3. Detalhes dos cursos com imagens:\n');
      for (const course of coursesWithImages) {
        console.log(`Curso: ${course.title}`);
        console.log(`  ID: ${course.id}`);
        console.log(`  cover_image: ${course.cover_image}`);
        console.log(`  cover_image_url: ${course.cover_image_url}`);
        
        // Testar se a URL está acessível
        try {
          const imageResponse = await axios.head(course.cover_image_url);
          console.log(`  ✓ Imagem acessível (${imageResponse.status})`);
          console.log(`  Content-Type: ${imageResponse.headers['content-type']}`);
        } catch (error) {
          console.log(`  ✗ Erro ao acessar imagem: ${error.message}`);
        }
        console.log('');
      }
    } else {
      console.log('✗ Nenhum curso com imagem encontrado');
    }

  } catch (error) {
    console.error('Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFrontendImageDisplay();
