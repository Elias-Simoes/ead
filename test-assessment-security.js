const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAssessmentSecurity() {
  try {
    console.log('🔒 TESTE: Segurança de Criação de Avaliação\n');
    console.log('=' .repeat(70));

    // Login como instrutor 1
    console.log('\n1️⃣ Fazendo login como Instrutor 1...');
    const login1Response = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!',
    });

    const token1 = login1Response.data.data.tokens.accessToken;
    const instructor1Id = login1Response.data.data.user.id;
    console.log('✅ Login realizado:', instructor1Id);

    // Usar curso conhecido do instrutor 1
    console.log('\n2️⃣ Usando curso conhecido do Instrutor 1...');
    const course1Id = '5d39b6f5-8164-4b2f-89d8-12345f2e97fd';
    console.log(`   Curso ID: ${course1Id}`);

    // Buscar módulos do curso 1
    console.log('\n3️⃣ Buscando módulos do curso...');
    const modules1Response = await axios.get(`${API_URL}/courses/${course1Id}/modules`, {
      headers: { Authorization: `Bearer ${token1}` },
    });

    const modules1 = modules1Response.data.data;
    console.log(`✅ Módulos encontrados: ${modules1.length}`);
    
    if (modules1.length === 0) {
      console.log('❌ Curso não tem módulos');
      return;
    }

    // Usar o segundo módulo se o primeiro já tiver avaliação
    const module1 = modules1.length > 1 ? modules1[1] : modules1[0];
    console.log(`   Módulo: ${module1.title} (${module1.id})`);

    // Tentar criar avaliação com o próprio instrutor (deve funcionar)
    console.log('\n4️⃣ Testando criação de avaliação pelo dono do curso...');
    
    try {
      const assessmentData = {
        title: 'Avaliação de Teste - Segurança',
        type: 'multiple_choice'
      };

      const createResponse = await axios.post(
        `${API_URL}/modules/${module1.id}/assessments`,
        assessmentData,
        {
          headers: { 
            Authorization: `Bearer ${token1}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('✅ Avaliação criada com sucesso pelo dono');
      console.log(`   ID: ${createResponse.data.data.assessment.id}`);
      
      // Limpar - deletar a avaliação criada
      await axios.delete(
        `${API_URL}/assessments/${createResponse.data.data.assessment.id}`,
        {
          headers: { Authorization: `Bearer ${token1}` },
        }
      );
      console.log('✅ Avaliação removida (limpeza)');
      
    } catch (error) {
      console.log('❌ ERRO ao criar avaliação pelo dono:');
      console.log(error.response?.data || error.message);
    }

    // Criar segundo instrutor para teste
    console.log('\n5️⃣ Criando Instrutor 2 para teste de segurança...');
    
    try {
      // Tentar criar instrutor 2
      const instructor2Email = 'instructor2-test@example.com';
      
      // Primeiro, tentar fazer login (pode já existir)
      let token2;
      try {
        const login2Response = await axios.post(`${API_URL}/auth/login`, {
          email: instructor2Email,
          password: 'Senha123!',
        });
        token2 = login2Response.data.data.tokens.accessToken;
        console.log('✅ Instrutor 2 já existe, usando conta existente');
      } catch (loginError) {
        console.log('⚠️  Instrutor 2 não existe, seria necessário criar via admin');
        console.log('⚠️  Pulando teste de segurança entre instrutores');
        console.log('\n' + '='.repeat(70));
        console.log('✅ Teste de segurança básico concluído!\n');
        return;
      }

      // Tentar criar avaliação no módulo do instrutor 1 usando token do instrutor 2
      console.log('\n6️⃣ Testando criação de avaliação por instrutor não autorizado...');
      
      try {
        const assessmentData = {
          title: 'Avaliação Maliciosa',
          type: 'multiple_choice'
        };

        await axios.post(
          `${API_URL}/modules/${module1.id}/assessments`,
          assessmentData,
          {
            headers: { 
              Authorization: `Bearer ${token2}`,
              'Content-Type': 'application/json'
            },
          }
        );

        console.log('❌ FALHA DE SEGURANÇA! Instrutor 2 conseguiu criar avaliação no curso do Instrutor 1!');
        
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ SEGURANÇA OK! Acesso negado corretamente');
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Mensagem: ${error.response.data.error.message}`);
        } else {
          console.log('⚠️  Erro inesperado:');
          console.log(error.response?.data || error.message);
        }
      }

    } catch (error) {
      console.log('⚠️  Erro ao configurar teste de segurança:');
      console.log(error.message);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Teste de segurança concluído!\n');

  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
    if (error.response?.data) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAssessmentSecurity();
