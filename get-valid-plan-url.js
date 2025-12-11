require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getValidPlanUrl() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Buscando planos disponíveis...\n');
    
    const result = await client.query(`
      SELECT id, name, price, interval, is_active 
      FROM plans 
      WHERE is_active = true
      ORDER BY price ASC
      LIMIT 3
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhum plano ativo encontrado!');
      return;
    }
    
    console.log('✅ Planos disponíveis:\n');
    
    result.rows.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   Preço: R$ ${plan.price}`);
      console.log(`   Intervalo: ${plan.interval}`);
      console.log(`   URL de checkout: http://localhost:5174/checkout/${plan.id}`);
      console.log('');
    });
    
    console.log('\n🎯 Use uma dessas URLs para testar o checkout!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

getValidPlanUrl();
