import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5174';

const TEST_STUDENT = {
  email: 'student.e2e@test.com',
  password: 'Test123!@#',
};

test.describe('Simple Login Test', () => {
  test('Should load login page and login successfully', async ({ page }) => {
    // Aumentar timeout para páginas React
    test.setTimeout(60000);

    console.log('1. Navegando para página de login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    console.log('2. Aguardando página carregar...');
    await page.waitForLoadState('domcontentloaded');
    
    // Tirar screenshot para debug
    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
    
    console.log('3. Procurando campo de email...');
    const emailField = page.locator('input[name="email"], input[type="email"]');
    await emailField.waitFor({ state: 'visible', timeout: 15000 });
    
    console.log('4. Preenchendo email...');
    await emailField.fill(TEST_STUDENT.email);
    
    console.log('5. Procurando campo de senha...');
    const passwordField = page.locator('input[name="password"], input[type="password"]');
    await passwordField.waitFor({ state: 'visible', timeout: 15000 });
    
    console.log('6. Preenchendo senha...');
    await passwordField.fill(TEST_STUDENT.password);
    
    console.log('7. Procurando botão de submit...');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: 'visible', timeout: 15000 });
    
    console.log('8. Clicando no botão...');
    await submitButton.click();
    
    console.log('9. Aguardando redirecionamento...');
    // Aguardar redirecionamento (pode ser /dashboard, /courses, etc)
    await page.waitForURL(/\/(dashboard|courses|home)/, { timeout: 15000 });
    
    console.log('10. Login realizado com sucesso!');
    
    // Verificar que não estamos mais na página de login
    expect(page.url()).not.toContain('/login');
    
    // Tirar screenshot final
    await page.screenshot({ path: 'test-results/after-login.png', fullPage: true });
  });
});
