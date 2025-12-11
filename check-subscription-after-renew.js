/**
 * Script para verificar status da assinatura após renovação
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

async function checkSubscription() {
  try {
    const email = 'expired.student@test.com';
    
    console.log('🔍 Verificando assinatura de:', email);
    console.log('');

    // Buscar usuário
    const userResult = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    const user = userResult.rows[0];
    console.log('👤 Usuário:');
    console.log('  ID:', user.id);
    console.log('  Nome:', user.name);
    console.log('  Email:', user.email);
    console.log('');

    // Buscar assinaturas
    const subsResult = await pool.query(`
      SELECT 
        s.id,
        s.status,
        s.current_period_start as start_date,
        s.current_period_end as end_date,
        s.created_at,
        s.updated_at,
        s.cancelled_at,
        p.name as plan_name
      FROM subscriptions s
      INNER JOIN plans p ON s.plan_id = p.id
      WHERE s.student_id = $1
      ORDER BY s.created_at DESC
    `, [user.id]);

    if (subsResult.rows.length === 0) {
      console.log('❌ Nenhuma assinatura encontrada');
      return;
    }

    console.log(`📋 Assinaturas encontradas: ${subsResult.rows.length}\n`);

    subsResult.rows.forEach((sub, index) => {
      const startDate = new Date(sub.start_date);
      const endDate = new Date(sub.end_date);
      const now = new Date();
      const isActive = sub.status === 'active' && endDate > now;

      console.log(`${index + 1}. Assinatura ${sub.id}`);
      console.log(`   Status: ${sub.status} ${isActive ? '✅ ATIVA' : '❌ INATIVA'}`);
      console.log(`   Plano: ${sub.plan_name}`);
      console.log(`   Início: ${startDate.toLocaleDateString('pt-BR')}`);
      console.log(`   Término: ${endDate.toLocaleDateString('pt-BR')}`);
      console.log(`   Criada em: ${new Date(sub.created_at).toLocaleString('pt-BR')}`);
      
      if (sub.updated_at) {
        console.log(`   Atualizada em: ${new Date(sub.updated_at).toLocaleString('pt-BR')}`);
      }
      
      if (sub.cancelled_at) {
        console.log(`   Cancelada em: ${new Date(sub.cancelled_at).toLocaleString('pt-BR')}`);
      }

      // Verificar se está expirada
      if (endDate < now) {
        const daysExpired = Math.floor((now - endDate) / (1000 * 60 * 60 * 24));
        console.log(`   ⚠️  Expirou há ${daysExpired} dias`);
      } else {
        const daysRemaining = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
        console.log(`   ✅ Válida por mais ${daysRemaining} dias`);
      }
      
      console.log('');
    });

    // Verificar qual assinatura está ativa
    const activeSub = subsResult.rows.find(s => {
      const endDate = new Date(s.end_date);
      const now = new Date();
      return s.status === 'active' && endDate > now;
    });

    console.log('📊 Resumo:');
    if (activeSub) {
      console.log('  ✅ Usuário TEM assinatura ativa');
      console.log(`  📅 Válida até: ${new Date(activeSub.end_date).toLocaleDateString('pt-BR')}`);
      console.log('  🎓 Acesso aos cursos: LIBERADO');
      console.log('');
      console.log('⚠️  Se o aviso ainda aparece no frontend:');
      console.log('  1. Faça LOGOUT');
      console.log('  2. Faça LOGIN novamente');
      console.log('  3. O token JWT será atualizado com os novos dados');
    } else {
      console.log('  ❌ Usuário NÃO tem assinatura ativa');
      console.log('  🔒 Acesso aos cursos: BLOQUEADO');
      console.log('');
      console.log('💡 Possíveis causas:');
      console.log('  - Pagamento ainda não foi processado');
      console.log('  - Webhook não foi recebido');
      console.log('  - Assinatura expirou');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkSubscription();
