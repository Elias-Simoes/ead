import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { PixPaymentService, CreatePixPaymentParams } from './pix-payment.service';
import { pool } from '../../../config/database';
import { paymentConfigService } from './payment-config.service';
import Stripe from 'stripe';

/**
 * Property-Based Tests for PIX Payment Service
 * 
 * Feature: checkout-parcelamento-pix
 */

describe('PixPaymentService - Property-Based Tests', () => {
  let service: PixPaymentService;

  beforeEach(() => {
    vi.restoreAllMocks();
    service = new PixPaymentService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 1: Desconto PIX é aplicado corretamente
   * Validates: Requirements 3.1, 4.1, 4.3
   * 
   * For any plan amount and discount percentage configuration,
   * the final amount should equal the original amount minus the discount percentage.
   */
  it('Property 1: PIX discount is applied correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid plan amounts (R$ 10.00 to R$ 1000.00)
        fc.float({ min: 10, max: 1000, noNaN: true }),
        // Generate valid discount percentages (0% to 50%)
        fc.float({ min: 0, max: 50, noNaN: true }),
        async (planAmount: number, discountPercent: number) => {
          // Round to 2 decimal places for currency
          planAmount = Math.round(planAmount * 100) / 100;
          discountPercent = Math.round(discountPercent * 100) / 100;

          const params: CreatePixPaymentParams = {
            studentId: 'test-student-id',
            planId: 'test-plan-id',
            studentEmail: 'test@example.com',
            amount: planAmount,
          };

          // Mock payment config
          const mockConfig = {
            id: 'test-config-id',
            maxInstallments: 12,
            pixDiscountPercent: discountPercent,
            installmentsWithoutInterest: 12,
            pixExpirationMinutes: 30,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          vi.spyOn(paymentConfigService, 'getConfig').mockResolvedValue(mockConfig);

          // Mock Stripe PaymentIntent creation
          const mockPaymentIntent = {
            id: 'pi_test_123',
            amount: Math.round((planAmount - (planAmount * discountPercent / 100)) * 100),
            currency: 'brl',
            status: 'requires_action',
            next_action: {
              type: 'pix_display_qr_code',
              pix_display_qr_code: {
                data: 'mock-qr-code-data',
                image_url_png: 'data:image/png;base64,mock-image',
              },
            },
          } as any;

          const stripeCreateSpy = vi.spyOn(service['stripe'].paymentIntents, 'create')
            .mockResolvedValue(mockPaymentIntent);

          // Mock database insert
          const mockPaymentId = 'test-payment-id';
          vi.spyOn(pool, 'query').mockResolvedValue({
            rows: [{ id: mockPaymentId }],
            command: 'INSERT',
            rowCount: 1,
            oid: 0,
            fields: [],
          } as any);

          // Create PIX payment
          const result = await service.createPixPayment(params);

          // Calculate expected values
          const expectedDiscount = (planAmount * discountPercent) / 100;
          const expectedFinalAmount = planAmount - expectedDiscount;

          // Property: Final amount should equal original amount minus discount
          expect(result.finalAmount).toBeCloseTo(expectedFinalAmount, 2);
          expect(result.discount).toBeCloseTo(expectedDiscount, 2);
          expect(result.amount).toBeCloseTo(planAmount, 2);

          // Property: Discount calculation should be consistent
          const calculatedDiscount = result.amount - result.finalAmount;
          expect(calculatedDiscount).toBeCloseTo(result.discount, 2);

          // Property: Discount percentage should match configuration
          const actualDiscountPercent = (result.discount / result.amount) * 100;
          expect(actualDiscountPercent).toBeCloseTo(discountPercent, 1);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property 6: QR Code é único por pagamento
   * Validates: Requirements 3.2, 3.3
   * 
   * For any two different PIX payments, the QR codes generated should be unique.
   */
  it('Property 6: QR Code is unique per payment', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different payment scenarios
        fc.tuple(
          fc.record({
            amount: fc.float({ min: 10, max: 1000, noNaN: true }),
            studentId: fc.uuid(),
            planId: fc.uuid(),
          }),
          fc.record({
            amount: fc.float({ min: 10, max: 1000, noNaN: true }),
            studentId: fc.uuid(),
            planId: fc.uuid(),
          })
        ).filter(([payment1, payment2]) => {
          // Ensure payments are different
          return payment1.studentId !== payment2.studentId ||
                 payment1.planId !== payment2.planId ||
                 Math.abs(payment1.amount - payment2.amount) > 0.01;
        }),
        async ([payment1Data, payment2Data]) => {
          // Mock payment config
          const mockConfig = {
            id: 'test-config-id',
            maxInstallments: 12,
            pixDiscountPercent: 10,
            installmentsWithoutInterest: 12,
            pixExpirationMinutes: 30,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          vi.spyOn(paymentConfigService, 'getConfig').mockResolvedValue(mockConfig);

          // Create unique QR codes for each payment
          let callCount = 0;
          vi.spyOn(service['stripe'].paymentIntents, 'create')
            .mockImplementation(async () => {
              callCount++;
              return {
                id: `pi_test_${callCount}_${Date.now()}`,
                amount: 10000,
                currency: 'brl',
                status: 'requires_action',
                next_action: {
                  type: 'pix_display_qr_code',
                  pix_display_qr_code: {
                    data: `unique-qr-code-${callCount}-${Date.now()}`,
                    image_url_png: `data:image/png;base64,unique-image-${callCount}`,
                  },
                },
              } as any;
            });

          // Mock database inserts
          let insertCount = 0;
          vi.spyOn(pool, 'query').mockImplementation(async () => {
            insertCount++;
            return {
              rows: [{ id: `payment-id-${insertCount}` }],
              command: 'INSERT',
              rowCount: 1,
              oid: 0,
              fields: [],
            } as any;
          });

          // Create first payment
          const params1: CreatePixPaymentParams = {
            studentId: payment1Data.studentId,
            planId: payment1Data.planId,
            studentEmail: 'test1@example.com',
            amount: Math.round(payment1Data.amount * 100) / 100,
          };

          const result1 = await service.createPixPayment(params1);

          // Create second payment
          const params2: CreatePixPaymentParams = {
            studentId: payment2Data.studentId,
            planId: payment2Data.planId,
            studentEmail: 'test2@example.com',
            amount: Math.round(payment2Data.amount * 100) / 100,
          };

          const result2 = await service.createPixPayment(params2);

          // Property: QR codes should be unique
          expect(result1.qrCode).not.toBe(result2.qrCode);
          expect(result1.qrCodeBase64).not.toBe(result2.qrCodeBase64);
          expect(result1.paymentId).not.toBe(result2.paymentId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Polling detecta confirmação de pagamento
   * Validates: Requirements 6.1, 6.2
   * 
   * For any PIX payment, when the status changes from 'pending' to 'paid' in Stripe,
   * the next status check should detect and return the new status.
   */
  it('Property 5: Polling detects payment confirmation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // paymentId
        fc.float({ min: 10, max: 1000, noNaN: true }), // finalAmount
        async (paymentId: string, finalAmount: number) => {
          // Reset all mocks for each iteration
          vi.restoreAllMocks();
          
          finalAmount = Math.round(finalAmount * 100) / 100;

          // Mock database query for initial pending status
          const mockPendingPayment = {
            id: paymentId,
            status: 'pending',
            paidAt: null,
            finalAmount: finalAmount.toString(),
            gatewayChargeId: 'pi_test_123',
          };

          // First call: get pending payment
          // Second call: update to paid
          const querySpy = vi.spyOn(pool, 'query')
            .mockResolvedValueOnce({
              rows: [mockPendingPayment],
              command: 'SELECT',
              rowCount: 1,
              oid: 0,
              fields: [],
            } as any)
            .mockResolvedValueOnce({
              rows: [],
              command: 'UPDATE',
              rowCount: 1,
              oid: 0,
              fields: [],
            } as any);

          // Mock Stripe PaymentIntent as succeeded
          const mockSucceededIntent = {
            id: 'pi_test_123',
            status: 'succeeded',
            amount: Math.round(finalAmount * 100),
            currency: 'brl',
          } as any;

          vi.spyOn(service['stripe'].paymentIntents, 'retrieve')
            .mockResolvedValue(mockSucceededIntent);

          // Check payment status
          const result = await service.checkPixPaymentStatus(paymentId);

          // Property: Status should be updated to 'paid'
          expect(result.status).toBe('paid');
          expect(result.paidAt).toBeInstanceOf(Date);
          expect(result.finalAmount).toBeCloseTo(finalAmount, 2);

          // Property: Database should be updated
          expect(querySpy).toHaveBeenCalledTimes(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Pagamento PIX expira após tempo configurado
   * Validates: Requirements 5.1, 5.2
   * 
   * For any PIX payment that is pending and has passed its expiration time,
   * the expiration job should mark it as expired.
   */
  it('Property 3: PIX payment expires after configured time', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // number of expired payments
        async (numExpiredPayments: number) => {
          // Reset all mocks for each iteration
          vi.restoreAllMocks();
          
          // Create mock expired payments
          const mockExpiredPayments = Array.from({ length: numExpiredPayments }, (_, i) => ({
            id: `expired-payment-${i}`,
            gatewayChargeId: `pi_expired_${i}`,
          }));

          // Mock database query to find expired payments
          const querySpy = vi.spyOn(pool, 'query');
          
          // First call: SELECT expired payments
          querySpy.mockResolvedValueOnce({
            rows: mockExpiredPayments,
            command: 'SELECT',
            rowCount: mockExpiredPayments.length,
            oid: 0,
            fields: [],
          } as any);

          // Subsequent calls: UPDATE each payment to expired + SELECT for email details
          for (let i = 0; i < numExpiredPayments; i++) {
            // UPDATE query
            querySpy.mockResolvedValueOnce({
              rows: [],
              command: 'UPDATE',
              rowCount: 1,
              oid: 0,
              fields: [],
            } as any);
            
            // SELECT query for email details
            querySpy.mockResolvedValueOnce({
              rows: [{
                name: `Student ${i}`,
                email: `student${i}@test.com`,
                plan_name: 'Test Plan',
                plan_id: 'plan-123',
              }],
              command: 'SELECT',
              rowCount: 1,
              oid: 0,
              fields: [],
            } as any);
          }

          // Mock Stripe cancel (may fail, should not stop the process)
          vi.spyOn(service['stripe'].paymentIntents, 'cancel')
            .mockResolvedValue({} as any);

          // Run expiration job
          const expiredCount = await service.expirePendingPayments();

          // Property: All expired payments should be marked as expired
          expect(expiredCount).toBe(numExpiredPayments);

          // Property: Database should be updated for each payment
          // 1 SELECT (find expired) + numExpiredPayments * (1 UPDATE + 1 SELECT for email)
          expect(querySpy).toHaveBeenCalledTimes(1 + (2 * numExpiredPayments));
        }
      ),
      { numRuns: 100 }
    );
  });
});
