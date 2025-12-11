/**
 * Script para corrigir o usuário antigo que foi criado sem registro na tabela students
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

async function fixOldTestStudent() {
  const client = await pool.connect();
  
  try {
    const userId = '282a0a3f-9729-4dea-aa25-84ecc1a5bee9';
    
    console.log('🔧 Corrigindo usuário antigo...\n');

    // Verificar se já existe
    const checkResult = await client.query(`
      SELECT id FROM students WHERE id = $1
    `, [userId]);

    if (checkResult.rows.length > 0) {
      console.log('ℹ️  Usuário já tem registro na tabela students.');
      return;
    }

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
    `, [userId, 'inactive', null, 0, true, new Date()]);

    console.log('✅ Registro criado com sucesso na tabela students!');
    console.log('   Status: inactive (sem assinatura)\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixOldTestStudent();
