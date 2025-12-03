require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function fixLessonAccess() {
  try {
    console.log('🔧 Corrigindo acesso às aulas...\n');

    // 1. Login como admin
    console.log('1. Fazendo login como admin...');
    const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!'
    });
    
    const adminToken = adminLogin.data.data.tokens.accessToken;
    console.log('✅ Login admin realizado\n');

    // 2. Login como estudante para pegar o ID
    console.log('2. Fazendo login como estudante...');
    const studentLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'student@example.com',
      password: 'Student123!'
    });
    
    const studentId = studentLogin.data.data.user.id;
    console.log(`✅ Estudante ID: ${studentId}\n`);

    // 3. Criar assinatura ativa para o estudante
    console.log('3. Criando assinatura ativa...');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 ano de assinatura

    try {
      const subscription = await axios.post(
        `${BASE_URL}/api/admin/subscriptions`,
        {
          userId: studentId,
          planType: 'premium',
          status: 'active',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          paymentMethod: 'manual',
          amount: 0
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      console.log('✅ Assinatura criada com sucesso!');
      console.log(`   - Plano: ${subscription.data.data.planType}`);
      console.log(`   - Status: ${subscription.data.data.status}`);
      console.log(`   - Válida até: ${new Date(subscription.data.data.endDate).toLocaleDateString()}\n`);
    } catch (subError) {
      if (subError.response?.status === 409) {
        console.log('⚠️  Assinatura já existe, tentando atualizar...');
        
        // Buscar assinatura existente
        const subsResponse = await axios.get(
          `${BASE_URL}/api/admin/subscriptions`,
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        );

        const existingSub = subsResponse.data.data.subscriptions.find(
          s => s.userId === studentId
        );

        if (existingSub) {
          // Atualizar para ativa
          await axios.patch(
            `${BASE_URL}/api/admin/subscriptions/${existingSub.id}`,
            {
              status: 'active',
              endDate: endDate.toISOString()
            },
            {
              headers: { Authorization: `Bearer ${adminToken}` }
            }
          );
          console.log('✅ Assinatura atualizada para ativa!\n');
        }
      } else {
        throw subError;
      }
    }

    // 4. Testar acesso à aula novamente
    console.log('4. Testando acesso à aula...');
    const studentToken = studentLogin.data.data.tokens.accessToken;
    
    const coursesResponse = await axios.get(`${BASE_URL}/api/courses`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    const course = coursesResponse.data.data.courses[0];
    const courseDetail = await axios.get(`${BASE_URL}/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    const firstLesson = courseDetail.data.data.course.modules[0].lessons[0];
    
    const lessonContent = await axios.get(
      `${BASE_URL}/api/lessons/${firstLesson.id}/content`,
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );

    console.log('✅ Acesso à aula funcionando!');
    console.log(`   - Aula: ${lessonContent.data.data.title}`);
    console.log(`   - Tipo: ${lessonContent.data.data.type}`);
    console.log(`   - Conteúdo carregado: ${lessonContent.data.data.content ? 'Sim' : 'Não'}\n`);

    console.log('✅ Problema resolvido! O estudante agora pode acessar as aulas.');
    console.log('\n📝 Resumo da solução:');
    console.log('   - Criada/atualizada assinatura ativa para o estudante');
    console.log('   - Estudante pode agora clicar e visualizar aulas');
    console.log('   - Assinatura válida por 1 ano');

  } catch (error) {
    console.error('\n❌ Erro:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Mensagem: ${error.response.data?.error?.message || error.message}`);
      console.error(`   Detalhes:`, error.response.data);
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

fixLessonAccess();
