/**
 * Script para simular processamento de webhook de pagamento com cartão
 * Cria assinatura manualmente após pagamento
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'plataforma_ead',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function simulateWebhook() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const email = 'test.student.1765284983885@test.com';
    
    console.log('🔄 Simulando processamento de webhook de pagamento...\n');

    // Buscar usuário
    const userResult = await client.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const user = userResult.rows[0];
    console.log('👤 Usuário:', user.name);
    console.log('📧 Email:', user.email);
    console.log('');

    // Buscar um plano ativo
    const planResult = await client.query(
      'SELECT * FROM plans WHERE is_active = true ORDER BY price LIMIT 1'
    );

    if (planResult.rows.length === 0) {
      throw new Error('Nenhum plano ativo encontrado');
    }

    const plan = planResult.rows[0];
    console.log('📦 Plano selecionado:', plan.name);
    console.log('💰 Valor:', `R$ ${parseFloat(plan.price).toFixed(2)}`);
    console.log('');

    // Calcular período da assinatura
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 mês

    console.log('📅 Período da assinatura:');
    console.log('  Início:', startDate.toLocaleDateString('pt-BR'));
    console.log('  Término:', endDate.toLocaleDateString('pt-BR'));
    console.log('');

    // Verificar se já existe assinatura ativa
    const existingSubResult = await client.query(
      'SELECT id, status FROM subscriptions WHERE student_id = $1 AND status = $2',
      [user.id, 'active']
    );

    let subscriptionId;

    if (existingSubResult.rows.length > 0) {
      // Estender assinatura existente
      console.log('🔄 Estendendo assinatura existente...');
      
      const updateResult = await client.query(
        `UPDATE subscriptions
        SET current_period_end = current_period_end + INTERVAL '1 month',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, current_period_end`,
        [existingSubResult.rows[0].id]
      );
      
      subscriptionId = updateResult.rows[0].id;
      const newEndDate = new Date(updateResult.rows[0].current_period_end);
      
      console.log('✅ Assinatura estendida');
      console.log('  Nova data de término:', newEndDate.toLocaleDateString('pt-BR'));
    } else {
      // Criar nova assinatura
      console.log('✨ Criando nova assinatura...');
      
      const insertResult = await client.query(
        `INSERT INTO subscriptions
        (student_id, plan_id, status, current_period_start, current_period_end, gateway_subscription_id)
        VALUES ($1, $2, 'active', $3, $4, $5)
        RETURNING id`,
        [
          user.id,
          plan.id,
          startDate,
          endDate,
          `manual_${Date.now()}`, // ID fictício para identificar como manual
        ]
      );
      
      subscriptionId = insertResult.rows[0].id;
      console.log('✅ Nova assinatura criada');
    }

    console.log('  ID da Assinatura:', subscriptionId);
    console.log('');

    // Criar registro de pagamento
    await client.query(
      `INSERT INTO payments
      (subscription_id, amount, status, gateway_payment_id, paid_at)
      VALUES ($1, $2, 'paid', $3, CURRENT_TIMESTAMP)`,
      [
        subscriptionId,
        parseFloat(plan.price),
        `manual_payment_${Date.now()}`,
      ]
    );

    console.log('💳 Pagamento registrado');
    console.log('');

    await client.query('COMMIT');

    console.log('✅ SIMULAÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('📝 Próximos passos:');
    console.log('  1. Faça LOGOUT no navegador');
    console.log('  2. Faça LOGIN novamente');
    console.log('  3. O aviso de assinatura expirada deve desaparecer');
    console.log('  4. O acesso aos cursos deve estar liberado');
    console.log('');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

simulateWebhook();
