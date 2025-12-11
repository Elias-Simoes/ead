import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5174';

test.describe('Debug React Loading', () => {
  test('Should wait for React to render', async ({ page }) => {
    test.setTimeout(90000);

    // Capturar erros do console
    const consoleMessages: string[] = [];
    const errors: string[] = [];
    
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log(text);
    });
    
    page.on('pageerror', error => {
      const text = `[PAGE ERROR] ${error.message}`;
      errors.push(text);
      console.log(text);
    });

    console.log('\n=== Navegando para /login ===');
    await page.goto(`${BASE_URL}/login`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('\n=== Aguardando React renderizar ===');
    // Aguardar o div#root ter conteúdo
    await page.waitForFunction(() => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    }, { timeout: 30000 });
    
    console.log('\n=== React renderizado! ===');
    
    // Aguardar mais um pouco para garantir
    await page.waitForTimeout(2000);
    
    // Verificar o conteúdo do root
    const rootHTML = await page.locator('#root').innerHTML();
    console.log('\n=== Conteúdo do #root (primeiros 500 chars) ===');
    console.log(rootHTML.substring(0, 500));
    
    // Listar inputs novamente
    const inputs = await page.locator('input').all();
    console.log(`\n=== Total de inputs: ${inputs.length} ===`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      console.log(`Input ${i}: type="${type}", name="${name}", id="${id}"`);
    }
    
    // Tirar screenshot final
    await page.screenshot({ path: 'test-results/react-rendered.png', fullPage: true });
    
    console.log('\n=== Erros encontrados ===');
    console.log(errors.length > 0 ? errors.join('\n') : 'Nenhum erro');
    
    // Verificar que temos inputs
    expect(inputs.length).toBeGreaterThan(0);
  });
});
