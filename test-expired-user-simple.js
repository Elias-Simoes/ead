const { chromium } = require('@playwright/test')

async function testExpiredUserSimple() {
  console.log('🧪 Testando usuário expirado (simples)...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  })
  
  try {
    const page = await browser.newPage()
    
    // Capturar erros
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text())
      }
    })
    
    // 1. Fazer login com usuário expirado
    console.log('1️⃣ Fazendo login com usuário expirado...')
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"]', 'expired.student@test.com')
    await page.fill('input[type="password"]', 'Test123!@#')
    await page.click('button[type="submit"]')
    
    // Aguardar resultado
    await page.waitForTimeout(5000)
    
    const currentUrl = page.url()
    console.log(`📍 URL atual: ${currentUrl}`)
    
    if (currentUrl.includes('/courses')) {
      console.log('✅ Login bem-sucedido, redirecionado para /courses')
      
      // Verificar botão
      const subscriptionBlock = page.locator('.bg-red-50').first()
      const isVisible = await subscriptionBlock.isVisible()
      
      if (isVisible) {
        console.log('✅ Bloqueio de assinatura visível')
        
        const button = page.locator('button.bg-red-600').first()
        const buttonText = await button.textContent()
        console.log(`📝 Texto do botão: "${buttonText.trim()}"`)
        
        if (buttonText.includes('Renovar Assinatura')) {
          console.log('✅ SUCESSO: Botão correto para usuário expirado!')
        } else {
          console.log('❌ ERRO: Botão incorreto para usuário expirado')
        }
      } else {
        console.log('❌ Bloqueio de assinatura não encontrado')
      }
    } else {
      console.log('❌ Login falhou ou não redirecionou')
      
      // Verificar mensagens de erro
      const errorMessages = await page.locator('.text-red-500, .text-red-600, .text-red-700').allTextContents()
      if (errorMessages.length > 0) {
        console.log('❌ Mensagens de erro:')
        errorMessages.forEach((msg, index) => {
          console.log(`  ${index + 1}. ${msg.trim()}`)
        })
      }
    }
    
    // Aguardar para visualizar
    await page.waitForTimeout(5000)
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  } finally {
    await browser.close()
  }
}

testExpiredUserSimple()