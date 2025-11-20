require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testLessonUpdate() {
  try {
    // Login como instrutor
    console.log('1. Fazendo login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    
    const token = loginRes.data.data.tokens.accessToken;
    console.log('✅ Login realizado');

    // Atualizar aula
    const lessonId = '56b17c39-66c4-435d-b4dd-6bc3d57e091d';
    
    console.log('\n2. Atualizando aula com text_content...');
    const updateRes = await axios.patch(
      `${API_URL}/courses/lessons/${lessonId}`,
      {
        title: 'Teste 3 - Atualizado',
        text_content: 'Este é o conteúdo em texto da aula!',
        video_url: 'https://www.youtube.com/watch?v=test',
        duration: 45
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✅ Aula atualizada:', updateRes.data);
    
    // Verificar se foi salvo
    console.log('\n3. Verificando no banco de dados...');
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query(
      'SELECT id, title, text_content, video_url, duration FROM lessons WHERE id = $1',
      [lessonId]
    );
    
    console.log('\nDados no banco:');
    console.log('  Título:', result.rows[0].title);
    console.log('  text_content:', result.rows[0].text_content);
    console.log('  video_url:', result.rows[0].video_url);
    console.log('  duration:', result.rows[0].duration);
    
    await pool.end();
    
    if (result.rows[0].text_content) {
      console.log('\n✅ text_content foi salvo com sucesso!');
    } else {
      console.log('\n❌ text_content ainda está NULL');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testLessonUpdate();
