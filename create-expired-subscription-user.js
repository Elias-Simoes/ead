require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createExpiredSubscriptionUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Criando usuário com assinatura expirada...\n');
    
    await client.query('BEGIN');
    
    // 1. Criar usuário
    const email = 'expired.student@test.com';
    const password = 'Test123!@#';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Verificar se usuário já existe
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    let userId;
    
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log('✅ Usuário já existe:', email);
      
      // Deletar assinaturas antigas
      await client.query('DELETE FROM subscriptions WHERE student_id = $1', [userId]);
      console.log('🗑️  Assinaturas antigas removidas');
    } else {
      // Criar novo usuário
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name, role, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [email, hashedPassword, 'Expired Student', 'student', true]
      );
      
      userId = userResult.rows[0].id;
      console.log('✅ Usuário criado:', email);
      
      // Criar registro na tabela students
      await client.query(
        `INSERT INTO students (id, subscription_status, gdpr_consent)
         VALUES ($1, $2, $3)`,
        [userId, 'inactive', true]
      );
      console.log('✅ Registro de estudante criado');
    }
    
    // 2. Buscar um plano ativo
    const planResult = await client.query(
      'SELECT id, name, price FROM plans WHERE is_active = true LIMIT 1'
    );
    
    if (planResult.rows.length === 0) {
      throw new Error('Nenhum plano ativo encontrado');
    }
    
    const plan = planResult.rows[0];
    console.log('📋 Plano selecionado:', plan.name);
    
    // 3. Criar assinatura CANCELADA/EXPIRADA (30 dias atrás)
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 30);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    
    await client.query(
      `INSERT INTO subscriptions 
       (student_id, plan_id, status, current_period_start, current_period_end, cancelled_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, plan.id, 'cancelled', startDate, expiredDate, expiredDate, startDate, new Date()]
    );
    
    console.log('✅ Assinatura cancelada/expirada criada');
    console.log(`   Início: ${startDate.toISOString().split('T')[0]}`);
    console.log(`   Fim: ${expiredDate.toISOString().split('T')[0]}`);
    console.log(`   Cancelada em: ${expiredDate.toISOString().split('T')[0]}`);
    
    // 4. Atualizar status do estudante
    await client.query(
      `UPDATE students 
       SET subscription_status = $1, subscription_expires_at = $2
       WHERE id = $3`,
      ['cancelled', expiredDate, userId]
    );
    
    console.log('✅ Status do estudante atualizado para "cancelled"');
    
    await client.query('COMMIT');
    
    console.log('\n✅ Usuário com assinatura expirada criado com sucesso!\n');
    
    console.log('📝 CREDENCIAIS PARA TESTE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${email}`);
    console.log(`Senha:    ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🔒 COMPORTAMENTO ESPERADO:');
    console.log('   ✅ Usuário pode fazer login');
    console.log('   ❌ Usuário NÃO pode acessar conteúdo dos cursos');
    console.log('   ⚠️  Usuário vê aviso de assinatura expirada');
    console.log('   🔄 Usuário pode renovar a assinatura\n');
    
    console.log('🌐 URLs PARA TESTE:');
    console.log('   Login:     http://localhost:5174/login');
    console.log('   Perfil:    http://localhost:5174/profile');
    console.log('   Renovar:   http://localhost:5174/subscription/renew');
    console.log('   Cursos:    http://localhost:5174/courses');
    console.log('');
    
    console.log('🧪 COMO TESTAR:');
    console.log('   1. Faça login com as credenciais acima');
    console.log('   2. Tente acessar um curso - deve ser bloqueado');
    console.log('   3. Veja o aviso de assinatura expirada');
    console.log('   4. Clique em "Renovar Assinatura"');
    console.log('   5. Escolha um plano e complete o checkout');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

createExpiredSubscriptionUser();
