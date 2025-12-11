require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Configurando dados de teste para E2E...\n');

    // 1. Criar usuário estudante de teste
    console.log('1. Criando estudante de teste...');
    const hashedPassword = await bcrypt.hash('Test123!@#', 10);
    
    const studentResult = await client.query(`
      INSERT INTO users (email, password_hash, name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $2, name = $3, is_active = true
      RETURNING id, email, name, role
    `, ['student.e2e@test.com', hashedPassword, 'E2E Test Student', 'student']);
    
    const student = studentResult.rows[0];
    console.log('✅ Estudante criado:', student);

    // 2. Verificar se existem planos
    console.log('\n2. Verificando planos disponíveis...');
    const plansResult = await client.query(`
      SELECT id, name, price, interval 
      FROM plans 
      WHERE is_active = true 
      ORDER BY price ASC
      LIMIT 3
    `);
    
    if (plansResult.rows.length === 0) {
      console.log('⚠️  Nenhum plano encontrado. Criando planos de teste...');
      
      await client.query(`
        INSERT INTO plans (name, price, currency, interval, is_active, created_at, updated_at)
        VALUES 
          ('Plano Mensal', 49.90, 'BRL', 'monthly', true, NOW(), NOW()),
          ('Plano Trimestral', 129.90, 'BRL', 'quarterly', true, NOW(), NOW()),
          ('Plano Anual', 399.90, 'BRL', 'yearly', true, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);
      
      const newPlans = await client.query(`
        SELECT id, name, price, interval 
        FROM plans 
        WHERE is_active = true 
        ORDER BY price ASC
      `);
      
      console.log('✅ Planos criados:', newPlans.rows);
    } else {
      console.log('✅ Planos encontrados:', plansResult.rows);
    }

    // 3. Verificar configuração de pagamento
    console.log('\n3. Verificando configuração de pagamento...');
    const configResult = await client.query(`
      SELECT * FROM payment_config LIMIT 1
    `);
    
    if (configResult.rows.length === 0) {
      console.log('⚠️  Configuração não encontrada. Criando configuração padrão...');
      
      await client.query(`
        INSERT INTO payment_config (
          max_installments,
          pix_discount_percent,
          installments_without_interest,
          pix_expiration_minutes,
          created_at,
          updated_at
        ) VALUES (
          12,
          5.0,
          3,
          30,
          NOW(),
          NOW()
        )
      `);
      
      console.log('✅ Configuração de pagamento criada');
    } else {
      // Atualizar configuração existente
      await client.query(`
        UPDATE payment_config SET
          max_installments = 12,
          pix_discount_percent = 5.0,
          installments_without_interest = 3,
          pix_expiration_minutes = 30,
          updated_at = NOW()
        WHERE id = $1
      `, [configResult.rows[0].id]);
      
      console.log('✅ Configuração atualizada');
    }

    // 4. Limpar pagamentos e assinaturas antigas do usuário de teste
    console.log('\n4. Limpando dados antigos do usuário de teste...');
    
    // Primeiro deletar pagamentos relacionados às assinaturas do estudante
    await client.query(`
      DELETE FROM payments 
      WHERE subscription_id IN (
        SELECT id FROM subscriptions WHERE student_id = $1
      )
    `, [student.id]);
    
    // Depois deletar as assinaturas
    await client.query(`
      DELETE FROM subscriptions WHERE student_id = $1
    `, [student.id]);
    
    console.log('✅ Dados antigos removidos');

    console.log('\n✅ Dados de teste configurados com sucesso!\n');
    console.log('📋 Credenciais para teste:');
    console.log('   Email: student.e2e@test.com');
    console.log('   Senha: Test123!@#');
    console.log('\n🎯 Pronto para executar os testes E2E!');

  } catch (error) {
    console.error('❌ Erro ao configurar dados de teste:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupTestData().catch(console.error);
