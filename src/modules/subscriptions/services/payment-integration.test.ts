import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { pool } from '../../../config/database';
import { PixPaymentService } from './pix-payment.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { WebhookHandlerService } from './webhook-handler.service';
import { paymentConfigService } from './payment-config.service';
import Stripe from 'stripe';

/**
 * Integration Tests for Payment System
 * 
 * These tests verify the complete payment flows including:
 * - Card payment with installments
 * - PIX payment flow
 * - Webhook processing
 * - Payment expiration
 * - Configuration updates
 */

describe('Payment System - Integration Tests', () => {
  let pixPaymentService: PixPaymentService;
  let paymentGatewayService: PaymentGatewayService;
  let webhookHandlerService: WebhookHandlerService;

  beforeAll(async () => {
    // Initialize services
    pixPaymentService = new PixPaymentService();
    paymentGatewayService = new PaymentGatewayService();
    webhookHandlerService = new WebhookHandlerService();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup
    vi.restoreAllMocks();
  });

  describe('Card Payment with Installments - Complete Flow', () => {
    it('should create checkout session with installments and process payment', async () => {
      // Arrange
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
        payment_intent: 'pi_test_123',
      };

      vi.spyOn(paymentGatewayService['stripe'].checkout.sessions, 'create')
        .mockResolvedValue(mockSession as any);

      vi.spyOn(paymentGatewayService['stripe'].customers, 'list')
        .mockResolvedValue({ data: [] } as any);

      vi.spyOn(paymentGatewayService['stripe'].customers, 'create')
        .mockResolvedValue({ id: 'cus_test_123', email: 'student@test.com' } as any);

      const checkoutParams = {
        planId: 'plan-123',
        planName: 'Premium Plan',
        planPrice: 99.90,
        currency: 'brl',
        studentId: 'student-123',
        studentEmail: 'student@test.com',
        paymentMethod: 'card' as const,
        installments: 12,
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      };

      // Act
      const result = await paymentGatewayService.createCheckoutWithPaymentOptions(checkoutParams);

      // Assert
      expect(result).toBeDefined();
      expect(result.sessionId).toBe('cs_test_123');
      expect(result.checkoutUrl).toBe('https://checkout.stripe.com/test');
      
      // Verify installments were configured
      const createCall = vi.mocked(paymentGatewayService['stripe'].checkout.sessions.create).mock.calls[0][0];
      expect(createCall.payment_method_options?.card?.installments).toBeDefined();
      expect(createCall.payment_method_options?.card?.installments?.enabled).toBe(true);
    });

    it('should create checkout session without installments for single payment', async () => {
      // Arrange
      const mockSession = {
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/test2',
        payment_intent: 'pi_test_456',
      };

      vi.spyOn(paymentGatewayService['stripe'].checkout.sessions, 'create')
        .mockResolvedValue(mockSession as any);

      vi.spyOn(paymentGatewayService['stripe'].customers, 'list')
        .mockResolvedValue({ data: [] } as any);

      vi.spyOn(paymentGatewayService['stripe'].customers, 'create')
        .mockResolvedValue({ id: 'cus_test_456', email: 'student@test.com' } as any);

      const checkoutParams = {
        planId: 'plan-123',
        planName: 'Premium Plan',
        planPrice: 99.90,
        currency: 'brl',
        studentId: 'student-123',
        studentEmail: 'student@test.com',
        paymentMethod: 'card' as const,
        installments: 1,
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      };

      // Act
      const result = await paymentGatewayService.createCheckoutWithPaymentOptions(checkoutParams);

      // Assert
      expect(result).toBeDefined();
      expect(result.sessionId).toBe('cs_test_456');
    });
  });

  describe('PIX Payment - Complete Flow', () => {
    it('should create PIX payment, generate QR code, and handle confirmation', async () => {
      // Arrange - Create PIX payment
      const mockConfig = {
        id: 'config-1',
        maxInstallments: 12,
        pixDiscountPercent: 10,
        installmentsWithoutInterest: 12,
        pixExpirationMinutes: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(paymentConfigService, 'getConfig').mockResolvedValue(mockConfig);

      const mockPaymentIntent = {
        id: 'pi_test_pix_123',
        amount: 8991, // 99.90 - 10% = 89.91
        currency: 'brl',
        status: 'requires_action',
        next_action: {
          type: 'pix_display_qr_code',
          pix_display_qr_code: {
            data: '00020126580014br.gov.bcb.pix...',
            image_url_png: 'data:image/png;base64,iVBORw0KGgo...',
          },
        },
      } as any;

      vi.spyOn(pixPaymentService['stripe'].paymentIntents, 'create')
        .mockResolvedValue(mockPaymentIntent);

      const mockPaymentId = 'pix-payment-123';
      const querySpy = vi.spyOn(pool, 'query');
      
      // First call: INSERT pix payment
      querySpy.mockResolvedValueOnce({
        rows: [{ id: mockPaymentId }],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      // Second call: Get student details for email
      querySpy.mockResolvedValueOnce({
        rows: [{ name: 'Test Student', email: 'student@test.com' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      // Third call: Get plan details for email
      querySpy.mockResolvedValueOnce({
        rows: [{ name: 'Premium Plan' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      const pixParams = {
        studentId: 'student-123',
        planId: 'plan-123',
        studentEmail: 'student@test.com',
        amount: 99.90,
      };

      // Act - Create PIX payment
      const pixPayment = await pixPaymentService.createPixPayment(pixParams);

      // Assert - PIX payment created
      expect(pixPayment).toBeDefined();
      expect(pixPayment.paymentId).toBe(mockPaymentId);
      expect(pixPayment.qrCode).toBe('00020126580014br.gov.bcb.pix...');
      expect(pixPayment.finalAmount).toBeCloseTo(89.91, 2);
      expect(pixPayment.discount).toBeCloseTo(9.99, 2);
      expect(pixPayment.expiresAt).toBeInstanceOf(Date);

      // Arrange - Check status (still pending)
      querySpy.mockResolvedValueOnce({
        rows: [{
          id: mockPaymentId,
          status: 'pending',
          paid_at: null,
          final_amount: '89.91',
          gateway_charge_id: 'pi_test_pix_123',
        }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      vi.spyOn(pixPaymentService['stripe'].paymentIntents, 'retrieve')
        .mockResolvedValue({
          ...mockPaymentIntent,
          status: 'requires_action',
        } as any);

      // Act - Check status (pending)
      const statusPending = await pixPaymentService.checkPixPaymentStatus(mockPaymentId);

      // Assert - Still pending
      expect(statusPending.status).toBe('pending');

      // Arrange - Simulate payment confirmation
      querySpy.mockResolvedValueOnce({
        rows: [{
          id: mockPaymentId,
          status: 'pending',
          paid_at: null,
          final_amount: '89.91',
          gateway_charge_id: 'pi_test_pix_123',
        }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      querySpy.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      vi.spyOn(pixPaymentService['stripe'].paymentIntents, 'retrieve')
        .mockResolvedValue({
          ...mockPaymentIntent,
          status: 'succeeded',
        } as any);

      // Act - Check status (paid)
      const statusPaid = await pixPaymentService.checkPixPaymentStatus(mockPaymentId);

      // Assert - Payment confirmed
      expect(statusPaid.status).toBe('paid');
      expect(statusPaid.paidAt).toBeInstanceOf(Date);
    });

    it('should apply correct discount based on configuration', async () => {
      // Test with different discount percentages
      const testCases = [
        { discount: 5, amount: 100, expected: 95 },
        { discount: 10, amount: 99.90, expected: 89.91 },
        { discount: 15, amount: 200, expected: 170 },
        { discount: 20, amount: 50, expected: 40 },
      ];

      for (const testCase of testCases) {
        const mockConfig = {
          id: 'config-1',
          maxInstallments: 12,
          pixDiscountPercent: testCase.discount,
          installmentsWithoutInterest: 12,
          pixExpirationMinutes: 30,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.spyOn(paymentConfigService, 'getConfig').mockResolvedValue(mockConfig);

        const mockPaymentIntent = {
          id: `pi_test_${testCase.discount}`,
          amount: Math.round(testCase.expected * 100),
          currency: 'brl',
          status: 'requires_action',
          next_action: {
            type: 'pix_display_qr_code',
            pix_display_qr_code: {
              data: 'qr-code-data',
              image_url_png: 'data:image/png;base64,image',
            },
          },
        } as any;

        vi.spyOn(pixPaymentService['stripe'].paymentIntents, 'create')
          .mockResolvedValue(mockPaymentIntent);

        vi.spyOn(pool, 'query')
          .mockResolvedValue({
            rows: [{ id: 'payment-id' }],
            command: 'INSERT',
            rowCount: 1,
            oid: 0,
            fields: [],
          } as any);

        const result = await pixPaymentService.createPixPayment({
          studentId: 'student-123',
          planId: 'plan-123',
          studentEmail: 'test@test.com',
          amount: testCase.amount,
        });

        expect(result.finalAmount).toBeCloseTo(testCase.expected, 2);
      }
    });
  });

  describe('Webhook Processing - PIX Payment Confirmation', () => {
    it('should process PIX webhook and activate subscription', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_test_webhook_123',
        object: 'payment_intent',
        amount: 8991,
        currency: 'brl',
        status: 'succeeded',
        payment_method_types: ['pix'],
        metadata: {
          studentId: 'student-123',
          planId: 'plan-123',
        },
      };

      // Mock pool.connect to return a mock client
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };

      vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as any);

      // Setup query responses
      const queryResponses = [
        // BEGIN
        { rows: [], command: 'BEGIN', rowCount: 0, oid: 0, fields: [] },
        // Find PIX payment
        { rows: [{
          id: 'pix-payment-123',
          student_id: 'student-123',
          plan_id: 'plan-123',
          final_amount: '89.91',
          status: 'pending',
        }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] },
        // Check if already processed
        { rows: [{ status: 'pending' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] },
        // Update PIX payment to paid
        { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] },
        // Get plan details
        { rows: [{
          id: 'plan-123',
          name: 'Premium Plan',
          duration_months: 1,
          price: 99.90,
          currency: 'BRL',
        }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] },
        // Check existing subscription
        { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] },
        // Create subscription
        { rows: [{ id: 'subscription-123' }], command: 'INSERT', rowCount: 1, oid: 0, fields: [] },
        // Create payment record
        { rows: [{ id: 'payment-123' }], command: 'INSERT', rowCount: 1, oid: 0, fields: [] },
        // Update student subscription status
        { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] },
        // COMMIT
        { rows: [], command: 'COMMIT', rowCount: 0, oid: 0, fields: [] },
        // Get student details for email (after commit)
        { rows: [{
          name: 'Test Student',
          email: 'student@test.com',
        }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] },
      ];

      queryResponses.forEach(response => {
        mockClient.query.mockResolvedValueOnce(response as any);
      });

      // Act
      await webhookHandlerService.handlePixPaymentSucceeded(mockPaymentIntent as any);

      // Assert
      expect(mockClient.query).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
      
      // Verify key operations occurred
      const calls = mockClient.query.mock.calls.map(call => call[0]);
      expect(calls.some((call: string) => call.includes('pix_payments') && call.includes('SELECT'))).toBe(true);
      expect(calls.some((call: string) => call.includes('pix_payments') && call.includes('UPDATE'))).toBe(true);
      expect(calls.some((call: string) => call.includes('subscriptions') && call.includes('INSERT'))).toBe(true);
    });
  });

  describe('PIX Payment Expiration', () => {
    it('should expire pending PIX payments after configured time', async () => {
      // Arrange
      const mockExpiredPayments = [
        {
          id: 'expired-1',
          gateway_charge_id: 'pi_expired_1',
        },
      ];

      const querySpy = vi.spyOn(pool, 'query');

      // Query 1: Find expired payments
      querySpy.mockResolvedValueOnce({
        rows: mockExpiredPayments,
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      // For each expired payment: UPDATE + SELECT for email
      querySpy.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      querySpy.mockResolvedValueOnce({
        rows: [{
          name: 'Student 0',
          email: 'student0@test.com',
          plan_name: 'Premium Plan',
          plan_id: 'plan-123',
        }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      vi.spyOn(pixPaymentService['stripe'].paymentIntents, 'cancel')
        .mockResolvedValue({} as any);

      // Act
      const expiredCount = await pixPaymentService.expirePendingPayments();

      // Assert
      expect(expiredCount).toBe(1);
      expect(querySpy).toHaveBeenCalledTimes(3); // 1 SELECT + 1 UPDATE + 1 SELECT for email
    });
  });

  describe('Payment Configuration Updates', () => {
    it('should update configuration and apply to new checkouts', async () => {
      // Create a fresh service instance to avoid cache issues
      const freshConfigService = new (paymentConfigService.constructor as any)();
      
      // Arrange - Initial config with proper field mapping
      const initialConfig = {
        id: 'config-1',
        maxInstallments: 12,
        pixDiscountPercent: 10,
        installmentsWithoutInterest: 12,
        pixExpirationMinutes: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const querySpy = vi.spyOn(pool, 'query');

      // Mock initial config fetch
      querySpy.mockResolvedValueOnce({
        rows: [initialConfig],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      // Act - Get initial config
      const config1 = await freshConfigService.getConfig();
      expect(config1.maxInstallments).toBe(12);
      expect(config1.pixDiscountPercent).toBe(10);

      // Arrange - Update config
      const updatedConfig = {
        id: 'config-1',
        maxInstallments: 6,
        pixDiscountPercent: 15,
        installmentsWithoutInterest: 12,
        pixExpirationMinutes: 30,
        createdAt: initialConfig.createdAt,
        updatedAt: new Date(),
      };

      // Mock update query
      querySpy.mockResolvedValueOnce({
        rows: [updatedConfig],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      // Act - Update config
      const newConfig = await freshConfigService.updateConfig({
        maxInstallments: 6,
        pixDiscountPercent: 15,
      });

      // Assert - Config updated
      expect(newConfig).toBeDefined();
      expect(newConfig.maxInstallments).toBe(6);
      expect(newConfig.pixDiscountPercent).toBe(15);

      // Mock get config after update (should bypass cache since we just updated)
      querySpy.mockResolvedValueOnce({
        rows: [updatedConfig],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      // Act - Get updated config
      const config2 = await freshConfigService.getConfig();

      // Assert - New checkouts use updated config
      expect(config2.maxInstallments).toBe(6);
      expect(config2.pixDiscountPercent).toBe(15);
    });
  });
});
