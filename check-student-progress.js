require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkStudentProgress() {
  try {
    console.log('🔍 Verificando tabela student_progress...\n');
    
    // Verificar se a tabela existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'student_progress'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela student_progress NÃO EXISTE!');
      console.log('\nEssa é a causa do problema. A tabela precisa ser criada.');
      return;
    }
    
    console.log('✅ Tabela student_progress existe\n');
    
    // Verificar registros
    const countResult = await pool.query('SELECT COUNT(*) as total FROM student_progress');
    console.log(`📊 Total de registros de progresso: ${countResult.rows[0].total}\n`);
    
    if (parseInt(countResult.rows[0].total) > 0) {
      // Listar alguns registros
      const progressResult = await pool.query(`
        SELECT sp.student_id, sp.course_id, sp.progress_percentage, 
               u.name as student_name, c.title as course_title
        FROM student_progress sp
        JOIN users u ON sp.student_id = u.id
        JOIN courses c ON sp.course_id = c.id
        LIMIT 10
      `);
      
      console.log('📋 Alguns registros de progresso:');
      progressResult.rows.forEach(row => {
        console.log(`  - ${row.student_name}: ${row.course_title} (${row.progress_percentage}%)`);
      });
    } else {
      console.log('⚠️  Nenhum registro de progresso encontrado');
      console.log('Isso explica por que "Meus Cursos" está vazio.');
      console.log('\nOs cursos só aparecem depois que o aluno:');
      console.log('  1. Acessa o conteúdo do curso pela primeira vez, OU');
      console.log('  2. Marca uma aula como completa');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkStudentProgress();
