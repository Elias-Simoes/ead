const axios = require('axios');

async function testModulesWithLessons() {
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
    const courseId = courses[0].id;
    console.log(`✓ Curso encontrado: ${courses[0].title}\n`);

    // 3. Buscar módulos com aulas
    console.log('3. Buscando módulos com aulas...');
    const modulesResponse = await axios.get(`http://localhost:3000/api/courses/${courseId}/modules`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const modules = modulesResponse.data.data || [];
    console.log(`✓ Módulos encontrados: ${modules.length}\n`);
    
    // 4. Mostrar módulos e aulas
    modules.forEach((module, index) => {
      console.log(`Módulo ${index + 1}: ${module.title}`);
      console.log(`  ID: ${module.id}`);
      console.log(`  Descrição: ${module.description || 'N/A'}`);
      
      if (module.lessons && module.lessons.length > 0) {
        console.log(`  Aulas (${module.lessons.length}):`);
        module.lessons.forEach((lesson, lessonIndex) => {
          console.log(`    ${lessonIndex + 1}. ${lesson.title}`);
          console.log(`       Tipo: ${lesson.type}`);
          console.log(`       Duração: ${lesson.duration || 0} min`);
        });
      } else {
        console.log(`  Aulas: Nenhuma aula`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testModulesWithLessons();
