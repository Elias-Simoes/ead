/**
 * Script para verificar se o usuário tem registro na tabela students
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

async function checkStudentRecord() {
  const client = await pool.connect();
  
  try {
    const userId = '52e59a2e-83a2-4ce3-832b-d9a67e1af4b2';
    
    console.log('🔍 Verificando registro na tabela students...\n');

    // Verificar se existe na tabela students
    const studentResult = await client.query(`
      SELECT 
        id,
        subscription_status,
        subscription_expires_at,
        total_study_time,
        gdpr_consent,
        gdpr_consent_at
      FROM students
      WHERE id = $1
    `, [userId]);

    if (studentResult.rows.length === 0) {
      console.log('❌ Usuário NÃO tem registro na tabela students!');
      console.log('   Isso explica o problema.\n');
      
      console.log('💡 Solução: Criar registro na tabela students');
      console.log('   Quando um usuário é criado com role=student,');
      console.log('   deveria ser criado automaticamente um registro');
      console.log('   na tabela students.\n');
      
      return;
    }

    const student = studentResult.rows[0];
    console.log('✅ Registro encontrado na tabela students:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ID:                      ${student.id}`);
    console.log(`  Subscription Status:     ${student.subscription_status}`);
    console.log(`  Subscription Expires At: ${student.subscription_expires_at || 'N/A'}`);
    console.log(`  Total Study Time:        ${student.total_study_time}`);
    console.log(`  GDPR Consent:            ${student.gdpr_consent}`);
    console.log(`  GDPR Consent At:         ${student.gdpr_consent_at || 'N/A'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkStudentRecord();
