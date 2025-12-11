require('dotenv').config()
const { Pool } = require('pg')
const bcrypt = require('bcrypt')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function resetEliasPassword() {
  const client = await pool.connect()
  
  try {
    console.log('🔐 Resetando senha do usuário Elias...\n')
    
    const newPassword = 'Test123!@#'
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    const result = await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, name, email',
      [hashedPassword, 'eliassimoesdev@gmail.com']
    )
    
    if (result.rows.length > 0) {
      console.log('✅ Senha resetada com sucesso!')
      console.log('📊 Usuário atualizado:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`  ID: ${result.rows[0].id}`)
      console.log(`  Nome: ${result.rows[0].name}`)
      console.log(`  Email: ${result.rows[0].email}`)
      console.log(`  Nova senha: ${newPassword}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    } else {
      console.log('❌ Usuário não encontrado')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

resetEliasPassword()