const puppeteer = require('puppeteer')

async function testProfilePageFix() {
  console.log('🧪 Testando correção da página de perfil...\n')
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  })
  
  try {
    const page = await browser.newPage()
    
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...')
    await page.goto('http://localhost:3000/login')
    await page.waitForSelector('input[type="email"]')
    
    await page.type('input[type="email"]', 'eliassimoesdev@gmail.com')
    await page.type('input[type="password"]', 'Ionic@2ti')
    await page.click('button[type="submit"]')
    
    // Aguardar redirecionamento
    await page.waitForNavigation()
    console.log('✅ Login realizado')
    
    // 2. Navegar para página de perfil
    console.log('\n2️⃣ Navegando para página de perfil...')
    await page.goto('http://localhost:3000/profile')
    await page.waitForSelector('h1', { timeout: 10000 })
    
    const pageTitle = await page.$eval('h1', el => el.textContent)
    console.log(`📄 Título da página: "${pageTitle}"`)
    
    // 3. Verificar status da assinatura
    console.log('\n3️⃣ Verificando status da assinatura...')
    
    // Aguardar o carregamento do status
    await page.waitForSelector('[class*="bg-gray-100"], [class*="bg-red-100"], [class*="bg-green-100"]', { timeout: 10000 })
    
    const statusElement = await page.$('[class*="bg-gray-100"], [class*="bg-red-100"], [class*="bg-green-100"]')
    if (statusElement) {
      const statusText = await page.evaluate(el => el.textContent, statusElement)
      console.log(`📊 Status exibido: "${statusText}"`)
      
      if (statusText === 'Sem Assinatura') {
        console.log('✅ Status correto para usuário novo!')
      } else if (statusText === 'Cancelada') {
        console.log('❌ Status ainda mostra "Cancelada" - problema não resolvido')
      } else {
        console.log(`⚠️ Status inesperado: "${statusText}"`)
      }
    }
    
    // 4. Verificar texto do botão
    console.log('\n4️⃣ Verificando texto do botão...')
    
    const buttonElement = await page.$('button[class*="bg-blue-600"]')
    if (buttonElement) {
      const buttonText = await page.evaluate(el => el.textContent, buttonElement)
      console.log(`🔘 Texto do botão: "${buttonText}"`)
      
      if (buttonText.includes('Assinar Plano')) {
        console.log('✅ Botão correto para usuário novo!')
      } else if (buttonText.includes('Renovar Assinatura')) {
        console.log('❌ Botão ainda mostra "Renovar Assinatura" - problema não resolvido')
      } else {
        console.log(`⚠️ Texto do botão inesperado: "${buttonText}"`)
      }
    }
    
    // 5. Testar clique no botão
    console.log('\n5️⃣ Testando clique no botão...')
    if (buttonElement) {
      await buttonElement.click()
      await page.waitForNavigation({ timeout: 5000 })
      
      const currentUrl = page.url()
      console.log(`🔗 URL após clique: ${currentUrl}`)
      
      if (currentUrl.includes('/plans')) {
        console.log('✅ Redirecionamento correto para página de planos!')
      } else if (currentUrl.includes('/subscription/renew')) {
        console.log('❌ Redirecionamento incorreto para renovação')
      } else {
        console.log(`⚠️ Redirecionamento inesperado: ${currentUrl}`)
      }
    }
    
    console.log('\n🎯 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  } finally {
    await browser.close()
  }
}

testProfilePageFix()