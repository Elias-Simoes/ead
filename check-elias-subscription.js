require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function checkEliasSubscription() {
  const client = await pool.connect()
  
  try {
    console.log('\n🔍 Verificando status do usuário Elias Simoes...\n')
    
    // Buscar o usuário Elias
    const userResult = await client.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      ['eliassimoesdev@gmail.com']
    )
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário Elias não encontrado')
      return
    }
    
    const user = userResult.rows[0]
    console.log('👤 Usuário Elias:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`  ID:    ${user.id}`)
    console.log(`  Nome:  ${user.name}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Role:  ${user.role}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    // Verificar na tabela students
    const studentResult = await client.query(
      'SELECT subscription_status, subscription_expires_at, total_study_time FROM students WHERE id = $1',
      [user.id]
    )
    
    if (studentResult.rows.length > 0) {
      const student = studentResult.rows[0]
      console.log('📊 Status na tabela students:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`  Subscription Status:     ${student.subscription_status}`)
      console.log(`  Subscription Expires At: ${student.subscription_expires_at || 'N/A'}`)
      console.log(`  Total Study Time:        ${student.total_study_time}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } else {
      console.log('❌ Registro não encontrado na tabela students\n')
    }
    
    // Verificar assinaturas
    const subscriptionsResult = await client.query(
      'SELECT * FROM subscriptions WHERE student_id = $1 ORDER BY created_at DESC',
      [user.id]
    )
    
    console.log(`📋 Assinaturas na tabela subscriptions: ${subscriptionsResult.rows.length}\n`)
    
    if (subscriptionsResult.rows.length === 0) {
      console.log('❌ Nenhuma assinatura encontrada - USUÁRIO PRECISA FAZER PRIMEIRO PAGAMENTO')
    } else {
      subscriptionsResult.rows.forEach((sub, index) => {
        console.log(`Assinatura ${index + 1}:`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`  ID:                  ${sub.id}`)
        console.log(`  Plan ID:             ${sub.plan_id}`)
        console.log(`  Status:              ${sub.status}`)
        console.log(`  Período início:      ${sub.current_period_start}`)
        console.log(`  Período fim:         ${sub.current_period_end}`)
        console.log(`  Gateway Sub ID:      ${sub.gateway_subscription_id || 'N/A'}`)
        console.log(`  Criada em:           ${sub.created_at}`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      })
    }
    
    // Verificar pagamentos
    const paymentsResult = await client.query(`
      SELECT p.* FROM payments p 
      JOIN subscriptions s ON p.subscription_id = s.id 
      WHERE s.student_id = $1 
      ORDER BY p.created_at DESC 
      LIMIT 5
    `, [user.id])
    
    console.log(`💳 Pagamentos: ${paymentsResult.rows.length}\n`)
    
    if (paymentsResult.rows.length === 0) {
      console.log('❌ Nenhum pagamento encontrado - USUÁRIO PRECISA FAZER PRIMEIRO PAGAMENTO')
    }
    
    // Análise final
    console.log('\n🎯 Análise:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (subscriptionsResult.rows.length === 0) {
      console.log('  ❌ USUÁRIO NOVO - SEM ASSINATURA')
      console.log('  ❌ PRECISA FAZER PRIMEIRO PAGAMENTO')
      console.log('  ❌ BOTÃO DEVERIA SER "ASSINAR PLANO" NÃO "RENOVAR"')
    } else {
      console.log('  ✅ Usuário tem assinatura')
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

checkEliasSubscription()