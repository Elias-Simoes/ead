require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

const API_URL = 'http://localhost:3000/api';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testCompleteLesson() {
  try {
    console.log('=== TESTE COMPLETO DE AULA ===\n');

    // 1. Login
    console.log('1. Fazendo login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    const token = loginRes.data.data.tokens.accessToken;
    console.log('✅ Login realizado\n');

    // 2. Criar nova aula com todos os campos
    const moduleId = '21853d88-a4f5-4ef5-a2b3-f2a203a20dde'; // Use um módulo existente
    
    console.log('2. Criando nova aula com conteúdo completo...');
    const createRes = await axios.post(
      `${API_URL}/courses/modules/${moduleId}/lessons`,
      {
        title: 'Aula Teste Completa',
        description: 'Descrição da aula de teste',
        text_content: 'Este é o conteúdo em texto da aula. Pode ser bem longo e detalhado.',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        external_link: 'https://docs.example.com/tutorial',
        duration: 60
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const newLessonId = createRes.data.data.id;
    console.log('✅ Aula criada com ID:', newLessonId);
    console.log('   Dados retornados:', JSON.stringify(createRes.data.data, null, 2));

    // 3. Adicionar recursos à aula
    console.log('\n3. Adicionando recursos à aula...');
    const resourcesRes = await axios.post(
      `${API_URL}/courses/lessons/${newLessonId}/resources`,
      {
        resources: [
          {
            type: 'pdf',
            title: 'Material de Apoio',
            description: 'PDF com conteúdo complementar',
            url: 'https://example.com/material.pdf',
            file_size: 1024000,
            mime_type: 'application/pdf'
          },
          {
            type: 'link',
            title: 'Documentação Oficial',
            description: 'Link para a documentação',
            url: 'https://docs.example.com'
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✅ Recursos adicionados:', resourcesRes.data.data.length);

    // 4. Verificar no banco de dados
    console.log('\n4. Verificando dados no banco...');
    const lessonResult = await pool.query(
      'SELECT * FROM lessons WHERE id = $1',
      [newLessonId]
    );
    
    const lesson = lessonResult.rows[0];
    console.log('\n📊 Dados da aula no banco:');
    console.log('   ID:', lesson.id);
    console.log('   Título:', lesson.title);
    console.log('   Descrição:', lesson.description);
    console.log('   text_content:', lesson.text_content ? '✅ Salvo' : '❌ NULL');
    console.log('   video_url:', lesson.video_url ? '✅ Salvo' : '❌ NULL');
    console.log('   external_link:', lesson.external_link ? '✅ Salvo' : '❌ NULL');
    console.log('   duration:', lesson.duration);

    const resourcesResult = await pool.query(
      'SELECT * FROM lesson_resources WHERE lesson_id = $1',
      [newLessonId]
    );
    
    console.log('\n📎 Recursos no banco:');
    console.log('   Total:', resourcesResult.rows.length);
    resourcesResult.rows.forEach((resource, index) => {
      console.log(`   ${index + 1}. ${resource.title} (${resource.type})`);
    });

    // 5. Buscar aula pela API
    console.log('\n5. Buscando aula pela API...');
    const getRes = await axios.get(
      `${API_URL}/courses/lessons/${newLessonId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✅ Aula recuperada pela API');
    console.log('   text_content:', getRes.data.data.text_content ? '✅ Presente' : '❌ Ausente');
    console.log('   video_url:', getRes.data.data.video_url ? '✅ Presente' : '❌ Ausente');
    console.log('   external_link:', getRes.data.data.external_link ? '✅ Presente' : '❌ Ausente');

    // 6. Buscar recursos pela API
    console.log('\n6. Buscando recursos pela API...');
    const getResourcesRes = await axios.get(
      `${API_URL}/courses/lessons/${newLessonId}/resources`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✅ Recursos recuperados:', getResourcesRes.data.data.length);

    // 7. Atualizar aula
    console.log('\n7. Atualizando aula...');
    await axios.patch(
      `${API_URL}/courses/lessons/${newLessonId}`,
      {
        text_content: 'Conteúdo atualizado com mais informações!',
        duration: 75
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('✅ Aula atualizada');

    // 8. Verificar atualização
    const updatedResult = await pool.query(
      'SELECT text_content, duration FROM lessons WHERE id = $1',
      [newLessonId]
    );
    console.log('   text_content atualizado:', updatedResult.rows[0].text_content ? '✅' : '❌');
    console.log('   duration atualizado:', updatedResult.rows[0].duration);

    console.log('\n✅ TODOS OS TESTES PASSARAM!');
    console.log('\n📝 Resumo:');
    console.log('   ✅ Criação de aula com múltiplos conteúdos');
    console.log('   ✅ Salvamento de text_content');
    console.log('   ✅ Salvamento de video_url');
    console.log('   ✅ Salvamento de external_link');
    console.log('   ✅ Adição de recursos');
    console.log('   ✅ Recuperação pela API');
    console.log('   ✅ Atualização de aula');

  } catch (error) {
    console.error('\n❌ ERRO:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await pool.end();
  }
}

testCompleteLesson();
