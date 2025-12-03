require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkPlans() {
  try {
    console.log('🔍 Verificando planos no banco de dados...\n');

    // Verificar todos os planos
    const allPlans = await pool.query('SELECT * FROM plans ORDER BY created_at');
    console.log(`📊 Total de planos: ${allPlans.rows.length}`);
    
    if (allPlans.rows.length > 0) {
      console.log('\n📋 Todos os planos:');
      allPlans.rows.forEach(plan => {
        console.log(`  - ID: ${plan.id}`);
        console.log(`    Nome: ${plan.name}`);
        console.log(`    Preço: ${plan.currency} ${plan.price}`);
        console.log(`    Intervalo: ${plan.interval}`);
        console.log(`    Ativo: ${plan.is_active ? '✅ Sim' : '❌ Não'}`);
        console.log('');
      });
    }

    // Verificar planos ativos
    const activePlans = await pool.query('SELECT * FROM plans WHERE is_active = true ORDER BY price ASC');
    console.log(`\n✅ Planos ativos: ${activePlans.rows.length}`);
    
    if (activePlans.rows.length > 0) {
      console.log('\n📋 Planos ativos:');
      activePlans.rows.forEach(plan => {
        console.log(`  - ${plan.name}: ${plan.currency} ${plan.price}/${plan.interval}`);
      });
    } else {
      console.log('\n⚠️  Nenhum plano ativo encontrado!');
      console.log('💡 Você precisa criar planos ativos no banco de dados.');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar planos:', error.message);
  } finally {
    await pool.end();
  }
}

checkPlans();
