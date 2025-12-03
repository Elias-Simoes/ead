const axios = require('axios');

async function testAssessmentAPI() {
  try {
    console.log('🧪 Testando API de avaliações diretamente...\n');

    // 1. Fazer login
    console.log('1️⃣ Fazendo login como instrutor...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });

    const token = loginResponse.data.data.token;
    console.log('   ✅ Login realizado com sucesso!\n');

    // 2. Usar o ID do curso que sabemos que existe
    console.log('2️⃣ Usando curso conhecido do banco de dados...');
    const courseId = '6884db44-126d-420f-a84d-ecbf1e80c128'; // Test Course - Module Assessment Validation
    console.log(`   Curso ID: ${courseId}\n`);

    // 3. Buscar avaliações do curso
    console.log('3️⃣ Buscando avaliações do curso...');
    const assessmentsResponse = await axios.get(
      `http://localhost:3000/api/courses/${courseId}/assessments`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(`   Status da resposta: ${assessmentsResponse.status}`);
    console.log(`   Dados retornados:`, JSON.stringify(assessmentsResponse.data, null, 2));

    if (assessmentsResponse.data.data && assessmentsResponse.data.data.length > 0) {
      console.log(`\n   ✅ ${assessmentsResponse.data.data.length} avaliação(ões) encontrada(s):`);
      assessmentsResponse.data.data.forEach((assessment, idx) => {
        console.log(`   ${idx + 1}. ${assessment.title}`);
        console.log(`      ID: ${assessment.id}`);
        console.log(`      Tipo: ${assessment.type}`);
        console.log(`      Módulo: ${assessment.moduleTitle || assessment.module_title || 'N/A'}`);
      });
    } else {
      console.log('\n   ❌ Nenhuma avaliação retornada pela API!');
      console.log('   Isso indica um problema no controller ou na rota.');
    }

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro ao testar API:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testAssessmentAPI();
