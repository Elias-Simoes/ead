# E2E Test Specification: Payment Checkout with PIX and Installments

## Overview

This document outlines the End-to-End (E2E) test scenarios for the payment checkout system with PIX and installment support. These tests should be implemented using Playwright or a similar E2E testing framework.

## Prerequisites

### Setup Requirements
1. Install Playwright: `npm install -D @playwright/test`
2. Initialize Playwright: `npx playwright install`
3. Configure test environment with test Stripe keys
4. Set up test database with seed data
5. Start backend server on test port
6. Start frontend development server

### Test Data
- Test student account: `student-test@example.com` / `Test123!`
- Test plan: Premium Plan (R$ 99.90/month)
- Test Stripe cards:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`

## Test Scenarios

### Scenario 1: User Selects Plan and Chooses Card with Installments

**Test ID:** E2E-CHECKOUT-001

**Description:** Verify that a user can select a plan, choose card payment, select installments, and complete checkout.

**Steps:**
1. Navigate to login page
2. Log in with test student credentials
3. Navigate to plans/subscription page
4. Click "Subscribe" or "Renew" button for Premium Plan
5. Verify redirect to checkout page (`/checkout/:planId`)
6. Verify plan details are displayed correctly
   - Plan name: "Premium Plan"
   - Plan price: "R$ 99,90"
7. Click on "Cartão de Crédito" payment method selector
8. Verify installment dropdown is visible
9. Select "12x" from installment dropdown
10. Verify installment value is displayed: "12x de R$ 8,33"
11. Click "Confirmar Pagamento" button
12. Verify redirect to Stripe Checkout page
13. Verify Stripe Checkout shows:
    - Correct amount
    - Installment information
14. Fill in test card details
15. Complete payment
16. Verify redirect to success page
17. Verify subscription is active in user dashboard

**Expected Results:**
- User successfully completes card payment with installments
- Subscription is activated immediately
- User sees confirmation message

**Validates Requirements:** 1.2, 1.3, 2.1, 2.2, 2.3, 2.4

---

### Scenario 2: User Selects Plan and Chooses PIX Payment

**Test ID:** E2E-CHECKOUT-002

**Description:** Verify that a user can select a plan, choose PIX payment, and see QR code.

**Steps:**
1. Navigate to login page
2. Log in with test student credentials
3. Navigate to plans/subscription page
4. Click "Subscribe" or "Renew" button for Premium Plan
5. Verify redirect to checkout page
6. Click on "PIX" payment method selector
7. Verify PIX discount is displayed
   - Original price: "R$ 99,90"
   - Discount: "10% de desconto"
   - Final price: "R$ 89,91"
8. Verify payment comparison shows savings
9. Click "Gerar QR Code PIX" button
10. Wait for QR code generation
11. Verify QR code is displayed
12. Verify copy-paste code is displayed
13. Verify expiration timer is displayed (30 minutes)
14. Verify status shows "Aguardando Pagamento"

**Expected Results:**
- PIX QR code is generated successfully
- Discount is applied correctly
- Expiration timer counts down
- User can see all payment details

**Validates Requirements:** 1.2, 1.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3

---

### Scenario 3: User Copies PIX Code

**Test ID:** E2E-CHECKOUT-003

**Description:** Verify that a user can copy the PIX code to clipboard.

**Steps:**
1. Complete steps 1-13 from Scenario 2
2. Click "Copiar Código" button
3. Verify success feedback is displayed
   - Button text changes to "Copiado!" or shows checkmark
   - Success message appears
4. Verify clipboard contains the PIX code
   - Use Playwright's clipboard API to check

**Expected Results:**
- PIX code is copied to clipboard
- User receives visual feedback
- Code format is valid

**Validates Requirements:** 3.4, 8.2, 8.3

---

### Scenario 4: PIX Payment is Confirmed and Redirects

**Test ID:** E2E-CHECKOUT-004

**Description:** Verify that when PIX payment is confirmed, user is automatically redirected.

**Steps:**
1. Complete steps 1-13 from Scenario 2
2. Simulate PIX payment confirmation via webhook
   - Use test API endpoint to trigger webhook
   - Or manually update database to mark payment as paid
3. Wait for polling to detect payment
   - Maximum wait: 10 seconds
4. Verify automatic redirect to success page
5. Verify success message is displayed
6. Navigate to user dashboard
7. Verify subscription status is "active"
8. Verify subscription expiration date is set correctly

**Expected Results:**
- Payment confirmation is detected within 10 seconds
- User is redirected automatically
- Subscription is activated
- User receives confirmation email

**Validates Requirements:** 5.3, 5.4, 5.5, 6.1, 6.2

---

### Scenario 5: PIX Payment Expires and User Generates New QR Code

**Test ID:** E2E-CHECKOUT-005

**Description:** Verify that when PIX payment expires, user can generate a new QR code.

**Steps:**
1. Complete steps 1-13 from Scenario 2
2. Wait for expiration or manually expire payment
   - Option A: Wait 30 minutes (not practical for automated tests)
   - Option B: Mock system time to fast-forward
   - Option C: Manually update database to mark as expired
3. Verify expiration message is displayed
   - "Pagamento expirado"
   - "Gerar novo QR Code" button appears
4. Click "Gerar novo QR Code" button
5. Verify new QR code is generated
6. Verify new expiration timer starts
7. Verify new QR code is different from previous one

**Expected Results:**
- Expired payment is detected
- User can generate new QR code
- New QR code has new expiration time
- User receives expiration email

**Validates Requirements:** 5.2, 6.3

---

### Scenario 6: Payment Method Comparison

**Test ID:** E2E-CHECKOUT-006

**Description:** Verify that users can compare payment methods side by side.

**Steps:**
1. Navigate to checkout page (steps 1-5 from Scenario 1)
2. Verify payment comparison component is visible
3. Verify card payment section shows:
   - "Cartão de Crédito"
   - "Parcele em até 12x"
   - Total amount
4. Verify PIX payment section shows:
   - "PIX"
   - "10% de desconto"
   - Discounted amount
   - Savings in reais
5. Toggle between payment methods
6. Verify selected method is highlighted
7. Verify appropriate form is displayed for each method

**Expected Results:**
- Both payment methods are clearly presented
- Discount and savings are highlighted
- User can easily compare options

**Validates Requirements:** 1.1, 1.4, 4.1, 4.2, 4.3

---

### Scenario 7: Mobile Responsive PIX Payment

**Test ID:** E2E-CHECKOUT-007

**Description:** Verify that PIX payment works correctly on mobile devices.

**Steps:**
1. Set viewport to mobile size (375x667)
2. Complete steps 1-13 from Scenario 2
3. Verify QR code is appropriately sized for mobile
4. Verify "Copiar Código" button is prominent
5. Verify "Abrir app do banco" button is visible (mobile only)
6. Click "Abrir app do banco" button
7. Verify deep link is triggered (if supported)
8. Verify layout is readable and usable
9. Verify timer is visible
10. Verify all text is legible

**Expected Results:**
- Mobile layout is optimized
- QR code is scannable size
- Copy button is easy to tap
- Bank app integration works

**Validates Requirements:** 8.1, 8.2, 8.3, 8.4, 8.5

---

### Scenario 8: Installment Validation

**Test ID:** E2E-CHECKOUT-008

**Description:** Verify that installment selection respects configured limits.

**Steps:**
1. As admin, update payment config to max 6 installments
2. Log in as student
3. Navigate to checkout page
4. Select card payment
5. Open installment dropdown
6. Verify only options 1x through 6x are available
7. Verify 7x through 12x are not available
8. Select 6x installments
9. Verify installment value is calculated correctly
10. Complete checkout
11. Verify payment is processed with 6 installments

**Expected Results:**
- Installment options respect configuration
- Invalid options are not available
- Calculation is correct

**Validates Requirements:** 2.1, 7.1, 7.4

---

### Scenario 9: PIX Discount Configuration

**Test ID:** E2E-CHECKOUT-009

**Description:** Verify that PIX discount respects configured percentage.

**Steps:**
1. As admin, update PIX discount to 15%
2. Log in as student
3. Navigate to checkout page
4. Select PIX payment
5. Verify discount shows "15% de desconto"
6. Verify final amount calculation:
   - Original: R$ 99,90
   - Discount: R$ 14,99
   - Final: R$ 84,91
7. Generate QR code
8. Verify Stripe payment intent has correct amount

**Expected Results:**
- Discount percentage is applied correctly
- Calculations are accurate
- Configuration changes take effect immediately

**Validates Requirements:** 3.1, 4.1, 7.3, 7.4

---

### Scenario 10: Error Handling - Payment Failure

**Test ID:** E2E-CHECKOUT-010

**Description:** Verify that payment failures are handled gracefully.

**Steps:**
1. Navigate to checkout page
2. Select card payment
3. Select installments
4. Click confirm
5. On Stripe Checkout, use decline test card
6. Complete form with declining card
7. Verify error message is displayed
8. Verify user is returned to checkout page
9. Verify user can try again
10. Verify subscription remains inactive

**Expected Results:**
- Error is displayed clearly
- User can retry payment
- No partial subscription is created

**Validates Requirements:** Error handling

---

## Implementation Notes

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run sequentially for payment tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for payment tests
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Utilities

```typescript
// tests/e2e/utils/auth.ts
export async function loginAsStudent(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', 'student-test@example.com');
  await page.fill('[name="password"]', 'Test123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

// tests/e2e/utils/payment.ts
export async function simulatePixPayment(paymentId: string) {
  // Call test API to simulate webhook
  await fetch('http://localhost:4000/api/test/simulate-pix-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });
}

export async function expirePixPayment(paymentId: string) {
  // Call test API to expire payment
  await fetch('http://localhost:4000/api/test/expire-pix-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });
}
```

### Example Test Implementation

```typescript
// tests/e2e/checkout-card-installments.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsStudent } from './utils/auth';

test.describe('Card Payment with Installments', () => {
  test('should complete checkout with 12 installments', async ({ page }) => {
    // Login
    await loginAsStudent(page);
    
    // Navigate to plans
    await page.goto('/plans');
    
    // Select plan
    await page.click('button:has-text("Assinar")');
    
    // Verify checkout page
    await expect(page).toHaveURL(/\/checkout\/.+/);
    await expect(page.locator('h1')).toContainText('Premium Plan');
    
    // Select card payment
    await page.click('[data-testid="payment-method-card"]');
    
    // Select installments
    await page.selectOption('[data-testid="installments-select"]', '12');
    
    // Verify installment display
    await expect(page.locator('[data-testid="installment-value"]'))
      .toContainText('12x de R$ 8,33');
    
    // Confirm payment
    await page.click('button:has-text("Confirmar Pagamento")');
    
    // Wait for Stripe redirect
    await page.waitForURL(/checkout\.stripe\.com/);
    
    // Verify Stripe page loaded
    await expect(page.locator('body')).toContainText('Premium Plan');
  });
});
```

## Test Data Management

### Database Seeding
- Create test student accounts
- Create test plans
- Reset database between test runs
- Use transactions for test isolation

### Stripe Test Mode
- Use Stripe test API keys
- Use test card numbers
- Mock webhook events for faster tests
- Clean up test data after runs

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Maintenance

- Update tests when UI changes
- Keep test data fresh
- Monitor test execution time
- Review and update selectors regularly
- Document flaky tests and fixes

