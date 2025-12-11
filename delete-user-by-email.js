require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function deleteUserByEmail(email) {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    console.log(`\n🔍 Procurando usuário com email: ${email}`)
    
    // Buscar o usuário
    const userResult = await client.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      [email]
    )
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado')
      await client.query('ROLLBACK')
      return
    }
    
    const user = userResult.rows[0]
    console.log('\n📋 Usuário encontrado:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Nome: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    
    // Deletar da tabela students (se existir) - usa id diretamente
    const studentDelete = await client.query(
      'DELETE FROM students WHERE id = $1 RETURNING id',
      [user.id]
    )
    if (studentDelete.rows.length > 0) {
      console.log(`\n✅ Registro deletado da tabela students`)
    }
    
    // Deletar da tabela instructors (se existir) - usa id diretamente
    const instructorDelete = await client.query(
      'DELETE FROM instructors WHERE id = $1 RETURNING id',
      [user.id]
    )
    if (instructorDelete.rows.length > 0) {
      console.log(`✅ Registro deletado da tabela instructors`)
    }
    
    // Deletar o usuário
    await client.query('DELETE FROM users WHERE id = $1', [user.id])
    console.log(`✅ Usuário deletado da tabela users`)
    
    await client.query('COMMIT')
    console.log('\n✅ Usuário deletado com sucesso!')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Erro ao deletar usuário:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Executar
const email = 'eliassimoesdev@gmail.com'
deleteUserByEmail(email)
  .then(() => {
    console.log('\n✅ Script concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error)
    process.exit(1)
  })
