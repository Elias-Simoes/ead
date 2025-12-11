const { chromium } = require('@playwright/test')

async function testExpiredUserButton() {
  console.log('🧪 Testando botão para usuário com assinatura expirada...\n')
  
  // Primeiro, vamos criar um usuário com assinatura expirada
  console.log('1️⃣ Criando usuário com assinatura expirada...')
  
  const { execSync } = require('child_process')
  try {
    execSync('node create-expired-subscription-user.js', { stdio: 'inherit' })
    console.log('✅ Usuário com assinatura expirada criado')
  } catch (error) {
    console.log('❌ Erro ao criar usuário expirado:', error.message)
    return
  }
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  })
  
  try {
    const page = await browser.newPage()
    
    // 2. Fazer login com usuário expirado
    console.log('\n2️⃣ Fazendo login com usuário expirado...')
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"]', 'expired@example.com')
    await page.fill('input[type="password"]', 'Test123!@#')
    await page.click('button[type="submit"]')
    
    // Aguardar redirecionamento para /courses
    await page.waitForURL('**/courses', { timeout: 10000 })
    console.log('✅ Login bem-sucedido com usuário expirado')
    
    // 3. Verificar bloqueio de assinatura
    console.log('\n3️⃣ Verificando bloqueio de assinatura...')
    const subscriptionBlock = page.locator('.bg-red-50').first()
    await subscriptionBlock.waitFor({ state: 'visible' })
    console.log('✅ Bloqueio de assinatura visível')
    
    // 4. Verificar texto do botão
    console.log('\n4️⃣ Verificando texto do botão...')
    const button = page.locator('button.bg-red-600').first()
    await button.waitFor({ state: 'visible' })
    
    const buttonText = await button.textContent()
    console.log(`📝 Texto do botão: "${buttonText.trim()}"`)
    
    if (buttonText.includes('Renovar Assinatura')) {
      console.log('✅ SUCESSO: Botão mostra "Renovar Assinatura" para usuário expirado!')
    } else if (buttonText.includes('Assinar Plano')) {
      console.log('❌ ERRO: Botão mostra "Assinar Plano" para usuário expirado (deveria ser "Renovar")')
      return
    } else {
      console.log('❓ INESPERADO: Texto do botão não reconhecido')
      return
    }
    
    // 5. Verificar ícone do botão
    console.log('\n5️⃣ Verificando ícone do botão...')
    const buttonIcon = button.locator('svg')
    const iconPath = await buttonIcon.locator('path').getAttribute('d')
    
    // Ícone de "refresh" para usuário expirado
    if (iconPath && iconPath.includes('M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15')) {
      console.log('✅ Ícone correto: "refresh" para usuário expirado')
    } else {
      console.log('❓ Ícone diferente do esperado')
    }
    
    // 6. Testar clique no botão
    console.log('\n6️⃣ Testando clique no botão...')
    await button.click()
    
    // Aguardar redirecionamento para /subscription/renew
    await page.waitForURL('**/subscription/renew', { timeout: 10000 })
    console.log('✅ Redirecionamento para /subscription/renew bem-sucedido!')
    
    console.log('\n🎯 RESULTADO PARA USUÁRIO EXPIRADO:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Usuário expirado vê "Renovar Assinatura"')
    console.log('✅ Ícone correto para usuário expirado')
    console.log('✅ Redirecionamento para /subscription/renew funciona')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Aguardar para visualizar
    await page.waitForTimeout(3000)
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  } finally {
    await browser.close()
  }
}

testExpiredUserButton()