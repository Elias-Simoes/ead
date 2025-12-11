const axios = require('axios')

async function testLoginAPI() {
  console.log('🧪 Testando login via API diretamente...\n')
  
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'eliassimoesdev@gmail.com',
      password: 'Test123!@#'
    })
    
    console.log('✅ Login via API bem-sucedido!')
    console.log('📊 Dados do usuário:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`  ID: ${response.data.data.user.id}`)
    console.log(`  Nome: ${response.data.data.user.name}`)
    console.log(`  Email: ${response.data.data.user.email}`)
    console.log(`  Role: ${response.data.data.user.role}`)
    console.log(`  Subscription Status: ${response.data.data.user.subscriptionStatus}`)
    console.log(`  Subscription Expires At: ${response.data.data.user.subscriptionExpiresAt || 'N/A'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Verificar se é usuário novo
    const user = response.data.data.user
    const isNewUser = user.role === 'student' && 
                      user.subscriptionStatus === 'inactive' && 
                      !user.subscriptionExpiresAt
    
    console.log('\n🎯 Análise do usuário:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`  É usuário novo? ${isNewUser ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`  Deveria ver "Assinar Plano"? ${isNewUser ? '✅ SIM' : '❌ NÃO'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
  } catch (error) {
    console.error('❌ Erro no login via API:')
    if (error.response) {
      console.error(`  Status: ${error.response.status}`)
      console.error(`  Mensagem: ${error.response.data?.error?.message || error.response.data?.message}`)
    } else {
      console.error(`  Erro: ${error.message}`)
    }
  }
}

testLoginAPI()