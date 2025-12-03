const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testPassingScoreDisplay() {
  try {
    console.log('🔍 TESTE: Exibição da Nota de Corte no Card de Avaliação\n');
    console.log('=' .repeat(70));

    // Login como instrutor
    console.log('\n1️⃣ Fazendo login como instrutor...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!',
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login realizado com sucesso');

    // Buscar curso conhecido
    const courseId = '5d39b6f5-8164-4b2f-89d8-12345f2e97fd';
    console.log(`\n2️⃣ Buscando avaliações do curso ${courseId}...`);
    
    const assessmentsResponse = await axios.get(
      `${API_URL}/courses/${courseId}/assessments`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const assessments = assessmentsResponse.data.data;
    console.log(`✅ ${assessments.length} avaliações encontradas`);

    if (assessments.length > 0) {
      console.log('\n📋 Detalhes das avaliações:');
      assessments.forEach((assessment, index) => {
        console.log(`\n   ${index + 1}. ${assessment.title}`);
        console.log(`      ID: ${assessment.id}`);
        console.log(`      Tipo: ${assessment.type}`);
        console.log(`      Módulo: ${assessment.moduleTitle || 'N/A'}`);
        console.log(`      Nota de Corte: ${assessment.passingScore || assessment.passing_score || 'N/A'}%`);
        console.log(`      Questões: ${assessment.questions?.length || 0}`);
        
        if (assessment.passingScore || assessment.passing_score) {
          console.log(`      ✅ Nota de corte disponível`);
        } else {
          console.log(`      ❌ Nota de corte NÃO disponível`);
        }
      });
    } else {
      console.log('\n⚠️  Nenhuma avaliação encontrada para testar');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Teste concluído!\\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.response?.data) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPassingScoreDisplay();
