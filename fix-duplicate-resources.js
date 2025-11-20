require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixDuplicateResources() {
  try {
    console.log('=== VERIFICANDO RECURSOS DUPLICADOS ===\n');

    // Buscar recursos duplicados (mesmo lesson_id, title e type)
    const duplicatesQuery = `
      SELECT lesson_id, title, type, COUNT(*) as count
      FROM lesson_resources
      GROUP BY lesson_id, title, type
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    const duplicates = await pool.query(duplicatesQuery);
    
    if (duplicates.rows.length === 0) {
      console.log('✅ Nenhum recurso duplicado encontrado!');
      return;
    }

    console.log(`⚠️ Encontrados ${duplicates.rows.length} grupos de recursos duplicados:\n`);
    
    for (const dup of duplicates.rows) {
      console.log(`📎 Aula: ${dup.lesson_id}`);
      console.log(`   Título: ${dup.title}`);
      console.log(`   Tipo: ${dup.type}`);
      console.log(`   Duplicatas: ${dup.count}\n`);
    }

    // Perguntar se quer limpar
    console.log('Deseja remover as duplicatas? (manterá apenas a mais recente de cada grupo)');
    console.log('Execute: node fix-duplicate-resources.js --clean\n');

    // Se passou --clean, limpar
    if (process.argv.includes('--clean')) {
      console.log('🧹 Limpando duplicatas...\n');

      for (const dup of duplicates.rows) {
        // Buscar todos os recursos deste grupo
        const resourcesQuery = `
          SELECT id, created_at
          FROM lesson_resources
          WHERE lesson_id = $1 AND title = $2 AND type = $3
          ORDER BY created_at DESC
        `;
        
        const resources = await pool.query(resourcesQuery, [
          dup.lesson_id,
          dup.title,
          dup.type
        ]);

        // Manter apenas o primeiro (mais recente), deletar os outros
        const toKeep = resources.rows[0].id;
        const toDelete = resources.rows.slice(1).map(r => r.id);

        if (toDelete.length > 0) {
          await pool.query(
            'DELETE FROM lesson_resources WHERE id = ANY($1)',
            [toDelete]
          );
          
          console.log(`✅ Removidas ${toDelete.length} duplicatas de "${dup.title}"`);
        }
      }

      console.log('\n✅ Limpeza concluída!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

fixDuplicateResources();
