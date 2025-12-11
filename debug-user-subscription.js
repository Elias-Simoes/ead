/**
 * Script para debugar o status da assinatura do usuário
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

async function debugUserSubscription() {
  const client = await pool.connect();
  
  try {
    const userId = '282a0a3f-9729-4dea-aa25-84ecc1a5bee9';
    
    console.log('🔍 Investigando usuário e assinatura...\n');

    // Buscar dados do usuário
    const userResult = await client.query(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE id = $1
    `, [userId]);

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
    console.log(`  Role:  ${user.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Buscar assinaturas
    const subsResult = await client.query(`
      SELECT 
        id,
        student_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancelled_at,
        created_at,
        updated_at
      FROM subscriptions
      WHERE student_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    console.log(`📋 Assinaturas encontradas: ${subsResult.rows.length}\n`);

    if (subsResult.rows.length === 0) {
      console.log('ℹ️  Nenhuma assinatura encontrada para este usuário.');
      console.log('✅ Isso explica por que não há bloqueio - usuário sem assinatura!\n');
      return;
    }

    subsResult.rows.forEach((sub, index) => {
      console.log(`Assinatura ${index + 1}:`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  ID:              ${sub.id}`);
      console.log(`  Plan ID:         ${sub.plan_id}`);
      console.log(`  Status:          ${sub.status}`);
      console.log(`  Período início:  ${sub.current_period_start}`);
      console.log(`  Período fim:     ${sub.current_period_end}`);
      console.log(`  Cancelada em:    ${sub.cancelled_at || 'N/A'}`);
      console.log(`  Criada em:       ${sub.created_at}`);
      console.log(`  Atualizada:      ${sub.updated_at}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    // Verificar se há assinatura ativa
    const activeSubResult = await client.query(`
      SELECT COUNT(*) as count
      FROM subscriptions
      WHERE student_id = $1
        AND status = 'active'
        AND current_period_end > NOW()
    `, [userId]);

    const hasActiveSub = parseInt(activeSubResult.rows[0].count) > 0;

    console.log('🎯 Análise:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Tem assinatura ativa? ${hasActiveSub ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!hasActiveSub && subsResult.rows.length > 0) {
      console.log(`  Status da última: ${subsResult.rows[0].status}`);
      console.log('  ⚠️  PROBLEMA: Assinatura cancelada mas usuário tem acesso!');
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

debugUserSubscription();
