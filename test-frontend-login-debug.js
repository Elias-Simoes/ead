const { chromium } = require('@playwright/test')

async function testFrontendLogin() {
  console.log('🧪 Testando login frontend com debug...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  })
  
  try {
    const page = await browser.newPage()
    
    // Capturar erros do console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text())
      } else if (msg.type() === 'log') {
        console.log('📝 Console Log:', msg.text())
      }
    })
    
    // Capturar erros de rede
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ Network Error: ${response.status()} ${response.url()}`)
      }
    })
    
    // 1. Ir para página de login
    console.log('1️⃣ Acessando página de login...')
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    // 2. Verificar se formulário está presente
    console.log('2️⃣ Verificando formulário...')
    const emailInput = await page.locator('input[type="email"]')
    const passwordInput = await page.locator('input[type="password"]')
    const submitButton = await page.locator('button[type="submit"]')
    
    console.log(`  Email input presente: ${await emailInput.isVisible()}`)
    console.log(`  Password input presente: ${await passwordInput.isVisible()}`)
    console.log(`  Submit button presente: ${await submitButton.isVisible()}`)
    
    // 3. Preencher formulário
    console.log('3️⃣ Preenchendo formulário...')
    await emailInput.fill('eliassimoesdev@gmail.com')
    await passwordInput.fill('Test123!@#')
    
    // 4. Verificar se campos foram preenchidos
    const emailValue = await emailInput.inputValue()
    const passwordValue = await passwordInput.inputValue()
    console.log(`  Email preenchido: ${emailValue}`)
    console.log(`  Password preenchido: ${passwordValue ? '***' : 'VAZIO'}`)
    
    // 5. Fazer login
    console.log('4️⃣ Fazendo login...')
    await submitButton.click()
    
    // 6. Aguardar e verificar resultado
    console.log('5️⃣ Aguardando resultado...')
    await page.waitForTimeout(5000)
    
    const currentUrl = page.url()
    console.log(`📍 URL atual: ${currentUrl}`)
    
    // 7. Verificar se há mensagens de erro na tela
    const errorMessages = await page.locator('.text-red-500, .text-red-600, .text-red-700, .bg-red-50').allTextContents()
    if (errorMessages.length > 0) {
      console.log('❌ Mensagens de erro encontradas:')
      errorMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg.trim()}`)
      })
    }
    
    // 8. Se ainda estiver na página de login, verificar estado do botão
    if (currentUrl.includes('/login')) {
      console.log('6️⃣ Ainda na página de login, verificando estado...')
      
      const buttonText = await submitButton.textContent()
      const buttonDisabled = await submitButton.isDisabled()
      console.log(`  Texto do botão: "${buttonText.trim()}"`)
      console.log(`  Botão desabilitado: ${buttonDisabled}`)
      
      // Verificar se há loading spinner
      const loadingSpinner = await page.locator('.animate-spin').isVisible()
      console.log(`  Loading spinner visível: ${loadingSpinner}`)
    }
    
    // Aguardar para visualizar
    await page.waitForTimeout(5000)
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  } finally {
    await browser.close()
  }
}

testFrontendLogin()