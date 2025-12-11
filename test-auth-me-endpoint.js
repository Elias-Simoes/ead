const axios = require('axios')

async function testAuthMe() {
  console.log('🧪 Testando endpoint /auth/me...\n')
  
  try {
    // 1. Primeiro fazer login para obter o token
    console.log('1️⃣ Fazendo login para obter token...')
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'eliassimoesdev@gmail.com',
      password: 'Ionic@2ti'
    })
    
    const { accessToken } = loginResponse.data.data.tokens
    console.log('✅ Login bem-sucedido, token obtido')
    
    // 2. Testar endpoint /auth/me
    console.log('\n2️⃣ Testando endpoint /auth/me...')
    const meResponse = await axios.get('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log('✅ Endpoint /auth/me funcionando!')
    console.log('📊 Dados do usuário completos:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`  ID: ${meResponse.data.id}`)
    console.log(`  Nome: ${meResponse.data.name}`)
    console.log(`  Email: ${meResponse.data.email}`)
    console.log(`  Role: ${meResponse.data.role}`)
    console.log(`  Subscription Status: ${meResponse.data.subscriptionStatus || 'N/A'}`)
    console.log(`  Subscription Expires At: ${meResponse.data.subscriptionExpiresAt || 'N/A'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 3. Verificar se é usuário novo
    console.log('\n3️⃣ Análise do usuário:')
    const user = meResponse.data
    const isNewUser = user.role === 'student' && 
                      user.subscriptionStatus === 'inactive' && 
                      !user.subscriptionExpiresAt
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`  É usuário novo? ${isNewUser ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`  Deveria ver "Assinar Plano"? ${isNewUser ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`  Lógica frontend funcionará? ${isNewUser ? '✅ SIM' : '❌ NÃO'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
  } catch (error) {
    console.error('❌ Erro no teste:')
    if (error.response) {
      console.error(`  Status: ${error.response.status}`)
      console.error(`  Mensagem: ${error.response.data?.error?.message || error.response.data?.message}`)
    } else {
      console.error(`  Erro: ${error.message}`)
    }
  }
}

testAuthMe()