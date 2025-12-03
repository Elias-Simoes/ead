const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testCreateAssessmentFixed() {
  try {
    console.log('🔍 TESTE: Criar Avaliação (Corrigido)\n');
    console.log('=' .repeat(70));

    // Login
    console.log('\n1️⃣ Fazendo login como instrutor...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!',
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login realizado com sucesso');

    // Usar o curso que tem módulo sem avaliação
    const courseId = '5d39b6f5-8164-4b2f-89d8-12345f2e97fd';
    const moduleId = '30bfe64d-fd4e-488c-9de9-6a3bca1ca471'; // Module 2 - Advanced Topics
    
    console.log(`\n2️⃣ Verificando módulos disponíveis...`);
    console.log(`Curso: ${courseId}`);
    
    try {
      const modulesResponse = await axios.get(
        `${API_URL}/courses/${courseId}/modules-without-assessments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const availableModules = modulesResponse.data.data.modules;
      console.log(`✅ Módulos disponíveis: ${availableModules.length}`);
      
      availableModules.forEach((module, index) => {
        console.log(`   ${index + 1}. ${module.title} (${module.id})`);
      });

      const targetModule = availableModules.find(m => m.id === moduleId);
      if (!targetModule) {
        console.log(`\n⚠️  Módulo ${moduleId} não está disponível`);
        console.log('Usando o primeiro módulo disponível...');
        if (availableModules.length === 0) {
          console.log('❌ Nenhum módulo disponível para criar avaliação');
          return;
        }
        const firstModule = availableModules[0];
        console.log(`Módulo selecionado: ${firstModule.title} (${firstModule.id})`);
      } else {
        console.log(`✅ Módulo ${targetModule.title} está disponível`);
      }
    } catch (modulesError) {
      console.log('❌ Erro ao verificar módulos disponíveis:');
      console.log(modulesError.response?.data || modulesError.message);
      return;
    }

    // Dados da avaliação (SEM as questões)
    const assessmentData = {
      title: 'Avaliação de Teste - Corrigida',
      type: 'multiple_choice'
    };

    console.log(`\n3️⃣ Criando avaliação no módulo ${moduleId}...`);
    console.log('📋 Dados da avaliação:');
    console.log(JSON.stringify(assessmentData, null, 2));
    console.log(`\n🔗 URL: POST ${API_URL}/modules/${moduleId}/assessments`);

    try {
      const response = await axios.post(
        `${API_URL}/modules/${moduleId}/assessments`,
        assessmentData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('\n✅ Avaliação criada com sucesso!');
      console.log('\n📊 Resposta da API:');
      console.log(JSON.stringify(response.data, null, 2));

      const assessmentId = response.data.data.assessment.id;
      console.log(`\n4️⃣ Adicionando questões à avaliação ${assessmentId}...`);

      // Adicionar primeira questão
      const question1 = {
        text: 'Qual é a capital do Brasil?',
        type: 'multiple_choice',
        options: [
          'São Paulo',
          'Rio de Janeiro', 
          'Brasília',
          'Belo Horizonte'
        ],
        correct_answer: 2,
        points: 5,
        order_index: 0
      };

      console.log('\n📝 Questão 1:');
      console.log(JSON.stringify(question1, null, 2));

      const q1Response = await axios.post(
        `${API_URL}/assessments/${assessmentId}/questions`,
        question1,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('✅ Questão 1 criada:', q1Response.data.data.id);

      // Adicionar segunda questão
      const question2 = {
        text: 'Quanto é 2 + 2?',
        type: 'multiple_choice',
        options: [
          '3',
          '4',
          '5',
          '6'
        ],
        correct_answer: 1,
        points: 5,
        order_index: 1
      };

      console.log('\n📝 Questão 2:');
      console.log(JSON.stringify(question2, null, 2));

      const q2Response = await axios.post(
        `${API_URL}/assessments/${assessmentId}/questions`,
        question2,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('✅ Questão 2 criada:', q2Response.data.data.id);

      console.log('\n5️⃣ Verificando avaliação completa...');
      const finalResponse = await axios.get(
        `${API_URL}/assessments/${assessmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('\n📊 Avaliação completa:');
      console.log(JSON.stringify(finalResponse.data.data, null, 2));

    } catch (createError) {
      console.log('\n❌ ERRO AO CRIAR AVALIAÇÃO!');
      console.log('\n📊 Detalhes do erro:');
      
      if (createError.response) {
        console.log('Status:', createError.response.status);
        console.log('Data:', JSON.stringify(createError.response.data, null, 2));
      } else if (createError.request) {
        console.log('Erro de rede - sem resposta do servidor');
      } else {
        console.log('Erro:', createError.message);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Teste concluído!\n');

  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
    if (error.response?.data) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCreateAssessmentFixed();
