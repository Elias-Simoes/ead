const { chromium } = require('@playwright/test')

async function testPlansPage() {
  console.log('🧪 Testando página de planos...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  })
  
  try {
    const page = await browser.newPage()
    
    // 1. Fazer login primeiro
    console.log('1️⃣ Fazendo login...')
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="email"]', 'eliassimoesdev@gmail.com')
    await page.fill('input[type="password"]', 'Ionic@2ti')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/courses')
    console.log('✅ Login realizado')
    
    // 2. Ir para página de planos
    console.log('2️⃣ Navegando para página de planos...')
    await page.goto('http://localhost:5173/plans')
    await page.waitForLoadState('networkidle')
    
    // 3. Verificar se a página carregou
    const title = await page.textContent('h1')
    console.log(`📝 Título da página: "${title}"`)
    
    // 4. Verificar se há erro
    const errorElement = page.locator('.bg-red-50')
    const hasError = await errorElement.isVisible()
    
    if (hasError) {
      const errorText = await errorElement.textContent()
      console.log(`❌ Erro encontrado: "${errorText}"`)
    } else {
      console.log('✅ Nenhum erro encontrado')
    }
    
    // 5. Verificar se os planos carregaram
    const planCards = page.locator('.bg-white.rounded-lg.shadow-lg')
    const planCount = await planCards.count()
    console.log(`📋 Número de planos encontrados: ${planCount}`)
    
    if (planCount > 0) {
      console.log('✅ Planos carregados com sucesso!')
      
      // Verificar primeiro plano
      const firstPlan = planCards.first()
      const planName = await firstPlan.locator('h3').textContent()
      const planPrice = await firstPlan.locator('.text-4xl').textContent()
      console.log(`📦 Primeiro plano: ${planName} - ${planPrice}`)
      
      // Testar clique no botão
      console.log('6️⃣ Testando clique no botão "Assinar Agora"...')
      await firstPlan.locator('button').click()
      
      // Aguardar redirecionamento
      await page.waitForTimeout(2000)
      const currentUrl = page.url()
      console.log(`📍 URL após clique: ${currentUrl}`)
      
      if (currentUrl.includes('/checkout/')) {
        console.log('✅ Redirecionamento para checkout funcionou!')
      } else {
        console.log('❌ Redirecionamento não funcionou')
      }
    } else {
      console.log('❌ Nenhum plano foi carregado')
    }
    
    // Aguardar para visualizar
    await page.waitForTimeout(3000)
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  } finally {
    await browser.close()
  }
}

testPlansPage()