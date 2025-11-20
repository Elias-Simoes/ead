const { Pool } = require('pg');
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const lessonId = process.argv[2];

async function checkResources() {
  const client = await pool.connect();
  
  try {
    if (!lessonId) {
      // Listar todas as aulas com recursos
      const result = await client.query(`
        SELECT l.id, l.title, COUNT(lr.id) as resource_count
        FROM lessons l
        LEFT JOIN lesson_resources lr ON l.id = lr.lesson_id
        GROUP BY l.id, l.title
        HAVING COUNT(lr.id) > 0
        ORDER BY l.created_at DESC
        LIMIT 10
      `);
      
      console.log('📚 Aulas com recursos:\n');
      result.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.title}`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Recursos: ${row.resource_count}`);
        console.log('');
      });
      
      if (result.rows.length > 0) {
        console.log('\nPara ver detalhes, execute:');
        console.log(`node check-lesson-resources.js ${result.rows[0].id}`);
      }
      return;
    }

    // Buscar recursos da aula específica
    const lessonResult = await client.query(
      'SELECT * FROM lessons WHERE id = $1',
      [lessonId]
    );
    
    if (lessonResult.rows.length === 0) {
      console.log('❌ Aula não encontrada!');
      return;
    }
    
    const lesson = lessonResult.rows[0];
    console.log(`📚 Aula: ${lesson.title}\n`);
    
    const resourcesResult = await client.query(
      'SELECT * FROM lesson_resources WHERE lesson_id = $1 ORDER BY created_at DESC',
      [lessonId]
    );
    
    if (resourcesResult.rows.length === 0) {
      console.log('📎 Nenhum recurso encontrado para esta aula.');
      return;
    }
    
    console.log(`📎 ${resourcesResult.rows.length} Recursos encontrados:\n`);
    
    for (const resource of resourcesResult.rows) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📄 ${resource.title}`);
      console.log(`   Tipo: ${resource.type}`);
      console.log(`   ID: ${resource.id}`);
      console.log(`   Criado em: ${resource.created_at}`);
      
      if (resource.file_key) {
        console.log(`   File Key: ${resource.file_key}`);
        
        // Verificar se existe no R2
        try {
          await s3Client.send(new HeadObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: resource.file_key,
          }));
          console.log(`   ✅ Arquivo existe no R2`);
          console.log(`   🔗 URL: ${process.env.R2_PUBLIC_URL}/${resource.file_key}`);
        } catch (error) {
          if (error.name === 'NotFound') {
            console.log(`   ❌ Arquivo NÃO existe no R2`);
          } else {
            console.log(`   ⚠️ Erro ao verificar R2: ${error.message}`);
          }
        }
      }
      
      if (resource.url) {
        console.log(`   URL: ${resource.url}`);
      }
      
      if (resource.description) {
        console.log(`   Descrição: ${resource.description}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkResources();
