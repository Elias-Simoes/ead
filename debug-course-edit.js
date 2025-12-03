const axios = require('axios');

async function testCourseEdit() {
  try {
    console.log('🧪 Testando edição de curso\n');
    console.log('='.repeat(70));

    // Login como instrutor
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Senha123!',
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso');

    // Buscar cursos do instrutor
    const coursesResponse = await axios.get('http://localhost:3000/api/instructor/courses', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const courses = coursesResponse.data.data.courses;
    console.log(`\n📚 Cursos encontrados: ${courses.length}`);

    if (courses.length === 0) {
      console.log('❌ Nenhum curso encontrado');
      return;
    }

    const course = courses[0];
    console.log(`\n📖 Testando edição do curso: ${course.title}`);
    console.log(`   ID: ${course.id}`);
    console.log(`   Carga horária atual: ${course.workload} horas`);

    // Tentar editar com workload como número
    console.log('\n🔧 Tentando editar com workload como número (120)...');
    try {
      const updateResponse = await axios.patch(
        `http://localhost:3000/api/courses/${course.id}`,
        {
          title: course.title,
          description: course.description,
          category: course.category,
          workload: 120, // Número
          cover_image: course.cover_image,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('✅ Edição com número funcionou!');
      console.log('   Nova carga horária:', updateResponse.data.data.course.workload);
    } catch (err) {
      console.log('❌ Erro ao editar com número:');
      console.log('   Status:', err.response?.status);
      console.log('   Erro:', err.response?.data?.error?.message || err.message);
      console.log('   Detalhes:', JSON.stringify(err.response?.data, null, 2));
    }

    // Tentar editar com workload como string
    console.log('\n🔧 Tentando editar com workload como string ("120")...');
    try {
      const updateResponse2 = await axios.patch(
        `http://localhost:3000/api/courses/${course.id}`,
        {
          title: course.title,
          description: course.description,
          category: course.category,
          workload: "120", // String
          cover_image: course.cover_image,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('✅ Edição com string funcionou!');
      console.log('   Nova carga horária:', updateResponse2.data.data.course.workload);
    } catch (err) {
      console.log('❌ Erro ao editar com string:');
      console.log('   Status:', err.response?.status);
      console.log('   Erro:', err.response?.data?.error?.message || err.message);
      console.log('   Detalhes:', JSON.stringify(err.response?.data, null, 2));
    }

    console.log('\n' + '='.repeat(70));
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCourseEdit();
