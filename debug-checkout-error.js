require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugCheckout() {
  const client = await pool.connect();
  
  try {
    // Pegar o planId da URL (último segmento)
    const planId = '1d2e0e4c-8f8f4b0f4b2-1c2b-9176-2d93a2e40c2a';
    
    console.log('🔍 Investigando erro de checkout...\n');
    console.log('Plan ID da URL:', planId);
    
    // 1. Verificar se o plano existe
    console.log('\n1. Verificando se o plano existe...');
    const planResult = await client.query(`
      SELECT * FROM plans WHERE id = $1
    `, [planId]);
    
    if (planResult.rows.length === 0) {
      console.log('❌ Plano não encontrado!');
      
      // Listar todos os planos disponíveis
      console.log('\n📋 Planos disponíveis:');
      const allPlans = await client.query(`
        SELECT id, name, price, interval, is_active 
        FROM plans 
        ORDER BY price ASC
      `);
      
      allPlans.rows.forEach(plan => {
        console.log(`  - ${plan.name} (${plan.interval})`);
        console.log(`    ID: ${plan.id}`);
        console.log(`    Preço: R$ ${plan.price}`);
        console.log(`    Ativo: ${plan.is_active}`);
        console.log('');
      });
    } else {
      console.log('✅ Plano encontrado:', planResult.rows[0]);
    }
    
    // 2. Verificar usuário de teste
    console.log('\n2. Verificando usuário de teste...');
    const userResult = await client.query(`
      SELECT id, email, name, role 
      FROM users 
      WHERE email = 'student.e2e@test.com'
    `);
    
    if (userResult.rows.length > 0) {
      console.log('✅ Usuário encontrado:', userResult.rows[0]);
    } else {
      console.log('❌ Usuário não encontrado!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

debugCheckout();
