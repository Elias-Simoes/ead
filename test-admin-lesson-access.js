require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAdminLessonAccess() {
  try {
    console.log('🔍 Testando acesso de admin às aulas (sem assinatura)...\n');

    // 1. Login como admin
    console.log('1. Fazendo login como admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    const user = loginResponse.data.data.user;
    console.log('✅ Login realizado com sucesso');
    console.log(`   - Nome: ${user.name}`);
    console.log(`   - Role: ${user.role}\n`);

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
    console.log(`   - Tipo: ${firstLesson.type}\n`);

    // 6. Tentar buscar conteúdo da aula (SEM ASSINATURA)
    console.log('6. Buscando conteúdo da aula (admin não precisa de assinatura)...');
    try {
      const lessonContentResponse = await axios.get(
        `${BASE_URL}/api/lessons/${firstLesson.id}/content`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const lessonContent = lessonContentResponse.data.data;
      console.log('✅ Acesso permitido! Admin pode visualizar aulas sem assinatura');
      console.log(`   - Aula: ${lessonContent.title}`);
      console.log(`   - Tipo: ${lessonContent.type}`);
      console.log(`   - Conteúdo carregado: ${lessonContent.content ? 'Sim' : 'Não'}\n`);

      console.log('✅ TESTE PASSOU!');
      console.log('\n📝 Confirmação:');
      console.log('   ✅ Admin pode acessar cursos');
      console.log('   ✅ Admin pode visualizar detalhes do curso');
      console.log('   ✅ Admin pode acessar conteúdo das aulas');
      console.log('   ✅ Admin NÃO precisa de assinatura ativa');
      console.log('\n💡 Isso permite que admins aprovem cursos visualizando o conteúdo completo.');

    } catch (lessonError) {
      console.log('❌ TESTE FALHOU! Admin foi bloqueado ao tentar acessar aula');
      console.log(`   Status: ${lessonError.response?.status}`);
      console.log(`   Mensagem: ${lessonError.response?.data?.error?.message || lessonError.message}`);
      console.log('\n⚠️  O middleware de assinatura pode estar bloqueando admins incorretamente!');
    }

  } catch (error) {
    console.error('\n❌ Erro durante o teste:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Mensagem: ${error.response.data?.error?.message || error.message}`);
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

testAdminLessonAccess();
