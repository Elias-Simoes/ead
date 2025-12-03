const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'plataforma_ead',
  user: 'user',
  password: 'password',
});

async function verifyModuleIsolation() {
  try {
    console.log('\n🔍 VERIFICANDO ISOLAMENTO DE MÓDULOS POR CURSO\n');
    console.log('=' .repeat(70));

    // Buscar o curso que você está editando
    const courseId = '5d39b6f5-8164-4b2f-89d8-12345f2e97fd';
    
    console.log(`\n1️⃣ Curso sendo editado: ${courseId}\n`);

    // Buscar TODOS os módulos deste curso
    const allModulesResult = await pool.query(`
      SELECT id, title, course_id, order_index
      FROM modules
      WHERE course_id = $1
      ORDER BY order_index ASC
    `, [courseId]);

    console.log(`Total de módulos do curso: ${allModulesResult.rows.length}\n`);
    allModulesResult.rows.forEach((module, index) => {
      console.log(`${index + 1}. ${module.title}`);
      console.log(`   ID: ${module.id}`);
      console.log(`   Course ID: ${module.course_id}`);
      console.log('');
    });

    // Buscar módulos SEM avaliação (query do backend)
    console.log(`\n2️⃣ Módulos SEM avaliação (query do backend):\n`);
    
    const modulesWithoutResult = await pool.query(`
      SELECT m.id, m.title, m.description, m.order_index, m.course_id
      FROM modules m
      LEFT JOIN assessments a ON m.id = a.module_id
      WHERE m.course_id = $1 AND a.id IS NULL
      ORDER BY m.order_index ASC
    `, [courseId]);

    console.log(`Total: ${modulesWithoutResult.rows.length} módulo(s)\n`);
    
    if (modulesWithoutResult.rows.length > 0) {
      modulesWithoutResult.rows.forEach((module, index) => {
        console.log(`${index + 1}. ${module.title}`);
        console.log(`   ID: ${module.id}`);
        console.log(`   Course ID: ${module.course_id}`);
        console.log(`   ✅ Pertence ao curso correto: ${module.course_id === courseId ? 'SIM' : 'NÃO'}`);
        console.log('');
      });
    } else {
      console.log('✅ Nenhum módulo sem avaliação (todos já têm avaliação)');
    }

    // Verificar se há módulos de OUTROS cursos sendo retornados (BUG)
    console.log(`\n3️⃣ Verificando se há módulos de outros cursos:\n`);
    
    const otherCoursesModules = modulesWithoutResult.rows.filter(m => m.course_id !== courseId);
    
    if (otherCoursesModules.length > 0) {
      console.log(`❌ BUG ENCONTRADO! ${otherCoursesModules.length} módulo(s) de outros cursos:\n`);
      otherCoursesModules.forEach((module, index) => {
        console.log(`${index + 1}. ${module.title}`);
        console.log(`   ID: ${module.id}`);
        console.log(`   Course ID: ${module.course_id} (ERRADO! Deveria ser ${courseId})`);
        console.log('');
      });
    } else {
      console.log('✅ Nenhum módulo de outros cursos encontrado');
      console.log('✅ Isolamento está correto!');
    }

    // Verificar avaliações do curso
    console.log(`\n4️⃣ Avaliações do curso:\n`);
    
    const assessmentsResult = await pool.query(`
      SELECT a.id, a.title, a.module_id, m.title as module_title, m.course_id
      FROM assessments a
      JOIN modules m ON a.module_id = m.id
      WHERE m.course_id = $1
      ORDER BY m.order_index ASC
    `, [courseId]);

    console.log(`Total: ${assessmentsResult.rows.length} avaliação(ões)\n`);
    
    assessmentsResult.rows.forEach((assessment, index) => {
      console.log(`${index + 1}. ${assessment.title}`);
      console.log(`   Módulo: ${assessment.module_title}`);
      console.log(`   Module ID: ${assessment.module_id}`);
      console.log(`   Course ID: ${assessment.course_id}`);
      console.log('');
    });

    // Resumo
    console.log('\n5️⃣ Resumo:\n');
    console.log('=' .repeat(70));
    console.log(`Curso: ${courseId}`);
    console.log(`Total de módulos: ${allModulesResult.rows.length}`);
    console.log(`Módulos COM avaliação: ${assessmentsResult.rows.length}`);
    console.log(`Módulos SEM avaliação: ${modulesWithoutResult.rows.length}`);
    console.log(`Módulos de outros cursos (BUG): ${otherCoursesModules.length}`);
    console.log('=' .repeat(70));

    if (otherCoursesModules.length === 0) {
      console.log('\n✅ SISTEMA FUNCIONANDO CORRETAMENTE!');
      console.log('✅ Módulos estão isolados por curso!');
    } else {
      console.log('\n❌ BUG DETECTADO!');
      console.log('❌ Módulos de outros cursos estão sendo retornados!');
    }

    console.log('\n');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    await pool.end();
  }
}

verifyModuleIsolation();
