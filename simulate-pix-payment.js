/**
 * Script para simular confirmação de pagamento PIX em desenvolvimento
 * 
 * Este script:
 * 1. Lista pagamentos PIX pendentes
 * 2. Permite escolher um pagamento para confirmar
 * 3. Marca o pagamento como 'paid'
 * 4. Cria/ativa a assinatura do estudante
 * 5. Envia email de confirmação (em modo dev, apenas loga)
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

async function listPendingPixPayments() {
  const result = await pool.query(`
    SELECT 
      pp.id,
      pp.student_id,
      pp.plan_id,
      pp.amount,
      pp.discount,
      pp.final_amount,
      pp.status,
      pp.created_at,
      pp.expires_at,
      u.name as student_name,
      u.email as student_email,
      p.name as plan_name,
      p.duration_days
    FROM pix_payments pp
    INNER JOIN users u ON pp.student_id = u.id
    INNER JOIN plans p ON pp.plan_id = p.id
    WHERE pp.status = 'pending'
    ORDER BY pp.created_at DESC
  `);

  return result.rows;
}

async function confirmPixPayment(paymentId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Buscar dados do pagamento
    const paymentResult = await client.query(`
      SELECT 
        pp.*,
        u.name as student_name,
        u.email as student_email,
        p.name as plan_name,
        p.duration_days,
        p.price
      FROM pix_payments pp
      INNER JOIN users u ON pp.student_id = u.id
      INNER JOIN plans p ON pp.plan_id = p.id
      WHERE pp.id = $1
    `, [paymentId]);

    if (paymentResult.rows.length === 0) {
      throw new Error('Pagamento não encontrado');
    }

    const payment = paymentResult.rows[0];

    if (payment.status !== 'pending') {
      throw new Error(`Pagamento já está com status: ${payment.status}`);
    }

    console.log('\n📋 Dados do Pagamento:');
    console.log('  ID:', payment.id);
    console.log('  Estudante:', payment.student_name);
    console.log('  Email:', payment.student_email);
    console.log('  Plano:', payment.plan_name);
    console.log('  Valor Original:', `R$ ${parseFloat(payment.amount).toFixed(2)}`);
    console.log('  Desconto:', `R$ ${parseFloat(payment.discount).toFixed(2)}`);
    console.log('  Valor Final:', `R$ ${parseFloat(payment.final_amount).toFixed(2)}`);
    console.log('  Duração:', `${payment.duration_days} dias`);

    // 2. Marcar pagamento como pago
    await client.query(`
      UPDATE pix_payments
      SET 
        status = 'paid',
        paid_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [paymentId]);

    console.log('\n✅ Pagamento marcado como PAGO');

    // 3. Verificar se já existe assinatura ativa
    const existingSubResult = await client.query(`
      SELECT id, status, end_date
      FROM subscriptions
      WHERE student_id = $1 AND status = 'active'
    `, [payment.student_id]);

    let subscriptionId;
    let startDate = new Date();
    let endDate = new Date();

    if (existingSubResult.rows.length > 0) {
      // Já tem assinatura ativa - estender a data
      const existingSub = existingSubResult.rows[0];
      startDate = new Date(existingSub.end_date);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + payment.duration_days);

      await client.query(`
        UPDATE subscriptions
        SET 
          end_date = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [endDate, existingSub.id]);

      subscriptionId = existingSub.id;
      console.log('\n🔄 Assinatura existente ESTENDIDA');
      console.log('  Nova data de término:', endDate.toISOString().split('T')[0]);
    } else {
      // Criar nova assinatura
      endDate.setDate(endDate.getDate() + payment.duration_days);

      const newSubResult = await client.query(`
        INSERT INTO subscriptions (
          student_id,
          plan_id,
          status,
          start_date,
          end_date,
          payment_method,
          amount_paid,
          gateway_subscription_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        payment.student_id,
        payment.plan_id,
        'active',
        startDate,
        endDate,
        'pix',
        payment.final_amount,
        payment.gateway_charge_id
      ]);

      subscriptionId = newSubResult.rows[0].id;
      console.log('\n✨ Nova assinatura CRIADA');
      console.log('  ID da Assinatura:', subscriptionId);
      console.log('  Data de início:', startDate.toISOString().split('T')[0]);
      console.log('  Data de término:', endDate.toISOString().split('T')[0]);
    }

    // 4. Registrar pagamento na tabela payments
    await client.query(`
      INSERT INTO payments (
        subscription_id,
        amount,
        status,
        payment_method,
        gateway_payment_id,
        paid_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `, [
      subscriptionId,
      payment.final_amount,
      'completed',
      'pix',
      payment.gateway_charge_id
    ]);

    console.log('\n💰 Pagamento registrado na tabela payments');

    await client.query('COMMIT');

    console.log('\n✅ SIMULAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📧 Em produção, um email seria enviado para:', payment.student_email);
    console.log('\n🎉 O estudante agora pode acessar os cursos!');
    console.log('\n📝 Para testar:');
    console.log(`   1. Faça login com: ${payment.student_email}`);
    console.log('   2. Acesse a página de cursos');
    console.log('   3. Tente acessar o conteúdo de uma aula');
    console.log('   4. O acesso deve estar liberado!');

    return {
      paymentId: payment.id,
      subscriptionId,
      studentEmail: payment.student_email,
      planName: payment.plan_name,
      endDate
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🔍 Buscando pagamentos PIX pendentes...\n');

    const pendingPayments = await listPendingPixPayments();

    if (pendingPayments.length === 0) {
      console.log('❌ Nenhum pagamento PIX pendente encontrado.');
      console.log('\n💡 Para criar um pagamento de teste:');
      console.log('   1. Faça login com: expired.student@test.com / Test123!@#');
      console.log('   2. Acesse: http://localhost:5173/subscription/renew');
      console.log('   3. Escolha um plano e gere um QR Code PIX');
      console.log('   4. Execute este script novamente');
      process.exit(0);
    }

    console.log(`📋 Encontrados ${pendingPayments.length} pagamento(s) pendente(s):\n`);

    pendingPayments.forEach((payment, index) => {
      const createdAt = new Date(payment.created_at).toLocaleString('pt-BR');
      const expiresAt = new Date(payment.expires_at).toLocaleString('pt-BR');
      const isExpired = new Date(payment.expires_at) < new Date();

      console.log(`${index + 1}. ID: ${payment.id}`);
      console.log(`   Estudante: ${payment.student_name} (${payment.student_email})`);
      console.log(`   Plano: ${payment.plan_name}`);
      console.log(`   Valor: R$ ${parseFloat(payment.final_amount).toFixed(2)}`);
      console.log(`   Criado em: ${createdAt}`);
      console.log(`   Expira em: ${expiresAt} ${isExpired ? '⚠️ EXPIRADO' : '✅'}`);
      console.log('');
    });

    // Se houver argumentos na linha de comando, usar o primeiro como índice
    const args = process.argv.slice(2);
    let selectedIndex = 0;

    if (args.length > 0) {
      selectedIndex = parseInt(args[0]) - 1;
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= pendingPayments.length) {
        console.error('❌ Índice inválido. Use um número entre 1 e', pendingPayments.length);
        process.exit(1);
      }
    } else {
      // Usar o mais recente (primeiro da lista)
      selectedIndex = 0;
    }

    const selectedPayment = pendingPayments[selectedIndex];
    
    console.log(`\n🎯 Confirmando pagamento #${selectedIndex + 1}...\n`);
    
    await confirmPixPayment(selectedPayment.id);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
main();
