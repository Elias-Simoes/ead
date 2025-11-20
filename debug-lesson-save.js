require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function debugLesson() {
  try {
    const lessonId = '56b17c39-66c4-435d-b4dd-6bc3d57e091d';
    
    console.log('=== VERIFICANDO AULA ===');
    const lessonResult = await pool.query(
      'SELECT id, title, text_content, video_url, duration FROM lessons WHERE id = $1',
      [lessonId]
    );
    
    if (lessonResult.rows.length > 0) {
      const lesson = lessonResult.rows[0];
      console.log('\nDados da aula:');
      console.log('ID:', lesson.id);
      console.log('Título:', lesson.title);
      console.log('text_content:', lesson.text_content);
      console.log('video_url:', lesson.video_url);
      console.log('duration:', lesson.duration);
    } else {
      console.log('Aula não encontrada!');
    }
    
    console.log('\n=== VERIFICANDO RECURSOS ===');
    const resourcesResult = await pool.query(
      'SELECT id, title, type, file_key FROM lesson_resources WHERE lesson_id = $1',
      [lessonId]
    );
    
    console.log(`\nTotal de recursos: ${resourcesResult.rows.length}`);
    resourcesResult.rows.forEach((resource, index) => {
      console.log(`\nRecurso ${index + 1}:`);
      console.log('  ID:', resource.id);
      console.log('  Título:', resource.title);
      console.log('  Tipo:', resource.type);
      console.log('  file_key:', resource.file_key);
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

debugLesson();
