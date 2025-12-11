/**
 * Script para sincronizar o status da assinatura na tabela students
 * baseado na assinatura ativa na tabela subscriptions
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

async function syncStudentSubscriptionStatus() {
  const client = await pool.connect();
  
  try {
    const email = 'test.student.1765284983885@test.com';
    
    console.log('🔄 Sincronizando status da assinatura...\n');

    // Buscar usuário
    const userResult = await client.query(`
      SELECT id, name, email
      FROM users
      WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const user = userResult.rows[0];
    console.log('👤 Usuário:', user.name);
    console.log('📧 Email:', user.email);
    console.log('');

    // Buscar assinatura ativa
    const subsResult = await client.query(`
      SELECT 
        id,
        status,
        current_period_start,
        current_period_end
      FROM subscriptions
      WHERE student_id = $1
        AND status = 'active'
        AND current_period_end > NOW()
      ORDER BY current_period_end DESC
      LIMIT 1
    `, [user.id]);

    if (subsResult.rows.length === 0) {
      console.log('❌ Nenhuma assinatura ativa encontrada!');
      console.log('   Execute primeiro: node simulate-card-payment-webhook.js');
      return;
    }

    const subscription = subsResult.rows[0];
    console.log('📋 Assinatura ativa encontrada:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ID:              ${subscription.id}`);
    console.log(`  Status:          ${subscription.status}`);
    console.log(`  Período início:  ${new Date(subscription.current_period_start).toLocaleDateString('pt-BR')}`);
    console.log(`  Período fim:     ${new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Atualizar tabela students
    await client.query(`
      UPDATE students
      SET 
        subscription_status = $1,
        subscription_expires_at = $2
      WHERE id = $3
    `, [subscription.status, subscription.current_period_end, user.id]);

    console.log('✅ Tabela students atualizada com sucesso!\n');

    // Verificar resultado
    const verifyResult = await client.query(`
      SELECT 
        subscription_status,
        subscription_expires_at
      FROM students
      WHERE id = $1
    `, [user.id]);

    const student = verifyResult.rows[0];
    console.log('📊 Status atualizado na tabela students:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Subscription Status:     ${student.subscription_status}`);
    console.log(`  Subscription Expires At: ${new Date(student.subscription_expires_at).toLocaleDateString('pt-BR')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ SINCRONIZAÇÃO CONCLUÍDA!\n');
    console.log('📝 Próximos passos:');
    console.log('  1. Faça LOGOUT no navegador (ou limpe o cache)');
    console.log('  2. Faça LOGIN novamente');
    console.log('  3. O aviso de renovação deve desaparecer');
    console.log('  4. O acesso aos cursos deve estar liberado\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

syncStudentSubscriptionStatus();
