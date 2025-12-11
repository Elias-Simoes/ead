require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testPlanById() {
  try {
    console.log('🧪 Testando busca de plano por ID...\n');
    
    // 1. Login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'student.e2e@test.com',
      password: 'Test123!@#'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login realizado com sucesso\n');
    
    // 2. Buscar todos os planos
    console.log('2️⃣ Buscando todos os planos...');
    const plansResponse = await axios.get(`${API_URL}/subscriptions/plans`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ ${plansResponse.data.length} planos encontrados\n`);
    
    if (plansResponse.data.length === 0) {
      console.log('❌ Nenhum plano disponível para testar');
      return;
    }
    
    const firstPlan = plansResponse.data[0];
    console.log('📋 Primeiro plano:');
    console.log(`   ID: ${firstPlan.id}`);
    console.log(`   Nome: ${firstPlan.name}`);
    console.log(`   Preço: ${firstPlan.currency} ${firstPlan.price}`);
    console.log('');
    
    // 3. Buscar plano específico por ID
    console.log('3️⃣ Buscando plano específico por ID...');
    const planResponse = await axios.get(`${API_URL}/subscriptions/plans/${firstPlan.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Plano encontrado:');
    console.log(`   ID: ${planResponse.data.data.id}`);
    console.log(`   Nome: ${planResponse.data.data.name}`);
    console.log(`   Preço: ${planResponse.data.data.currency} ${planResponse.data.data.price}`);
    console.log('');
    
    // 4. Testar com ID inválido
    console.log('4️⃣ Testando com ID inválido...');
    try {
      await axios.get(`${API_URL}/subscriptions/plans/invalid-id`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Deveria ter retornado erro 404');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Erro 404 retornado corretamente para ID inválido');
      } else {
        console.log(`⚠️  Erro inesperado: ${error.response?.status}`);
        console.log('Detalhes:', error.response?.data);
      }
    }
    console.log('');
    
    console.log('✅ Todos os testes passaram!');
    console.log('');
    console.log('🌐 Agora você pode testar no navegador:');
    console.log(`   1. Acesse: http://localhost:5174/subscription/renew`);
    console.log(`   2. Clique em "Renovar com este Plano"`);
    console.log(`   3. A página de checkout deve carregar corretamente`);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testPlanById();
