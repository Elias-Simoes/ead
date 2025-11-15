const axios = require('axios');

async function testCreateLesson() {
  try {
    // 1. Login
    console.log('1. Fazendo login como instrutor...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✓ Login realizado\n');

    // 2. Buscar cursos
    console.log('2. Buscando cursos do instrutor...');
    const coursesResponse = await axios.get('http://localhost:3000/api/courses/instructor/my-courses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const courses = coursesResponse.data.data.courses || [];
    if (courses.length === 0) {
      console.log('✗ Nenhum curso encontrado');
      return;
    }
    
    const courseId = courses[0].id;
    console.log(`✓ Curso encontrado: ${courses[0].title} (${courseId})\n`);

    // 3. Buscar módulos do curso
    console.log('3. Buscando módulos do curso...');
    const modulesResponse = await axios.get(`http://localhost:3000/api/courses/${courseId}/modules`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const modules = modulesResponse.data.data || [];
    
    let moduleId;
    if (modules.length === 0) {
      // Criar um módulo de teste
      console.log('   Nenhum módulo encontrado. Criando módulo de teste...');
      const createModuleResponse = await axios.post(
        `http://localhost:3000/api/courses/${courseId}/modules`,
        {
          title: 'Módulo de Teste',
          description: 'Módulo criado para teste de aulas'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      moduleId = createModuleResponse.data.data.id;
      console.log(`   ✓ Módulo criado: ${moduleId}`);
    } else {
      moduleId = modules[0].id;
      console.log(`✓ Módulo encontrado: ${modules[0].title} (${moduleId})\n`);
    }

    // 4. Testar criação de aula com a rota CORRETA
    console.log('4. Testando criação de aula com rota CORRETA...');
    console.log(`   Rota: POST /api/courses/modules/${moduleId}/lessons`);
    
    try {
      const lessonData = {
        title: 'Aula de Teste',
        description: 'Descrição da aula de teste',
        type: 'video',
        content: 'https://www.youtube.com/watch?v=test',
        duration: 30
      };
      
      const createLessonResponse = await axios.post(
        `http://localhost:3000/api/courses/modules/${moduleId}/lessons`,
        lessonData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('   ✓ Aula criada com sucesso!');
      console.log('   Resposta:', JSON.stringify(createLessonResponse.data, null, 2));
      
      // Limpar: excluir a aula criada
      const lessonId = createLessonResponse.data.data.id;
      await axios.delete(
        `http://localhost:3000/api/courses/lessons/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('   ✓ Aula de teste excluída\n');
      
    } catch (error) {
      console.log('   ✗ Erro ao criar aula:');
      console.log('   Status:', error.response?.status);
      console.log('   Mensagem:', error.response?.data?.error?.message || error.message);
      console.log('   Dados:', JSON.stringify(error.response?.data, null, 2));
    }

    // 5. Testar com a rota INCORRETA (para comparação)
    console.log('5. Testando criação de aula com rota INCORRETA (para comparação)...');
    console.log(`   Rota: POST /api/modules/${moduleId}/lessons`);
    
    try {
      const lessonData = {
        title: 'Aula de Teste 2',
        description: 'Descrição da aula de teste 2',
        type: 'video',
        content: 'https://www.youtube.com/watch?v=test2',
        duration: 30
      };
      
      await axios.post(
        `http://localhost:3000/api/modules/${moduleId}/lessons`,
        lessonData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('   ✓ Aula criada (inesperado!)');
      
    } catch (error) {
      console.log('   ✗ Erro esperado:');
      console.log('   Status:', error.response?.status);
      console.log('   Mensagem:', error.response?.data?.error?.message || error.message);
    }

  } catch (error) {
    console.error('\nErro geral:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCreateLesson();
