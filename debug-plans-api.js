const axios = require('axios')

async function debugPlansAPI() {
  console.log('🔍 Debugando API de planos...\n')
  
  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...')
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'eliassimoesdev@gmail.com',
      password: 'Ionic@2ti'
    })
    
    const { accessToken } = loginResponse.data.data.tokens
    console.log('✅ Login bem-sucedido')
    
    // 2. Buscar planos
    console.log('\n2️⃣ Buscando planos...')
    const plansResponse = await axios.get('http://localhost:3000/api/subscriptions/plans', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log('✅ Resposta da API de planos:')
    console.log('📊 Estrutura completa da resposta:')
    console.log(JSON.stringify(plansResponse.data, null, 2))
    
    console.log('\n📋 Análise da estrutura:')
    console.log(`- Status: ${plansResponse.status}`)
    console.log(`- Tipo de response.data: ${typeof plansResponse.data}`)
    console.log(`- É array? ${Array.isArray(plansResponse.data)}`)
    
    if (plansResponse.data.data) {
      console.log(`- Tipo de response.data.data: ${typeof plansResponse.data.data}`)
      console.log(`- response.data.data é array? ${Array.isArray(plansResponse.data.data)}`)
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message)
  }
}

debugPlansAPI()