require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSubscriptionStatus() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando status da assinatura...\n');
    
    // Buscar informações do estudante
    const userResult = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role
      FROM users u
      WHERE u.email = 'student.e2e@test.com'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 Usuário:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🎭 Role:', user.role);
    console.log('');
    
    // Buscar informações da tabela students
    const studentResult = await client.query(`
      SELECT 
        subscription_status,
        subscription_expires_at
      FROM students
      WHERE id = $1
    `, [user.id]);
    
    if (studentResult.rows.length > 0) {
      const student = studentResult.rows[0];
      console.log('📊 Status na tabela students:');
      console.log('   Status:', student.subscription_status || 'N/A');
      console.log('   Expira em:', student.subscription_expires_at || 'N/A');
      console.log('');
    }
    
    // Buscar assinaturas
    const subscriptionsResult = await client.query(`
      SELECT 
        s.id,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.cancelled_at,
        p.name as plan_name,
        p.price
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.student_id = $1
      ORDER BY s.created_at DESC
      LIMIT 5
    `, [user.id]);
    
    if (subscriptionsResult.rows.length === 0) {
      console.log('❌ Nenhuma assinatura encontrada!');
      console.log('');
      console.log('💡 Para criar uma assinatura de teste, acesse:');
      console.log('   http://localhost:5174/plans');
      console.log('');
      console.log('   Ou use uma destas URLs diretas:');
      console.log('   http://localhost:5174/checkout/80850f4b-1c38-4a30-917e-2c93a2abfe2a');
    } else {
      console.log('📋 Assinaturas encontradas:\n');
      
      subscriptionsResult.rows.forEach((sub, index) => {
        console.log(`${index + 1}. ${sub.plan_name} - R$ ${sub.price}`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   Período: ${sub.current_period_start?.toISOString().split('T')[0]} até ${sub.current_period_end?.toISOString().split('T')[0]}`);
        if (sub.cancelled_at) {
          console.log(`   ⚠️  Cancelada em: ${sub.cancelled_at.toISOString().split('T')[0]}`);
        }
        console.log('');
      });
      
      const activeSub = subscriptionsResult.rows.find(s => s.status === 'active');
      const now = new Date();
      
      if (activeSub && new Date(activeSub.current_period_end) > now) {
        console.log('✅ Assinatura ATIVA - Pode acessar conteúdo das aulas');
      } else {
        console.log('❌ Assinatura INATIVA - Pode ver cursos mas não acessar conteúdo');
        console.log('');
        console.log('💡 Para renovar, acesse:');
        console.log('   http://localhost:5174/subscription/renew');
        console.log('');
        console.log('   Ou escolha um novo plano:');
        console.log('   http://localhost:5174/plans');
      }
    }
    
    console.log('\n📝 Comportamento esperado:');
    console.log('   ✅ Pode ver lista de cursos (catálogo)');
    console.log('   ✅ Pode ver detalhes dos cursos');
    if (subscriptionsResult.rows.length > 0 && subscriptionsResult.rows[0].status === 'active') {
      console.log('   ✅ Pode acessar conteúdo das aulas');
      console.log('   ✅ Pode fazer avaliações');
      console.log('   ✅ Pode obter certificados');
    } else {
      console.log('   ❌ NÃO pode acessar conteúdo das aulas');
      console.log('   ❌ NÃO pode fazer avaliações');
      console.log('   ❌ NÃO pode obter certificados');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSubscriptionStatus();
