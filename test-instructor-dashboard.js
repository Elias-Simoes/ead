const axios = require('axios');

async function testInstructorDashboard() {
  try {
    // 1. Login
    console.log('1. Fazendo login como instrutor...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✓ Login realizado\n');

    // 2. Buscar cursos (mesma chamada que o dashboard faz)
    console.log('2. Buscando cursos do instrutor...');
    const coursesResponse = await axios.get('http://localhost:3000/api/courses/instructor/my-courses', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const courses = coursesResponse.data.data.courses || [];
    console.log(`✓ Cursos recebidos: ${courses.length}\n`);
    
    // 3. Calcular estatísticas (mesma lógica do dashboard)
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, course) => sum + (course.studentsCount || 0), 0);
    const averageCompletionRate = courses.length > 0
      ? Math.round(courses.reduce((sum, course) => sum + (course.completionRate || 0), 0) / courses.length)
      : 0;
    
    console.log('3. Estatísticas calculadas:');
    console.log(`   Total de Cursos: ${totalCourses}`);
    console.log(`   Total de Alunos: ${totalStudents}`);
    console.log(`   Taxa Média de Conclusão: ${averageCompletionRate}%\n`);
    
    // 4. Mostrar cursos
    console.log('4. Lista de cursos:');
    courses.forEach((course, index) => {
      console.log(`\n   ${index + 1}. ${course.title}`);
      console.log(`      ID: ${course.id}`);
      console.log(`      Status: ${course.status}`);
      console.log(`      Alunos: ${course.studentsCount || 0}`);
      console.log(`      Taxa de Conclusão: ${course.completionRate || 0}%`);
      if (course.cover_image_url) {
        console.log(`      Imagem: ${course.cover_image_url}`);
      }
    });

  } catch (error) {
    console.error('Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testInstructorDashboard();
