require('dotenv').config()
const axios = require('axios')

const API_URL = process.env.API_URL || 'http://localhost:3000'

async function testRegister() {
  try {
    console.log('\n🧪 Testando cadastro de novo usuário...\n')
    
    const userData = {
      name: 'Elias Simoes',
      email: 'eliassimoesdev@gmail.com',
      password: 'Test123!@#',
      gdprConsent: true
    }
    
    console.log('📤 Enviando requisição para:', `${API_URL}/api/auth/register`)
    console.log('📋 Dados:', JSON.stringify(userData, null, 2))
    
    const response = await axios.post(`${API_URL}/api/auth/register`, userData)
    
    console.log('\n✅ Cadastro realizado com sucesso!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Status:', response.status)
    console.log('Resposta:', JSON.stringify(response.data, null, 2))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
  } catch (error) {
    console.error('\n❌ Erro no cadastro!')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (error.response) {
      // Erro da API
      console.error('Status:', error.response.status)
      console.error('Dados:', JSON.stringify(error.response.data, null, 2))
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2))
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor')
      console.error('Request:', error.request)
    } else {
      // Erro ao configurar a requisição
      console.error('Erro:', error.message)
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    throw error
  }
}

testRegister()
  .then(() => {
    console.log('✅ Teste concluído')
    process.exit(0)
  })
  .catch(() => {
    console.log('❌ Teste falhou')
    process.exit(1)
  })
