/**
 * Script para verificar o status atual da assinatura do usuário logado
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

async function checkCurrentUserSubscription() {
  const client = await pool.connect();
  
  try {
    // Buscar o usuário Test Student 1765284981885 (o que você está usando)
    const email = 'test.student.1765284983885@test.com';
    
    console.log('🔍 Verificando status da assinatura...\n');
    console.log(`Email: ${email}\n`);

    // Buscar usuário
    const userResult = await client.query(`
      SELECT id, name, email, role
      FROM users
      WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const user = userResult.rows[0];
    console.log('👤 Usuário:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ID:    ${user.id}`);
    console.log(`  Nome:  ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Buscar dados da tabela students
    const studentResult = await client.query(`
      SELECT 
        subscription_status,
        subscription_expires_at,
        total_study_time
      FROM students
      WHERE id = $1
    `, [user.id]);

    if (studentResult.rows.length === 0) {
      console.log('❌ Registro não encontrado na tabela students!');
      return;
    }

    const student = studentResult.rows[0];
    console.log('📊 Status na tabela students:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Subscription Status:     ${student.subscription_status}`);
    console.log(`  Subscription Expires At: ${student.subscription_expires_at || 'N/A'}`);
    console.log(`  Total Study Time:        ${student.total_study_time}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Buscar assinaturas
    const subsResult = await client.query(`
      SELECT 
        id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancelled_at,
        gateway_subscription_id,
        created_at,
        updated_at
      FROM subscriptions
      WHERE student_id = $1
      ORDER BY created_at DESC
    `, [user.id]);

    console.log(`📋 Assinaturas na tabela subscriptions: ${subsResult.rows.length}\n`);

    if (subsResult.rows.length === 0) {
      console.log('ℹ️  Nenhuma assinatura encontrada.');
      console.log('   Isso explica por que o aviso aparece!\n');
      return;
    }

    subsResult.rows.forEach((sub, index) => {
      console.log(`Assinatura ${index + 1}:`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  ID:                  ${sub.id}`);
      console.log(`  Plan ID:             ${sub.plan_id}`);
      console.log(`  Status:              ${sub.status}`);
      console.log(`  Período início:      ${sub.current_period_start}`);
      console.log(`  Período fim:         ${sub.current_period_end}`);
      console.log(`  Cancelada em:        ${sub.cancelled_at || 'N/A'}`);
      console.log(`  Gateway Sub ID:      ${sub.gateway_subscription_id || 'N/A'}`);
      console.log(`  Criada em:           ${sub.created_at}`);
      console.log(`  Atualizada:          ${sub.updated_at}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    // Buscar pagamentos
    const paymentsResult = await client.query(`
      SELECT 
        p.id,
        p.subscription_id,
        p.amount,
        p.status,
        p.gateway_payment_id,
        p.paid_at,
        p.created_at
      FROM payments p
      WHERE p.subscription_id IN (
        SELECT id FROM subscriptions WHERE student_id = $1
      )
      ORDER BY p.created_at DESC
      LIMIT 5
    `, [user.id]);

    console.log(`💳 Últimos pagamentos: ${paymentsResult.rows.length}\n`);

    if (paymentsResult.rows.length > 0) {
      paymentsResult.rows.forEach((payment, index) => {
        console.log(`Pagamento ${index + 1}:`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  ID:                ${payment.id}`);
        console.log(`  Subscription ID:   ${payment.subscription_id}`);
        console.log(`  Valor:             R$ ${payment.amount}`);
        console.log(`  Status:            ${payment.status}`);
        console.log(`  Gateway Payment:   ${payment.gateway_payment_id || 'N/A'}`);
        console.log(`  Pago em:           ${payment.paid_at || 'Pendente'}`);
        console.log(`  Criado em:         ${payment.created_at}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      });
    }

    // Análise
    console.log('🎯 Análise:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const hasActiveSubscription = subsResult.rows.some(
      sub => sub.status === 'active' && new Date(sub.current_period_end) > new Date()
    );

    if (hasActiveSubscription) {
      console.log('  ✅ Tem assinatura ativa na tabela subscriptions');
    } else {
      console.log('  ❌ NÃO tem assinatura ativa na tabela subscriptions');
    }

    if (student.subscription_status === 'active') {
      console.log('  ✅ Status "active" na tabela students');
    } else {
      console.log(`  ❌ Status "${student.subscription_status}" na tabela students`);
      console.log('     (deveria ser "active" para remover o aviso)');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkCurrentUserSubscription();
