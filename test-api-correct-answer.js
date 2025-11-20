require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAPI() {
  try {
    console.log('🔍 TESTANDO API - Resposta Correta\n');
    console.log('=' .repeat(60));

    // 1. Fazer login
    console.log('\n1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');

    // 2. Testar diretamente com IDs conhecidos do banco
    console.log('\n2️⃣ Testando avaliações conhecidas do banco...');
    
    const knownAssessmentIds = [
      'ba63b0f0-f5a4-4a06-9626-ec9c50c7d549', // Avaliação de Teste (instructor@example.com)
      '02fb9b67-6f83-41cb-bba5-c75228b800a6'  // Avaliação de Teste - Backend (instructor@example.com)
    ];

    // 3. Buscar detalhes de cada avaliação
    for (const assessmentId of knownAssessmentIds) {
      try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`\n3️⃣ Buscando avaliação ID: ${assessmentId}`);
        
        const detailResponse = await axios.get(
          `${API_URL}/assessments/${assessmentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const details = detailResponse.data;
        console.log(`✅ Avaliação encontrada: ${details.title}`);
        console.log(`Questões: ${details.questions?.length || 0}`);
        
        if (details.questions && details.questions.length > 0) {
          details.questions.forEach((q, index) => {
            console.log(`\n--- Questão ${index + 1} ---`);
            console.log(`ID: ${q.id}`);
            console.log(`Tipo: ${q.type}`);
            console.log(`Texto: ${q.text}`);
            console.log(`Pontos: ${q.points}`);
            
            if (q.type === 'multiple_choice') {
              console.log(`\nOpções (tipo: ${typeof q.options}):`);
              if (Array.isArray(q.options)) {
                q.options.forEach((opt, i) => {
                  const marker = q.correctAnswer === i ? '✅' : '  ';
                  console.log(`  ${marker} ${i}: ${opt}`);
                });
              } else {
                console.log('❌ options não é um array:', q.options);
              }
              
              console.log(`\nResposta Correta:`);
              console.log(`  Tipo: ${typeof q.correctAnswer}`);
              console.log(`  Valor: ${q.correctAnswer}`);
              
              if (q.correctAnswer === null || q.correctAnswer === undefined) {
                console.log('  ❌ PROBLEMA: Resposta correta é NULL/UNDEFINED na API');
              } else if (typeof q.correctAnswer === 'number') {
                console.log(`  ✅ Resposta correta é NUMBER: ${q.correctAnswer}`);
                if (q.options && q.options[q.correctAnswer]) {
                  console.log(`  ✅ Opção correspondente: "${q.options[q.correctAnswer]}"`);
                } else {
                  console.log(`  ❌ PROBLEMA: Índice ${q.correctAnswer} não existe nas opções`);
                }
              } else {
                console.log(`  ⚠️  Tipo inesperado: ${q.correctAnswer}`);
              }
            } else {
              console.log(`\nTipo de questão: ${q.type} (não requer resposta correta)`);
            }
          });
        } else {
          console.log('❌ Nenhuma questão encontrada');
        }
      } catch (error) {
        console.log(`❌ Erro ao buscar avaliação ${assessmentId}:`, error.message);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('\n📋 CONCLUSÃO:');
    console.log('Se a API retorna correctAnswer corretamente, o problema é no frontend.');
    console.log('Se a API retorna null/undefined, o problema é no backend.');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

testAPI();
