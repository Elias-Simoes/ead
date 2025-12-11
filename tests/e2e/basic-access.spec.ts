import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5174';

test.describe('Basic Access Test', () => {
  test('Should access frontend and see content', async ({ page }) => {
    test.setTimeout(60000);

    console.log('Acessando:', BASE_URL);
    const response = await page.goto(BASE_URL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Status:', response?.status());
    console.log('URL final:', page.url());
    
    // Aguardar um pouco para React carregar
    await page.waitForTimeout(3000);
    
    // Pegar o HTML da página
    const html = await page.content();
    console.log('HTML length:', html.length);
    console.log('HTML preview:', html.substring(0, 500));
    
    // Tirar screenshot
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
    
    // Verificar se tem algum conteúdo
    const bodyText = await page.locator('body').textContent();
    console.log('Body text length:', bodyText?.length);
    console.log('Body text preview:', bodyText?.substring(0, 200));
    
    // Verificar se a página carregou
    expect(response?.status()).toBe(200);
  });

  test('Should access login page', async ({ page }) => {
    test.setTimeout(60000);

    console.log('Acessando login:', `${BASE_URL}/login`);
    const response = await page.goto(`${BASE_URL}/login`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Status:', response?.status());
    console.log('URL final:', page.url());
    
    // Aguardar React carregar
    await page.waitForTimeout(3000);
    
    // Pegar todo o HTML
    const html = await page.content();
    console.log('HTML da página de login (primeiros 1000 chars):');
    console.log(html.substring(0, 1000));
    
    // Tirar screenshot
    await page.screenshot({ path: 'test-results/login-page-full.png', fullPage: true });
    
    // Listar todos os inputs
    const inputs = await page.locator('input').all();
    console.log(`\nTotal de inputs encontrados: ${inputs.length}`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`Input ${i}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}"`);
    }
    
    // Verificar se a página carregou
    expect(response?.status()).toBe(200);
  });
});
