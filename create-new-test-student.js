/**
 * Script para criar um novo estudante de teste SEM assinatura
 * Perfeito para testar o fluxo completo de pagamento PIX
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'plataforma_ead',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function createNewTestStudent() {
  const client = await pool.connect();
  
  try {
    // Gerar email único com timestamp
    const timestamp = Date.now();
    const email = `test.student.${timestamp}@test.com`;
    const name = `Test Student ${timestamp}`;
    const password = 'Test123!@#';

    console.log('🔐 Criando novo estudante de teste...\n');

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Iniciar transação
    await client.query('BEGIN');

    // Criar usuário
    const result = await client.query(`
      INSERT INTO users (
        name,
        email,
        password_hash,
        role
      ) VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role
    `, [name, email, hashedPassword, 'student']);

    const user = result.rows[0];

    // Criar registro na tabela students
    await client.query(`
      INSERT INTO students (
        id,
        subscription_status,
        subscription_expires_at,
        total_study_time,
        gdpr_consent,
        gdpr_consent_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [user.id, 'inactive', null, 0, true, new Date()]);

    // Commit da transação
    await client.query('COMMIT');

    console.log('✅ Estudante criado com sucesso!\n');
    console.log('📋 Credenciais:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Email:    ${email}`);
    console.log(`  Senha:    ${password}`);
    console.log(`  Nome:     ${name}`);
    console.log(`  ID:       ${user.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 Como usar:');
    console.log('  1. Acesse: http://localhost:5173/login');
    console.log(`  2. Faça login com: ${email}`);
    console.log(`  3. Senha: ${password}`);
    console.log('  4. Acesse: http://localhost:5173/plans');
    console.log('  5. Escolha um plano e gere o QR Code PIX');
    console.log('  6. Execute: node simulate-pix-payment.js\n');

    console.log('💡 Dica: Copie as credenciais acima para usar no teste!\n');

    return user;

  } catch (error) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');
    console.error('❌ Erro ao criar estudante:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
createNewTestStudent();
