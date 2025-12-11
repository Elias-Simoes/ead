/**
 * Script para verificar status dos pagamentos PIX
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

async function checkPixPayments() {
  try {
    console.log('🔍 Verificando pagamentos PIX...\n');

    // Buscar todos os pagamentos PIX
    const result = await pool.query(`
      SELECT 
        pp.id,
        pp.status,
        pp.amount,
        pp.discount,
        pp.final_amount,
        pp.created_at,
        pp.paid_at,
        pp.expires_at,
        pp.gateway_charge_id,
        u.name as student_name,
        u.email as student_email,
        p.name as plan_name
      FROM pix_payments pp
      INNER JOIN users u ON pp.student_id = u.id
      INNER JOIN plans p ON pp.plan_id = p.id
      ORDER BY pp.created_at DESC
      LIMIT 20
    `);

    if (result.rows.length === 0) {
      console.log('❌ Nenhum pagamento PIX encontrado no banco de dados.');
      return;
    }

    console.log(`📋 Total de pagamentos: ${result.rows.length}\n`);

    // Agrupar por status
    const byStatus = {
      pending: [],
      paid: [],
      expired: [],
      cancelled: []
    };

    result.rows.forEach(payment => {
      if (byStatus[payment.status]) {
        byStatus[payment.status].push(payment);
      }
    });

    // Mostrar estatísticas
    console.log('📊 Estatísticas:');
    console.log(`  ⏳ Pendentes: ${byStatus.pending.length}`);
    console.log(`  ✅ Pagos: ${byStatus.paid.length}`);
    console.log(`  ⚠️  Expirados: ${byStatus.expired.length}`);
    console.log(`  ❌ Cancelados: ${byStatus.cancelled.length}`);
    console.log('');

    // Mostrar detalhes de cada status
    if (byStatus.pending.length > 0) {
      console.log('⏳ PAGAMENTOS PENDENTES:\n');
      byStatus.pending.forEach((payment, index) => {
        const createdAt = new Date(payment.created_at).toLocaleString('pt-BR');
        const expiresAt = new Date(payment.expires_at).toLocaleString('pt-BR');
        const isExpired = new Date(payment.expires_at) < new Date();
        const isMock = payment.gateway_charge_id.startsWith('pi_mock_');

        console.log(`${index + 1}. ${payment.id}`);
        console.log(`   Estudante: ${payment.student_name} (${payment.student_email})`);
        console.log(`   Plano: ${payment.plan_name}`);
        console.log(`   Valor: R$ ${parseFloat(payment.final_amount).toFixed(2)}`);
        console.log(`   Criado: ${createdAt}`);
        console.log(`   Expira: ${expiresAt} ${isExpired ? '⚠️ EXPIRADO' : '✅'}`);
        console.log(`   Tipo: ${isMock ? '🧪 Mock (Dev)' : '💳 Real (Stripe)'}`);
        console.log('');
      });
    }

    if (byStatus.paid.length > 0) {
      console.log('✅ PAGAMENTOS CONFIRMADOS:\n');
      byStatus.paid.forEach((payment, index) => {
        const paidAt = new Date(payment.paid_at).toLocaleString('pt-BR');
        const isMock = payment.gateway_charge_id.startsWith('pi_mock_');

        console.log(`${index + 1}. ${payment.id}`);
        console.log(`   Estudante: ${payment.student_name} (${payment.student_email})`);
        console.log(`   Plano: ${payment.plan_name}`);
        console.log(`   Valor: R$ ${parseFloat(payment.final_amount).toFixed(2)}`);
        console.log(`   Pago em: ${paidAt}`);
        console.log(`   Tipo: ${isMock ? '🧪 Mock (Dev)' : '💳 Real (Stripe)'}`);
        console.log('');
      });
    }

    if (byStatus.expired.length > 0) {
      console.log('⚠️  PAGAMENTOS EXPIRADOS:\n');
      byStatus.expired.forEach((payment, index) => {
        const expiresAt = new Date(payment.expires_at).toLocaleString('pt-BR');

        console.log(`${index + 1}. ${payment.id}`);
        console.log(`   Estudante: ${payment.student_name} (${payment.student_email})`);
        console.log(`   Plano: ${payment.plan_name}`);
        console.log(`   Valor: R$ ${parseFloat(payment.final_amount).toFixed(2)}`);
        console.log(`   Expirou em: ${expiresAt}`);
        console.log('');
      });
    }

    // Verificar assinaturas relacionadas
    console.log('\n📝 Verificando assinaturas relacionadas...\n');

    const subsResult = await pool.query(`
      SELECT 
        s.id,
        s.status,
        s.start_date,
        s.end_date,
        s.payment_method,
        s.amount_paid,
        u.email as student_email,
        p.name as plan_name
      FROM subscriptions s
      INNER JOIN users u ON s.student_id = u.id
      INNER JOIN plans p ON s.plan_id = p.id
      WHERE u.email = 'expired.student@test.com'
      ORDER BY s.created_at DESC
    `);

    if (subsResult.rows.length > 0) {
      console.log('🎫 Assinaturas do usuário de teste:\n');
      subsResult.rows.forEach((sub, index) => {
        const startDate = new Date(sub.start_date).toLocaleDateString('pt-BR');
        const endDate = new Date(sub.end_date).toLocaleDateString('pt-BR');
        const isActive = sub.status === 'active' && new Date(sub.end_date) > new Date();

        console.log(`${index + 1}. ${sub.id}`);
        console.log(`   Status: ${sub.status} ${isActive ? '✅' : '❌'}`);
        console.log(`   Plano: ${sub.plan_name}`);
        console.log(`   Período: ${startDate} até ${endDate}`);
        console.log(`   Método: ${sub.payment_method}`);
        console.log(`   Valor: R$ ${parseFloat(sub.amount_paid).toFixed(2)}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhuma assinatura encontrada para expired.student@test.com');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkPixPayments();
