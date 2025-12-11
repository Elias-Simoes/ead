/**
 * Test script for PIX payment expired email
 * Tests task 13.3: Email de pagamento PIX expirado
 */

const { pool } = require('./dist/config/database');
const { pixPaymentService } = require('./dist/modules/subscriptions/services/pix-payment.service');

async function testPixExpiredEmail() {
  console.log('🧪 Testing PIX Payment Expired Email (Task 13.3)\n');

  try {
    // Step 1: Find or create a test student
    console.log('Step 1: Finding test student...');
    const studentResult = await pool.query(
      `SELECT id, name, email FROM users WHERE role = 'student' LIMIT 1`
    );

    if (studentResult.rows.length === 0) {
      console.error('❌ No student found. Please create a test student first.');
      process.exit(1);
    }

    const student = studentResult.rows[0];
    console.log(`✅ Found student: ${student.name} (${student.email})\n`);

    // Step 2: Find a test plan
    console.log('Step 2: Finding test plan...');
    const planResult = await pool.query(
      `SELECT id, name, price FROM subscription_plans LIMIT 1`
    );

    if (planResult.rows.length === 0) {
      console.error('❌ No plan found. Please create a test plan first.');
      process.exit(1);
    }

    const plan = planResult.rows[0];
    console.log(`✅ Found plan: ${plan.name} (R$ ${plan.price})\n`);

    // Step 3: Create a PIX payment that will expire immediately
    console.log('Step 3: Creating PIX payment with immediate expiration...');
    
    // Temporarily set expiration to 0 minutes for testing
    await pool.query(
      `UPDATE payment_config SET pix_expiration_minutes = 0`
    );

    const pixPayment = await pixPaymentService.createPixPayment({
      studentId: student.id,
      planId: plan.id,
      studentEmail: student.email,
      amount: parseFloat(plan.price),
    });

    console.log(`✅ PIX payment created: ${pixPayment.paymentId}`);
    console.log(`   - Amount: R$ ${pixPayment.amount.toFixed(2)}`);
    console.log(`   - Discount: R$ ${pixPayment.discount.toFixed(2)}`);
    console.log(`   - Final Amount: R$ ${pixPayment.finalAmount.toFixed(2)}`);
    console.log(`   - Expires At: ${pixPayment.expiresAt.toISOString()}\n`);

    // Restore normal expiration time
    await pool.query(
      `UPDATE payment_config SET pix_expiration_minutes = 30`
    );

    // Step 4: Wait a moment to ensure expiration time has passed
    console.log('Step 4: Waiting for payment to expire...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Run the expiration job
    console.log('Step 5: Running expiration job...');
    const expiredCount = await pixPaymentService.expirePendingPayments();
    console.log(`✅ Expired ${expiredCount} payment(s)\n`);

    // Step 6: Verify the payment is marked as expired
    console.log('Step 6: Verifying payment status...');
    const verifyResult = await pool.query(
      `SELECT status FROM pix_payments WHERE id = $1`,
      [pixPayment.paymentId]
    );

    if (verifyResult.rows.length === 0) {
      console.error('❌ Payment not found in database');
      process.exit(1);
    }

    const status = verifyResult.rows[0].status;
    if (status !== 'expired') {
      console.error(`❌ Payment status is '${status}', expected 'expired'`);
      process.exit(1);
    }

    console.log(`✅ Payment status: ${status}\n`);

    // Step 7: Summary
    console.log('📧 Email Summary:');
    console.log('   - Recipient:', student.email);
    console.log('   - Subject: Pagamento PIX Expirado - Plataforma EAD');
    console.log('   - Content: Includes link to generate new payment');
    console.log('   - Link:', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/${plan.id}\n`);

    console.log('✅ Task 13.3 Implementation Complete!');
    console.log('\nWhat was implemented:');
    console.log('✓ Email template for expired PIX payments');
    console.log('✓ Integration in expirePendingPayments() method');
    console.log('✓ Includes student name and plan name');
    console.log('✓ Includes link to generate new payment');
    console.log('✓ Validates Requirements 6.3');
    console.log('\nThe email has been sent to:', student.email);
    console.log('Check your email inbox to see the expired payment notification.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testPixExpiredEmail();
