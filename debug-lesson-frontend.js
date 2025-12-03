require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugLessonFrontend() {
  try {
    console.log('🔍 Diagnosticando erro ao clicar em aula no frontend...\n');

    // 1. Login como estudante
    console.log('1. Fazendo login como estudante...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'student@example.com',
      password: 'Student123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login realizado\n');

    // 2. Buscar um curso
    console.log('2. Buscando cursos...');
    const coursesResponse = await axios.get(`${BASE_URL}/api/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const course = coursesResponse.data.data.courses[0];
    console.log(`✅ Curso encontrado: ${course.title}\n`);

    // 3. Buscar detalhes do curso
    console.log('3. Buscando detalhes do curso...');
    const courseDetailResponse = await axios.get(`${BASE_URL}/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const courseDetail = courseDetailResponse.data.data.course;
    const firstLesson = courseDetail.modules[0].lessons[0];
    console.log(`✅ Primeira aula: ${firstLesson.title}`);
    console.log(`   - ID: ${firstLesson.id}`);
    console.log(`   - Tipo: ${firstLesson.type}`);
    console.log(`   - Conteúdo (preview): ${firstLesson.content?.substring(0, 100)}...\n`);

    // 4. Buscar conteúdo completo da aula
    console.log('4. Buscando conteúdo completo da aula...');
    const lessonContentResponse = await axios.get(
      `${BASE_URL}/api/lessons/${firstLesson.id}/content`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const lessonContent = lessonContentResponse.data.data;
    console.log('✅ Conteúdo da aula carregado');
    console.log(`   - Título: ${lessonContent.title}`);
    console.log(`   - Tipo: ${lessonContent.type}`);
    console.log(`   - Descrição: ${lessonContent.description || 'N/A'}`);
    console.log(`   - Duração: ${lessonContent.duration || 'N/A'} min`);
    console.log(`   - Conteúdo completo:\n`);
    console.log('---START CONTENT---');
    console.log(lessonContent.content);
    console.log('---END CONTENT---\n');

    // 5. Verificar se há recursos da aula
    console.log('5. Verificando recursos da aula...');
    try {
      const resourcesResponse = await axios.get(
        `${BASE_URL}/api/lessons/${firstLesson.id}/resources`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const resources = resourcesResponse.data.data;
      console.log(`✅ Recursos encontrados: ${resources.length}`);
      resources.forEach((resource, index) => {
        console.log(`   ${index + 1}. ${resource.title}`);
        console.log(`      - Tipo: ${resource.type}`);
        console.log(`      - URL: ${resource.url}`);
      });
    } catch (resourceError) {
      console.log('⚠️  Nenhum recurso encontrado ou erro ao buscar recursos');
    }

    console.log('\n📝 Análise:');
    console.log('   - Backend está retornando o conteúdo corretamente');
    console.log('   - O problema pode estar no frontend ao renderizar o conteúdo');
    console.log('   - Verifique o console do navegador para erros JavaScript');
    console.log('   - Verifique se há URLs inválidas no conteúdo da aula');

    console.log('\n💡 Próximos passos:');
    console.log('   1. Abra o DevTools do navegador (F12)');
    console.log('   2. Vá para a aba Console');
    console.log('   3. Clique em uma aula');
    console.log('   4. Observe os erros que aparecem');
    console.log('   5. Compartilhe os erros específicos');

  } catch (error) {
    console.error('\n❌ Erro:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Mensagem: ${error.response.data?.error?.message || error.message}`);
      console.error(`   URL: ${error.config?.url}`);
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

debugLessonFrontend();
