require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testCreateAssessment() {
  try {
    console.log('🔐 Fazendo login como instrutor...\n');

    // Login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!',
    });

    console.log('✅ Login realizado com sucesso');
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('Token:', token.substring(0, 30) + '...\n');

    // Buscar cursos do instrutor
    console.log('📚 Buscando cursos do instrutor...\n');
    const coursesResponse = await axios.get(`${API_URL}/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const courses = coursesResponse.data.data.courses;
    console.log(`✅ Encontrados ${courses.length} cursos\n`);

    if (!courses || courses.length === 0) {
      console.log('❌ Nenhum curso encontrado');
      return;
    }

    const courseId = courses[0].id;
    console.log('📖 Usando curso:', courses[0].title);
    console.log('ID:', courseId, '\n');

    // Buscar módulos sem avaliação
    console.log('📋 Buscando módulos sem avaliação...\n');
    const modulesResponse = await axios.get(
      `${API_URL}/courses/${courseId}/modules-without-assessments`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const modules = modulesResponse.data.data.modules;
    console.log(`✅ Encontrados ${modules.length} módulos sem avaliação\n`);

    if (modules.length === 0) {
      console.log('❌ Nenhum módulo disponível para criar avaliação');
      return;
    }

    const moduleId = modules[0].id;
    console.log('📦 Usando módulo:', modules[0].title);
    console.log('ID:', moduleId, '\n');

    // Tentar criar avaliação
    console.log('🎯 Tentando criar avaliação...\n');
    
    const assessmentData = {
      title: 'Teste 2',
      type: 'multiple_choice',
      passing_score: 90,
    };

    console.log('Dados da avaliação:', JSON.stringify(assessmentData, null, 2));
    console.log('URL:', `${API_URL}/modules/${moduleId}/assessments`);
    console.log('');

    const createResponse = await axios.post(
      `${API_URL}/modules/${moduleId}/assessments`,
      assessmentData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Avaliação criada com sucesso!');
    console.log('Resposta:', JSON.stringify(createResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    if (error.response) {
      console.error('\n📋 Detalhes do erro:');
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('\n📋 Erro completo:', error);
    }
  }
}

testCreateAssessment();
