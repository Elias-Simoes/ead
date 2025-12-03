const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testCreateAssessment() {
  try {
    console.log('\n🧪 TESTE: Criar Avaliação\n');
    console.log('=' .repeat(70));

    // Login
    console.log('\n1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!',
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado');

    // Usar o curso e módulo corretos
    const courseId = '5d39b6f5-8164-4b2f-89d8-12345f2e97fd';
    const moduleId = '30bfe64d-fd4e-488c-9de9-6a3bca1ca471'; // Module 2 - Advanced Topics

    console.log(`\n2️⃣ Tentando criar avaliação...`);
    console.log(`   Curso: ${courseId}`);
    console.log(`   Módulo: ${moduleId}`);

    try {
      const response = await axios.post(
        `${API_URL}/modules/${moduleId}/assessments`,
        {
          title: 'AVA 2',
          type: 'multiple_choice',
          passing_score: 70,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('\n✅ Avaliação criada com sucesso!');
      console.log('\nResposta:');
      console.log(JSON.stringify(response.data, null, 2));

    } catch (createError) {
      console.log('\n❌ Erro ao criar avaliação:');
      console.log('\nStatus:', createError.response?.status);
      console.log('\nErro:', JSON.stringify(createError.response?.data, null, 2));
      
      if (createError.response?.data?.error) {
        console.log('\n📋 Detalhes do erro:');
        console.log('   Código:', createError.response.data.error.code);
        console.log('   Mensagem:', createError.response.data.error.message);
      }
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
    if (error.response?.data) {
      console.error('\nDetalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCreateAssessment();
