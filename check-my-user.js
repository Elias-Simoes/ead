require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUser() {
  try {
    // Pegar o email do usuário que você está usando
    const email = 'student@test.com'; // Altere para o email que você está usando
    
    console.log(`🔍 Verificando usuário: ${email}\n`);
    
    const userResult = await pool.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE email = $1
    `, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Usuário encontrado:`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}\n`);
    
    // Verificar progresso desse usuário
    const progressResult = await pool.query(`
      SELECT sp.course_id, sp.progress_percentage, c.title, c.status
      FROM student_progress sp
      JOIN courses c ON sp.course_id = c.id
      WHERE sp.student_id = $1
    `, [user.id]);
    
    console.log(`📊 Cursos com progresso: ${progressResult.rows.length}`);
    
    if (progressResult.rows.length > 0) {
      console.log('\n📋 Seus cursos:');
      progressResult.rows.forEach(row => {
        console.log(`  - ${row.title} (${row.status}) - ${row.progress_percentage}%`);
      });
    } else {
      console.log('\n⚠️  Você não tem nenhum curso iniciado ainda.');
      console.log('\nPara ver cursos em "Meus Cursos", você precisa:');
      console.log('  1. Ir para a página "Cursos" (/courses)');
      console.log('  2. Clicar em um curso para ver os detalhes');
      console.log('  3. Acessar o conteúdo do curso');
      console.log('\nApós isso, o curso aparecerá em "Meus Cursos".');
    }
    
    // Verificar assinatura
    const subResult = await pool.query(`
      SELECT status, start_date, end_date
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [user.id]);
    
    if (subResult.rows.length > 0) {
      const sub = subResult.rows[0];
      console.log(`\n💳 Assinatura: ${sub.status}`);
      console.log(`   Início: ${sub.start_date}`);
      console.log(`   Fim: ${sub.end_date}`);
    } else {
      console.log('\n⚠️  Você não tem assinatura ativa.');
      console.log('Você precisa de uma assinatura ativa para acessar os cursos.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
