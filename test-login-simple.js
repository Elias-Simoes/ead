const { chromium } = require('@playwright/test')

async function testLogin() {
  console.log('🧪 Testando login simples com Elias...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  })
  
  try {
    const page = await browser.newPage()
    
    // 1. Ir para página de login
    console.log('1️⃣ Acessando página de login...')
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    // 2. Verificar se página carregou
    const title = await page.title()
    console.log(`📝 Título da página: "${title}"`)
    
    // 3. Preencher formulário
    console.log('2️⃣ Preenchendo formulário...')
    await page.fill('input[type="email"]', 'eliassimoesdev@gmail.com')
    await page.fill('input[type="password"]', 'Ionic@2ti')
    
    // 4. Fazer login
    console.log('3️⃣ Fazendo login...')
    await page.click('button[type="submit"]')
    
    // 5. Aguardar e verificar redirecionamento
    console.log('4️⃣ Aguardando redirecionamento...')
    await page.waitForTimeout(5000)
    
    const currentUrl = page.url()
    console.log(`📍 URL atual: ${currentUrl}`)
    
    if (currentUrl.includes('/courses')) {
      console.log('✅ Redirecionado para /courses')
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Ainda na página de login - possível erro')
    } else {
      console.log(`📍 Redirecionado para: ${currentUrl}`)
    }
    
    // 6. Se estiver na página de cursos, verificar o botão
    if (currentUrl.includes('/courses')) {
      console.log('\n5️⃣ Verificando botão na página de cursos...')
      
      try {
        // Aguardar a página carregar completamente
        await page.waitForLoadState('networkidle')
        
        // Procurar pelo bloqueio de assinatura (novo design)
        const subscriptionBlock = page.locator('div.relative.overflow-hidden.bg-gradient-to-br')
        const isVisible = await subscriptionBlock.isVisible()
        
        if (isVisible) {
          console.log('✅ Bloqueio de assinatura encontrado')
          
          // Verificar texto do botão (novo design)
          const button = page.locator('button.bg-gradient-to-r')
          const buttonText = await button.textContent()
          console.log(`📝 Texto do botão: "${buttonText.trim()}"`)
          
          if (buttonText.includes('Escolher Meu Plano') || buttonText.includes('Assinar Plano')) {
            console.log('✅ SUCESSO: Botão correto para usuário novo!')
          } else {
            console.log('❌ ERRO: Botão incorreto')
          }
        } else {
          console.log('❌ Bloqueio de assinatura não encontrado')
        }
      } catch (error) {
        console.log('❌ Erro ao verificar botão:', error.message)
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

testLogin()