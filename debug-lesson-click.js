require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugLessonClick() {
  try {
    console.log('🔍 Diagnosticando erro ao clicar em aula...\n');

    // 1. Login como estudante
    console.log('1. Fazendo login como estudante...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'student@example.com',
      password: 'Student123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login realizado com sucesso');
    console.log(`   Token: ${token.substring(0, 30)}...\n`);

    // 2. Buscar cursos disponíveis
    console.log('2. Buscando cursos disponíveis...');
    const coursesResponse = await axios.get(`${BASE_URL}/api/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const courses = coursesResponse.data.data.courses;
    console.log(`✅ Encontrados ${courses.length} cursos\n`);

    if (courses.length === 0) {
      console.log('❌ Nenhum curso encontrado');
      return;
    }

    // 3. Pegar o primeiro curso
    const course = courses[0];
    console.log(`3. Testando curso: ${course.title} (ID: ${course.id})\n`);

    // 4. Buscar detalhes do curso
    console.log('4. Buscando detalhes do curso...');
    const courseDetailResponse = await axios.get(`${BASE_URL}/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const courseDetail = courseDetailResponse.data.data.course;
    console.log('✅ Detalhes do curso carregados');
    console.log(`   - Módulos: ${courseDetail.modules?.length || 0}`);
    
    if (!courseDetail.modules || courseDetail.modules.length === 0) {
      console.log('❌ Curso não possui módulos');
      return;
    }

    const firstModule = courseDetail.modules[0];
    console.log(`   - Aulas no primeiro módulo: ${firstModule.lessons?.length || 0}\n`);

    if (!firstModule.lessons || firstModule.lessons.length === 0) {
      console.log('❌ Módulo não possui aulas');
      return;
    }

    const firstLesson = firstModule.lessons[0];
    console.log(`5. Testando aula: ${firstLesson.title} (ID: ${firstLesson.id})`);
    console.log(`   - Tipo: ${firstLesson.type}`);
    console.log(`   - Duração: ${firstLesson.duration || 'N/A'} min\n`);

    // 6. Tentar buscar conteúdo da aula
    console.log('6. Buscando conteúdo da aula...');
    try {
      const lessonContentResponse = await axios.get(`${BASE_URL}/api/lessons/${firstLesson.id}/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const lessonContent = lessonContentResponse.data.data;
      console.log('✅ Conteúdo da aula carregado com sucesso');
      console.log(`   - Título: ${lessonContent.title}`);
      console.log(`   - Tipo: ${lessonContent.type}`);
      console.log(`   - Tem conteúdo: ${lessonContent.content ? 'Sim' : 'Não'}`);
      console.log(`   - Tamanho do conteúdo: ${lessonContent.content?.length || 0} caracteres\n`);
    } catch (lessonError) {
      console.log('❌ Erro ao buscar conteúdo da aula:');
      console.log(`   Status: ${lessonError.response?.status}`);
      console.log(`   Mensagem: ${lessonError.response?.data?.error?.message || lessonError.message}`);
      console.log(`   Detalhes:`, lessonError.response?.data);
      return;
    }

    // 7. Verificar progresso do estudante
    console.log('7. Verificando progresso do estudante...');
    try {
      const progressResponse = await axios.get(`${BASE_URL}/api/students/courses/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const progress = progressResponse.data.data.find(p => p.courseId === course.id);
      if (progress) {
        console.log('✅ Progresso encontrado');
        console.log(`   - Progresso: ${progress.progressPercentage}%`);
        console.log(`   - Aulas concluídas: ${progress.completedLessons?.length || 0}`);
      } else {
        console.log('⚠️  Nenhum progresso registrado para este curso');
      }
    } catch (progressError) {
      console.log('⚠️  Erro ao buscar progresso (pode ser normal se não houver progresso)');
    }

    console.log('\n✅ Diagnóstico concluído com sucesso!');
    console.log('\n📝 Resumo:');
    console.log(`   - Curso ID: ${course.id}`);
    console.log(`   - Aula ID: ${firstLesson.id}`);
    console.log(`   - URL esperada: /courses/${course.id}/lessons/${firstLesson.id}`);

  } catch (error) {
    console.error('\n❌ Erro durante o diagnóstico:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Mensagem: ${error.response.data?.error?.message || error.message}`);
      console.error(`   Detalhes:`, error.response.data);
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

debugLessonClick();
