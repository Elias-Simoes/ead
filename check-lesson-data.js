const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Pegar o ID da aula da linha de comando ou usar um padrão
const lessonId = process.argv[2] || 'ae2393fa-ca5e-4246-bc9e-5a07e42ca268';

async function checkLessonData() {
  const client = await pool.connect();
  
  try {
    console.log(`🔍 Verificando aula: ${lessonId}\n`);
    
    const result = await client.query(
      `SELECT id, title, description, 
              type, content, 
              video_url, text_content, external_link,
              duration, order_index, created_at
       FROM lessons 
       WHERE id = $1`,
      [lessonId]
    );

    if (result.rows.length === 0) {
      console.log('❌ Aula não encontrada!');
      return;
    }

    const lesson = result.rows[0];
    
    console.log('📚 Dados da Aula:');
    console.log('='.repeat(80));
    console.log(`ID: ${lesson.id}`);
    console.log(`Título: ${lesson.title}`);
    console.log(`Descrição: ${lesson.description || 'N/A'}`);
    console.log(`Duração: ${lesson.duration || 0} minutos`);
    console.log(`Ordem: ${lesson.order_index}`);
    console.log(`Criado em: ${lesson.created_at}`);
    console.log('\n📝 Campos de Conteúdo:');
    console.log('-'.repeat(80));
    console.log(`Type (antigo): ${lesson.type || 'NULL'}`);
    console.log(`Content (antigo): ${lesson.content || 'NULL'}`);
    console.log(`Video URL: ${lesson.video_url || 'NULL'}`);
    console.log(`External Link: ${lesson.external_link || 'NULL'}`);
    
    console.log('\n📄 Text Content:');
    console.log('-'.repeat(80));
    if (lesson.text_content) {
      console.log(`Tipo: ${typeof lesson.text_content}`);
      console.log(`Tamanho: ${lesson.text_content.length} caracteres`);
      console.log(`Primeiros 200 caracteres:`);
      console.log(lesson.text_content.substring(0, 200));
      
      // Tentar parsear como JSON
      try {
        const parsed = JSON.parse(lesson.text_content);
        console.log('\n✅ É JSON válido!');
        console.log(`Estrutura:`);
        console.log(JSON.stringify(parsed, null, 2).substring(0, 500));
      } catch (e) {
        console.log('\n❌ NÃO é JSON válido');
        console.log(`Erro: ${e.message}`);
      }
    } else {
      console.log('NULL - Sem conteúdo de texto');
    }
    
    // Buscar recursos
    const resourcesResult = await client.query(
      'SELECT * FROM lesson_resources WHERE lesson_id = $1',
      [lessonId]
    );
    
    console.log('\n📎 Recursos da Aula:');
    console.log('-'.repeat(80));
    if (resourcesResult.rows.length > 0) {
      resourcesResult.rows.forEach((resource, i) => {
        console.log(`${i + 1}. ${resource.title} (${resource.type})`);
        console.log(`   URL: ${resource.url || resource.file_key}`);
      });
    } else {
      console.log('Nenhum recurso encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkLessonData();
