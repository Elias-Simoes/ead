const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAssessmentsList() {
  try {
    console.log('🧪 TESTE: Lista de Avaliações via API\n');
    console.log('=' .repeat(70));

    // Login
    console.log('\n1️⃣ Fazendo login como instrutor...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!',
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado');

    // Usar o curso ID do diagnóstico anterior
    const courseId = '6884db44-126d-420f-a84d-ecbf1e80c128';
    console.log(`\n2️⃣ Buscando avaliações do curso ${courseId}...`);

    const response = await axios.get(
      `${API_URL}/courses/${courseId}/assessments`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('\n📊 Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));

    const assessments = response.data.data;
    console.log(`\n✅ Total de avaliações retornadas: ${assessments.length}`);

    if (assessments.length > 0) {
      console.log('\n📋 Detalhes das avaliações:');
      assessments.forEach((assessment, index) => {
        console.log(`\n${index + 1}. ${assessment.title}`);
        console.log(`   - ID: ${assessment.id}`);
        console.log(`   - Module ID: ${assessment.moduleId}`);
        console.log(`   - Module Title: ${assessment.moduleTitle || 'N/A'}`);
        console.log(`   - Questões: ${assessment.questions?.length || 0}`);
        
        if (assessment.questions && assessment.questions.length > 0) {
          console.log(`   - Questões:`);
          assessment.questions.forEach((q, qIndex) => {
            console.log(`      ${qIndex + 1}. ${q.text.substring(0, 50)}...`);
          });
        }
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Teste concluído!\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('\nDetalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAssessmentsList();
