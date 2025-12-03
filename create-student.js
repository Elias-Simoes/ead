require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function createStudent() {
  try {
    console.log('📝 Criando estudante de teste...\n');

    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Estudante Teste',
      email: 'student@example.com',
      password: 'Student123!',
      role: 'student',
      gdprConsent: true
    });

    console.log('✅ Estudante criado com sucesso!');
    if (response.data?.data?.user) {
      console.log(`   - Nome: ${response.data.data.user.name}`);
      console.log(`   - Email: ${response.data.data.user.email}`);
      console.log(`   - Role: ${response.data.data.user.role}`);
    }

  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Estudante já existe, pode usar as credenciais:');
      console.log('   - Email: student@example.com');
      console.log('   - Senha: Student123!');
    } else {
      console.error('❌ Erro ao criar estudante:');
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   URL: ${error.config?.url}`);
      console.error(`   Mensagem: ${error.response?.data?.error?.message || error.message}`);
      console.error(`   Detalhes:`, error.response?.data);
    }
  }
}

createStudent();
