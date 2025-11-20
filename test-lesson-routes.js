const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Credenciais do instrutor de teste
const INSTRUCTOR_EMAIL = 'instructor@example.com';
const INSTRUCTOR_PASSWORD = 'Senha123!';

async function testLessonRoutes() {
  try {
    console.log('🔐 Fazendo login como instrutor...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: INSTRUCTOR_EMAIL,
      password: INSTRUCTOR_PASSWORD,
    });

    const token = loginRes.data.data.tokens.accessToken;
    console.log('✅ Login realizado com sucesso\n');

    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    // Buscar cursos do instrutor
    console.log('📚 Buscando cursos do instrutor...');
    const coursesRes = await axios.get(`${API_URL}/instructor/courses`, config);
    const courses = coursesRes.data.data.courses;
    
    if (!courses || courses.length === 0) {
      console.log('❌ Nenhum curso encontrado');
      return;
    }

    const courseId = courses[0].id;
    console.log(`✅ Curso encontrado: ${courses[0].title} (ID: ${courseId})\n`);

    // Buscar módulos do curso
    console.log('📦 Buscando módulos do curso...');
    const modulesRes = await axios.get(`${API_URL}/courses/${courseId}/modules`, config);
    const modules = modulesRes.data.data;

    if (modules.length === 0) {
      console.log('❌ Nenhum módulo encontrado');
      return;
    }

    const moduleId = modules[0].id;
    console.log(`✅ Módulo encontrado: ${modules[0].title} (ID: ${moduleId})\n`);

    // Testar GET /api/modules/:id
    console.log('🔍 Testando GET /api/modules/:id...');
    try {
      const moduleRes = await axios.get(`${API_URL}/courses/modules/${moduleId}`, config);
      console.log('✅ Módulo recuperado com sucesso:');
      console.log(`   Título: ${moduleRes.data.data.title}`);
      console.log(`   Descrição: ${moduleRes.data.data.description}\n`);
    } catch (error) {
      console.log(`❌ Erro ao buscar módulo: ${error.response?.data?.error?.message || error.message}\n`);
    }

    // Verificar se há aulas no módulo
    if (modules[0].lessons && modules[0].lessons.length > 0) {
      const lessonId = modules[0].lessons[0].id;
      console.log(`📝 Aula encontrada: ${modules[0].lessons[0].title} (ID: ${lessonId})\n`);

      // Testar GET /api/lessons/:id
      console.log('🔍 Testando GET /api/lessons/:id...');
      try {
        const lessonRes = await axios.get(`${API_URL}/courses/lessons/${lessonId}`, config);
        console.log('✅ Aula recuperada com sucesso:');
        console.log(`   Título: ${lessonRes.data.data.title}`);
        console.log(`   Tipo: ${lessonRes.data.data.type}`);
        console.log(`   Duração: ${lessonRes.data.data.duration} min\n`);
      } catch (error) {
        console.log(`❌ Erro ao buscar aula: ${error.response?.data?.error?.message || error.message}\n`);
      }
    } else {
      console.log('⚠️  Nenhuma aula encontrada no módulo para testar\n');
    }

    console.log('✅ Testes concluídos!');

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testLessonRoutes();
