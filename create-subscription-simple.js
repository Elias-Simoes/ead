require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ead_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function createSubscription() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Criando assinatura diretamente no banco...\n');

    // 1. Buscar o estudante
    const studentResult = await client.query(
      "SELECT id, name, email FROM users WHERE email = 'student@example.com'"
    );

    if (studentResult.rows.length === 0) {
      console.log('❌ Estudante não encontrado');
      return;
    }

    const student = studentResult.rows[0];
    console.log(`✅ Estudante encontrado: ${student.name} (${student.id})\n`);

    // 2. Buscar plano disponível
    const planResult = await client.query(
      "SELECT id, name FROM plans LIMIT 1"
    );

    if (planResult.rows.length === 0) {
      console.log('❌ Nenhum plano encontrado. Criando plano básico...');
      
      const newPlanResult = await client.query(
        `INSERT INTO plans (name, description, price, duration_days, features, is_active)
         VALUES ('Premium', 'Plano Premium com acesso total', 0, 365, '["Acesso a todos os cursos", "Certificados"]', true)
         RETURNING id, name`
      );
      
      var plan = newPlanResult.rows[0];
      console.log(`✅ Plano criado: ${plan.name}\n`);
    } else {
      var plan = planResult.rows[0];
      console.log(`✅ Plano encontrado: ${plan.name}\n`);
    }

    // 3. Verificar se já existe assinatura
    const existingSubResult = await client.query(
      'SELECT * FROM subscriptions WHERE student_id = $1',
      [student.id]
    );

    if (existingSubResult.rows.length > 0) {
      console.log('⚠️  Assinatura já existe, atualizando...');
      
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      await client.query(
        `UPDATE subscriptions 
         SET status = 'active', 
             current_period_end = $1,
             updated_at = NOW()
         WHERE student_id = $2`,
        [endDate, student.id]
      );

      console.log('✅ Assinatura atualizada para ativa!\n');
    } else {
      console.log('📝 Criando nova assinatura...');
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      await client.query(
        `INSERT INTO subscriptions (
          student_id, plan_id, status, current_period_start, current_period_end, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [student.id, plan.id, 'active', startDate, endDate]
      );

      console.log('✅ Assinatura criada com sucesso!\n');
    }

    // 4. Verificar assinatura criada
    const subResult = await client.query(
      'SELECT * FROM subscriptions WHERE student_id = $1',
      [student.id]
    );

    const subscription = subResult.rows[0];
    console.log('📋 Detalhes da assinatura:');
    console.log(`   - Plano ID: ${subscription.plan_id}`);
    console.log(`   - Status: ${subscription.status}`);
    console.log(`   - Início: ${new Date(subscription.current_period_start).toLocaleDateString()}`);
    console.log(`   - Fim: ${new Date(subscription.current_period_end).toLocaleDateString()}`);

    // 5. Atualizar campos de assinatura na tabela students
    console.log('\n5. Atualizando status na tabela students...');
    
    await client.query(
      `UPDATE students 
       SET subscription_status = 'active',
           subscription_expires_at = $1
       WHERE id = $2`,
      [subscription.current_period_end, student.id]
    );

    console.log('✅ Status do estudante atualizado!\n');

    console.log('✅ Problema resolvido!');
    console.log('   O estudante agora pode acessar as aulas.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createSubscription();
