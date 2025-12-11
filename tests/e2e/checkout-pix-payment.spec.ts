/**
 * E2E Test: PIX Payment Flow
 * 
 * This is an example Playwright test implementation for PIX payments.
 * To use this file:
 * 1. Install Playwright: npm install -D @playwright/test
 * 2. Initialize: npx playwright install
 * 3. Rename file to .spec.ts
 * 4. Run: npx playwright test
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test credentials
const TEST_STUDENT = {
  email: 'student-test@example.com',
  password: 'Test123!',
};

// Helper functions
async function loginAsStudent(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[name="email"]', TEST_STUDENT.email);
  await page.fill('[name="password"]', TEST_STUDENT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`);
}

async function navigateToCheckout(page: Page) {
  await page.goto(`${BASE_URL}/plans`);
  await page.click('button:has-text("Assinar"), button:has-text("Renovar")');
  await page.waitForURL(/\/checkout\/.+/);
}

async function simulatePixPayment(paymentId: string) {
  // Call test API to simulate PIX payment confirmation
  const response = await fetch(`${API_URL}/api/test/simulate-pix-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });
  return response.ok;
}

async function expirePixPayment(paymentId: string) {
  // Call test API to expire PIX payment
  const response = await fetch(`${API_URL}/api/test/expire-pix-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });
  return response.ok;
}

test.describe('PIX Payment - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('E2E-CHECKOUT-002: User selects plan and generates PIX QR code', async ({ page }) => {
    // Navigate to checkout
    await navigateToCheckout(page);

    // Verify checkout page loaded
    await expect(page.locator('h1, h2')).toContainText('Premium Plan');

    // Select PIX payment method
    await page.click('[data-testid="payment-method-pix"]');

    // Verify PIX payment form is visible
    await expect(page.locator('[data-testid="pix-payment-form"]')).toBeVisible();

    // Verify discount is displayed
    await expect(page.locator('[data-testid="pix-discount"]')).toContainText('10%');
    await expect(page.locator('[data-testid="pix-discount"]')).toContainText('desconto');

    // Verify original price is shown
    await expect(page.locator('[data-testid="original-price"]')).toContainText('99,90');

    // Verify final price with discount is shown
    await expect(page.locator('[data-testid="final-price"]')).toContainText('89,91');

    // Verify savings amount is displayed
    await expect(page.locator('[data-testid="savings-amount"]')).toContainText('9,99');

    // Click generate QR code button
    await page.click('button:has-text("Gerar QR Code PIX")');

    // Wait for QR code generation
    await page.waitForSelector('[data-testid="qr-code-image"]', { timeout: 10000 });

    // Verify QR code is displayed
    await expect(page.locator('[data-testid="qr-code-image"]')).toBeVisible();

    // Verify copy-paste code is displayed
    await expect(page.locator('[data-testid="copy-paste-code"]')).toBeVisible();

    // Verify expiration timer is displayed
    await expect(page.locator('[data-testid="expiration-timer"]')).toBeVisible();
    await expect(page.locator('[data-testid="expiration-timer"]')).toContainText('30');

    // Verify status shows "Aguardando Pagamento"
    await expect(page.locator('[data-testid="payment-status"]')).toContainText('Aguardando');
  });

  test('E2E-CHECKOUT-003: User copies PIX code to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to checkout and generate QR code
    await navigateToCheckout(page);
    await page.click('[data-testid="payment-method-pix"]');
    await page.click('button:has-text("Gerar QR Code PIX")');
    await page.waitForSelector('[data-testid="qr-code-image"]');

    // Get the copy-paste code text before clicking
    const codeText = await page.locator('[data-testid="copy-paste-code"]').textContent();

    // Click copy button
    await page.click('button:has-text("Copiar Código")');

    // Verify success feedback
    await expect(page.locator('button:has-text("Copiado!")')).toBeVisible({ timeout: 2000 });

    // Verify clipboard contains the code
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(codeText);

    // Verify code format is valid (PIX codes start with specific patterns)
    expect(clipboardText).toMatch(/^[0-9]{44,}/); // PIX codes are typically 44+ digits
  });

  test('E2E-CHECKOUT-004: PIX payment confirmation triggers redirect', async ({ page }) => {
    // Navigate to checkout and generate QR code
    await navigateToCheckout(page);
    await page.click('[data-testid="payment-method-pix"]');
    await page.click('button:has-text("Gerar QR Code PIX")');
    await page.waitForSelector('[data-testid="qr-code-image"]');

    // Extract payment ID from page (could be in data attribute or URL)
    const paymentId = await page.getAttribute('[data-testid="pix-payment-container"]', 'data-payment-id');
    
    if (paymentId) {
      // Simulate PIX payment confirmation via test API
      await simulatePixPayment(paymentId);

      // Wait for polling to detect payment and redirect
      await page.waitForURL(/\/success/, { timeout: 15000 });

      // Verify success page
      await expect(page.locator('h1, h2')).toContainText('Pagamento Confirmado');
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`);

      // Verify subscription is active
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Ativa');
    }
  });

  test('E2E-CHECKOUT-005: Expired PIX payment allows new QR code generation', async ({ page }) => {
    // Navigate to checkout and generate QR code
    await navigateToCheckout(page);
    await page.click('[data-testid="payment-method-pix"]');
    await page.click('button:has-text("Gerar QR Code PIX")');
    await page.waitForSelector('[data-testid="qr-code-image"]');

    // Get first QR code
    const firstQrCode = await page.locator('[data-testid="qr-code-image"]').getAttribute('src');

    // Extract payment ID
    const paymentId = await page.getAttribute('[data-testid="pix-payment-container"]', 'data-payment-id');

    if (paymentId) {
      // Expire the payment via test API
      await expirePixPayment(paymentId);

      // Wait for expiration message
      await expect(page.locator('[data-testid="payment-expired"]')).toBeVisible({ timeout: 5000 });

      // Verify expiration message
      await expect(page.locator('[data-testid="payment-expired"]')).toContainText('expirado');

      // Verify "Generate new QR code" button appears
      await expect(page.locator('button:has-text("Gerar novo QR Code")')).toBeVisible();

      // Click to generate new QR code
      await page.click('button:has-text("Gerar novo QR Code")');

      // Wait for new QR code
      await page.waitForSelector('[data-testid="qr-code-image"]', { timeout: 10000 });

      // Get new QR code
      const newQrCode = await page.locator('[data-testid="qr-code-image"]').getAttribute('src');

      // Verify new QR code is different
      expect(newQrCode).not.toBe(firstQrCode);

      // Verify new timer started
      await expect(page.locator('[data-testid="expiration-timer"]')).toContainText('30');
    }
  });

  test('E2E-CHECKOUT-009: PIX discount respects configuration', async ({ page }) => {
    // This test assumes admin can update config
    // In practice, you'd set up test data with specific discount

    // Navigate to checkout
    await navigateToCheckout(page);

    // Select PIX payment
    await page.click('[data-testid="payment-method-pix"]');

    // Get discount percentage from UI
    const discountText = await page.locator('[data-testid="pix-discount"]').textContent();
    const discountMatch = discountText?.match(/(\d+)%/);
    const discountPercent = discountMatch ? parseInt(discountMatch[1]) : 0;

    // Get original price
    const originalPriceText = await page.locator('[data-testid="original-price"]').textContent();
    const originalPrice = parseFloat(originalPriceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');

    // Get final price
    const finalPriceText = await page.locator('[data-testid="final-price"]').textContent();
    const finalPrice = parseFloat(finalPriceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');

    // Calculate expected discount
    const expectedDiscount = (originalPrice * discountPercent) / 100;
    const expectedFinalPrice = originalPrice - expectedDiscount;

    // Verify calculation is correct (allow 0.01 difference for rounding)
    expect(Math.abs(finalPrice - expectedFinalPrice)).toBeLessThan(0.02);
  });
});

test.describe('PIX Payment - Mobile Responsive', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('E2E-CHECKOUT-007: Mobile PIX payment layout is optimized', async ({ page }) => {
    // Navigate to checkout
    await navigateToCheckout(page);

    // Select PIX payment
    await page.click('[data-testid="payment-method-pix"]');

    // Generate QR code
    await page.click('button:has-text("Gerar QR Code PIX")');
    await page.waitForSelector('[data-testid="qr-code-image"]');

    // Verify QR code is visible and appropriately sized
    const qrCode = page.locator('[data-testid="qr-code-image"]');
    await expect(qrCode).toBeVisible();
    
    const qrCodeBox = await qrCode.boundingBox();
    expect(qrCodeBox?.width).toBeGreaterThan(200); // Minimum scannable size
    expect(qrCodeBox?.width).toBeLessThan(350); // Not too large for mobile

    // Verify copy button is prominent
    const copyButton = page.locator('button:has-text("Copiar Código")');
    await expect(copyButton).toBeVisible();
    
    const copyButtonBox = await copyButton.boundingBox();
    expect(copyButtonBox?.height).toBeGreaterThan(40); // Easy to tap

    // Verify "Open bank app" button is visible on mobile
    const bankAppButton = page.locator('button:has-text("Abrir app do banco")');
    if (await bankAppButton.isVisible()) {
      const bankAppBox = await bankAppButton.boundingBox();
      expect(bankAppBox?.height).toBeGreaterThan(40);
    }

    // Verify timer is visible
    await expect(page.locator('[data-testid="expiration-timer"]')).toBeVisible();

    // Verify all text is legible (not too small)
    const allText = await page.locator('body').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return parseFloat(styles.fontSize);
    });
    expect(allText).toBeGreaterThanOrEqual(14); // Minimum readable font size
  });

  test('Mobile: Copy button works with touch', async ({ page }) => {
    // Navigate to checkout and generate QR code
    await navigateToCheckout(page);
    await page.click('[data-testid="payment-method-pix"]');
    await page.click('button:has-text("Gerar QR Code PIX")');
    await page.waitForSelector('[data-testid="qr-code-image"]');

    // Tap copy button (mobile touch)
    await page.tap('button:has-text("Copiar Código")');

    // Verify success feedback
    await expect(page.locator('button:has-text("Copiado!")')).toBeVisible({ timeout: 2000 });
  });

  test('Mobile: Layout remains usable in landscape', async ({ page }) => {
    // Rotate to landscape
    await page.setViewportSize({ width: 667, height: 375 });

    // Navigate to checkout and generate QR code
    await navigateToCheckout(page);
    await page.click('[data-testid="payment-method-pix"]');
    await page.click('button:has-text("Gerar QR Code PIX")');
    await page.waitForSelector('[data-testid="qr-code-image"]');

    // Verify key elements are still visible
    await expect(page.locator('[data-testid="qr-code-image"]')).toBeVisible();
    await expect(page.locator('button:has-text("Copiar Código")')).toBeVisible();
    await expect(page.locator('[data-testid="expiration-timer"]')).toBeVisible();
  });
});

test.describe('PIX Payment - Polling Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('Should poll for payment status every 3 seconds', async ({ page }) => {
    // Navigate to checkout and generate QR code
    await navigateToCheckout(page);
    await page.click('[data-testid="payment-method-pix"]');
    await page.click('button:has-text("Gerar QR Code PIX")');
    await page.waitForSelector('[data-testid="qr-code-image"]');

    // Monitor network requests
    const statusRequests: number[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/pix/') && request.url().includes('/status')) {
        statusRequests.push(Date.now());
      }
    });

    // Wait for at least 3 polling requests
    await page.waitForTimeout(10000);

    // Verify polling occurred
    expect(statusRequests.length).toBeGreaterThanOrEqual(3);

    // Verify polling interval is approximately 3 seconds
    if (statusRequests.length >= 2) {
      const interval = statusRequests[1] - statusRequests[0];
      expect(interval).toBeGreaterThan(2500); // Allow some variance
      expect(interval).toBeLessThan(3500);
    }
  });

  test('Should stop polling after payment confirmation', async ({ page }) => {
    // Navigate to checkout and generate QR code
    await navigateToCheckout(page);
    await page.click('[data-testid="payment-method-pix"]');
    await page.click('button:has-text("Gerar QR Code PIX")');
    await page.waitForSelector('[data-testid="qr-code-image"]');

    // Extract payment ID
    const paymentId = await page.getAttribute('[data-testid="pix-payment-container"]', 'data-payment-id');

    if (paymentId) {
      // Count requests before confirmation
      let requestCount = 0;
      page.on('request', (request) => {
        if (request.url().includes('/pix/') && request.url().includes('/status')) {
          requestCount++;
        }
      });

      // Wait for a few polls
      await page.waitForTimeout(7000);
      const requestsBeforeConfirmation = requestCount;

      // Simulate payment confirmation
      await simulatePixPayment(paymentId);

      // Wait for redirect
      await page.waitForURL(/\/success/, { timeout: 15000 });

      // Verify no more polling requests after redirect
      const requestsAfterConfirmation = requestCount;
      
      // Should have stopped polling
      expect(requestsAfterConfirmation).toBe(requestsBeforeConfirmation);
    }
  });
});
