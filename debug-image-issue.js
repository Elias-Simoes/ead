const axios = require('axios');

async function debugImageIssue() {
  try {
    // Login como instrutor
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✓ Login realizado\n');

    // Buscar cursos do instrutor
    console.log('2. Buscando cursos do instrutor...');
    const coursesResponse = await axios.get('http://localhost:3000/api/courses/instructor/my-courses', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Resposta completa da API:');
    console.log(JSON.stringify(coursesResponse.data, null, 2));
    
    if (coursesResponse.data.data && coursesResponse.data.data.length > 0) {
      const firstCourse = coursesResponse.data.data[0];
      console.log('\n3. Analisando primeiro curso:');
      console.log('ID:', firstCourse.id);
      console.log('Título:', firstCourse.title);
      console.log('cover_image:', firstCourse.cover_image);
      console.log('cover_image_url:', firstCourse.cover_image_url);
      console.log('coverImage:', firstCourse.coverImage);
      console.log('coverImageUrl:', firstCourse.coverImageUrl);
      
      // Verificar se a URL está acessível
      if (firstCourse.cover_image_url) {
        console.log('\n4. Testando acesso à URL da imagem:');
        console.log('URL:', firstCourse.cover_image_url);
        try {
          const imageResponse = await axios.head(firstCourse.cover_image_url);
          console.log('✓ Imagem acessível - Status:', imageResponse.status);
          console.log('Content-Type:', imageResponse.headers['content-type']);
        } catch (error) {
          console.log('✗ Erro ao acessar imagem:', error.message);
          if (error.response) {
            console.log('Status:', error.response.status);
          }
        }
      } else {
        console.log('\n✗ cover_image_url não está presente na resposta');
      }
    }

  } catch (error) {
    console.error('Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

debugImageIssue();
