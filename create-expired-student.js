const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'plataforma_ead',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
});

async function createExpiredStudent() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Criando estudante com assinatura vencida...\n');

    await client.query('BEGIN');

    // 1. Verificar se já existe
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['expired@example.com']
    );

    let userId;

    if (existingUser.rows.length > 0) {
      console.log('ℹ️  Usuário já existe, atualizando...');
      userId = existingUser.rows[0].id;
    } else {
      // 2. Criar usuário
      console.log('1️⃣ Criando usuário...');
      const hashedPassword = await bcrypt.hash('Expired123!', 10);
      
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name, role, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['expired@example.com', hashedPassword, 'Estudante Vencido', 'student', true]
      );
      
      userId = userResult.rows[0].id;
      console.log(`✅ Usuário criado: ${userId}`);

      // 3. Criar registro de estudante
      console.log('\n2️⃣ Criando registro de estudante...');
      await client.query(
        `INSERT INTO students (id, subscription_status, subscription_expires_at, total_study_time, gdpr_consent)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'inactive', new Date('2024-01-01'), 0, true]
      );
      console.log('✅ Registro de estudante criado');
    }

    // 4. Atualizar assinatura para vencida
    console.log('\n3️⃣ Configurando assinatura como vencida...');
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 30); // 30 dias atrás

    await client.query(
      `UPDATE students 
       SET subscription_status = $1, 
           subscription_expires_at = $2
       WHERE id = $3`,
      ['inactive', expiredDate, userId]
    );
    console.log(`✅ Assinatura configurada como vencida (${expiredDate.toISOString()})`);

    await client.query('COMMIT');

    console.log('\n✅ Estudante com assinatura vencida criado com sucesso!');
    console.log('\n📋 Credenciais:');
    console.log('   Email: expired@example.com');
    console.log('   Senha: Expired123!');
    console.log('   Status: inactive');
    console.log(`   Expirou em: ${expiredDate.toLocaleDateString('pt-BR')}`);
    console.log('   Dias desde expiração: 30');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createExpiredStudent().catch(console.error);
