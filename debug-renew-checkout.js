require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugRenewCheckout() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugando erro de renovação de plano...\n');
    
    // 1. Verificar planos disponíveis
    const plansResult = await client.query(`
      SELECT id, name, price, currency, interval, is_active 
      FROM plans 
      WHERE is_active = true
      ORDER BY price ASC
    `);
    
    console.log('📋 Planos disponíveis no banco:');
    plansResult.rows.forEach(plan => {
      console.log(`   - ID: ${plan.id}`);
      console.log(`     Nome: ${plan.name}`);
      console.log(`     Preço: ${plan.currency} ${plan.price}`);
      console.log(`     Intervalo: ${plan.interval}`);
      console.log(`     Ativo: ${plan.is_active}`);
      console.log('');
    });
    
    // 2. Verificar usuário de teste
    const userResult = await client.query(`
      SELECT id, email, name, role 
      FROM users 
      WHERE email = 'student.e2e@test.com'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário de teste não encontrado!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 Usuário de teste:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log('');
    
    // 3. Verificar assinatura atual
    const subResult = await client.query(`
      SELECT 
        s.id,
        s.status,
        s.current_period_end,
        p.name as plan_name,
        p.id as plan_id
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.student_id = $1
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [user.id]);
    
    if (subResult.rows.length === 0) {
      console.log('📝 Status: Usuário SEM assinatura');
    } else {
      const sub = subResult.rows[0];
      console.log('📝 Assinatura atual:');
      console.log(`   Status: ${sub.status}`);
      console.log(`   Plano: ${sub.plan_name} (${sub.plan_id})`);
      console.log(`   Vence: ${sub.current_period_end?.toISOString().split('T')[0]}`);
    }
    console.log('');
    
    // 4. Testar URLs de checkout
    console.log('🌐 URLs para teste:');
    console.log('   Renovação: http://localhost:5174/subscription/renew');
    
    if (plansResult.rows.length > 0) {
      const firstPlan = plansResult.rows[0];
      console.log(`   Checkout direto: http://localhost:5174/checkout/${firstPlan.id}`);
    }
    console.log('');
    
    // 5. Verificar configuração de pagamento
    const configResult = await client.query(`
      SELECT * FROM payment_config LIMIT 1
    `);
    
    if (configResult.rows.length === 0) {
      console.log('⚠️  PROBLEMA: Configuração de pagamento não encontrada!');
      console.log('   Isso pode causar erro no checkout.');
      console.log('');
      console.log('   Solução: Execute a migration 027 ou crie a configuração:');
      console.log('   INSERT INTO payment_config (max_installments, pix_discount_percent, installments_without_interest, pix_expiration_minutes)');
      console.log('   VALUES (12, 5.0, 3, 30);');
    } else {
      console.log('✅ Configuração de pagamento encontrada:');
      const config = configResult.rows[0];
      console.log(`   Max parcelas: ${config.max_installments}`);
      console.log(`   Desconto PIX: ${config.pix_discount_percent}%`);
      console.log(`   Parcelas sem juros: ${config.installments_without_interest}`);
      console.log(`   Expiração PIX: ${config.pix_expiration_minutes} minutos`);
    }
    console.log('');
    
    console.log('🔑 Credenciais para teste:');
    console.log('   Email: student.e2e@test.com');
    console.log('   Senha: Test123!@#');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugRenewCheckout();
