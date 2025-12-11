import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { WebhookHandlerService } from './webhook-handler.service';
import { pool } from '../../../config/database';
import { emailQueueService } from '../../notifications/services/email-queue.service';
import Stripe from 'stripe';

/**
 * Property-Based Tests for Webhook Handler Service
 * 
 * Feature: checkout-parcelamento-pix
 * Property 4: Webhook PIX ativa assinatura
 * Validates: Requirements 5.3, 5.4, 5.5
 */

describe('WebhookHandlerService - Property-Based Tests', () => {
  let service: WebhookHandlerService;

  beforeEach(() => {
    vi.restoreAllMocks();
    service = new WebhookHandlerService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 4: Webhook PIX ativa assinatura
   * Validates: Requirements 5.3, 5.4, 5.5
   * 
   * For any PIX payment confirmed via webhook, the student's subscription
   * should be updated to status 'active' with the correct expiration date.
   */
  it('Property 4: PIX webhook activates subscription', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random payment data
        fc.record({
          paymentIntentId: fc.uuid(),
          studentId: fc.uuid(),
          planId: fc.uuid(),
          amount: fc.float({ min: 10, max: 1000, noNaN: true }),
          planName: fc.string({ minLength: 5, maxLength: 50 }),
          planCurrency: fc.constantFrom('BRL', 'USD', 'EUR'),
        }),
        async (paymentData) => {
          // Round amount to 2 decimal places
          const finalAmount = Math.round(paymentData.amount * 100) / 100;

          // Create mock PaymentIntent
          const mockPaymentIntent: Stripe.PaymentIntent = {
            id: paymentData.paymentIntentId,
            object: 'payment_intent',
            amount: Math.round(finalAmount * 100),
            currency: paymentData.planCurrency.toLowerCase(),
            status: 'succeeded',
            payment_method_types: ['pix'],
            created: Math.floor(Date.now() / 1000),
            livemode: false,
          } as any;

          // Mock database client
          const mockClient = {
            query: vi.fn(),
            release: vi.fn(),
          };

          let queryCallCount = 0;
          mockClient.query.mockImplementation(async (query: string, params?: any[]) => {
            queryCallCount++;

            // BEGIN transaction
            if (query === 'BEGIN') {
              return { rows: [], command: 'BEGIN', rowCount: 0, oid: 0, fields: [] };
            }

            // COMMIT transaction
            if (query === 'COMMIT') {
              return { rows: [], command: 'COMMIT', rowCount: 0, oid: 0, fields: [] };
            }

            // ROLLBACK transaction
            if (query === 'ROLLBACK') {
              return { rows: [], command: 'ROLLBACK', rowCount: 0, oid: 0, fields: [] };
            }

            // Find PIX payment
            if (query.includes('SELECT id, student_id, plan_id, final_amount FROM pix_payments')) {
              return {
                rows: [{
                  id: 'pix-payment-id',
                  student_id: paymentData.studentId,
                  plan_id: paymentData.planId,
                  final_amount: finalAmount.toString(),
                }],
                command: 'SELECT',
                rowCount: 1,
                oid: 0,
                fields: [],
              };
            }

            // Check PIX payment status
            if (query.includes('SELECT status FROM pix_payments')) {
              return {
                rows: [{ status: 'pending' }],
                command: 'SELECT',
                rowCount: 1,
                oid: 0,
                fields: [],
              };
            }

            // Update PIX payment to paid
            if (query.includes('UPDATE pix_payments') && query.includes("SET status = 'paid'")) {
              return {
                rows: [],
                command: 'UPDATE',
                rowCount: 1,
                oid: 0,
                fields: [],
              };
            }

            // Get plan details
            if (query.includes('SELECT * FROM plans WHERE id')) {
              return {
                rows: [{
                  id: paymentData.planId,
                  name: paymentData.planName,
                  price: finalAmount.toString(),
                  currency: paymentData.planCurrency,
                  interval: 'month',
                  is_active: true,
                }],
                command: 'SELECT',
                rowCount: 1,
                oid: 0,
                fields: [],
              };
            }

            // Check for existing subscription
            if (query.includes('SELECT id FROM subscriptions WHERE student_id')) {
              return {
                rows: [],
                command: 'SELECT',
                rowCount: 0,
                oid: 0,
                fields: [],
              };
            }

            // Insert new subscription
            if (query.includes('INSERT INTO subscriptions')) {
              return {
                rows: [{ id: 'new-subscription-id' }],
                command: 'INSERT',
                rowCount: 1,
                oid: 0,
                fields: [],
              };
            }

            // Insert payment record
            if (query.includes('INSERT INTO payments')) {
              return {
                rows: [],
                command: 'INSERT',
                rowCount: 1,
                oid: 0,
                fields: [],
              };
            }

            // Update student subscription status
            if (query.includes('UPDATE students')) {
              // Verify the query contains 'active' status
              if (!query.includes("subscription_status = 'active'")) {
                throw new Error('Expected subscription_status to be set to active');
              }
              return {
                rows: [],
                command: 'UPDATE',
                rowCount: 1,
                oid: 0,
                fields: [],
              };
            }

            // Get student details for email
            if (query.includes('SELECT u.name, u.email FROM users')) {
              return {
                rows: [{
                  name: 'Test Student',
                  email: 'student@example.com',
                }],
                command: 'SELECT',
                rowCount: 1,
                oid: 0,
                fields: [],
              };
            }

            return { rows: [], command: 'UNKNOWN', rowCount: 0, oid: 0, fields: [] };
          });

          // Mock pool.connect
          vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as any);

          // Mock pool.query for the final student details query
          vi.spyOn(pool, 'query').mockResolvedValue({
            rows: [{
              name: 'Test Student',
              email: 'student@example.com',
            }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
          } as any);

          // Mock email queue service
          vi.spyOn(emailQueueService, 'enqueueSubscriptionConfirmedEmail')
            .mockResolvedValue(undefined);

          // Process webhook
          await service.handlePixPaymentSucceeded(mockPaymentIntent);

          // Property 1: Transaction should be committed
          const commitCalls = mockClient.query.mock.calls.filter(
            call => call[0] === 'COMMIT'
          );
          expect(commitCalls.length).toBeGreaterThan(0);

          // Property 2: PIX payment status should be updated to 'paid'
          const updatePixCalls = mockClient.query.mock.calls.filter(
            call => typeof call[0] === 'string' && 
                   call[0].includes('UPDATE pix_payments') && 
                   call[0].includes("SET status = 'paid'")
          );
          expect(updatePixCalls.length).toBe(1);

          // Property 3: Subscription should be created or updated to 'active'
          const subscriptionCalls = mockClient.query.mock.calls.filter(
            call => typeof call[0] === 'string' && 
                   (call[0].includes('INSERT INTO subscriptions') || 
                    call[0].includes('UPDATE subscriptions'))
          );
          expect(subscriptionCalls.length).toBeGreaterThan(0);

          // Property 4: Student subscription status should be updated to 'active'
          const updateStudentCalls = mockClient.query.mock.calls.filter(
            call => typeof call[0] === 'string' && 
                   call[0].includes('UPDATE students')
          );
          expect(updateStudentCalls.length).toBe(1);

          // Verify student update includes 'active' status (hardcoded in SQL)
          const studentUpdateCall = updateStudentCalls[0];
          const studentUpdateQuery = studentUpdateCall[0] as string;
          expect(studentUpdateQuery).toContain("subscription_status = 'active'");
          
          // Verify parameters: currentPeriodEnd and studentId
          const studentUpdateParams = studentUpdateCall[1] as any[];
          expect(studentUpdateParams[0]).toBeInstanceOf(Date); // currentPeriodEnd
          expect(studentUpdateParams[1]).toBe(paymentData.studentId); // studentId

          // Property 5: Payment record should be created
          const paymentInsertCalls = mockClient.query.mock.calls.filter(
            call => typeof call[0] === 'string' && 
                   call[0].includes('INSERT INTO payments')
          );
          expect(paymentInsertCalls.length).toBe(1);

          // Property 6: Client should be released
          expect(mockClient.release).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property 4b: Webhook PIX handles already processed payments
   * Validates: Requirements 5.3, 5.4, 5.5
   * 
   * For any PIX payment that has already been processed (status = 'paid'),
   * the webhook should not process it again (idempotency).
   */
  it('Property 4b: PIX webhook is idempotent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // paymentIntentId
        fc.uuid(), // studentId
        async (paymentIntentId, studentId) => {
          // Create mock PaymentIntent
          const mockPaymentIntent: Stripe.PaymentIntent = {
            id: paymentIntentId,
            object: 'payment_intent',
            amount: 10000,
            currency: 'brl',
            status: 'succeeded',
            payment_method_types: ['pix'],
            created: Math.floor(Date.now() / 1000),
            livemode: false,
          } as any;

          // Mock database client
          const mockClient = {
            query: vi.fn(),
            release: vi.fn(),
          };

          mockClient.query.mockImplementation(async (query: string) => {
            if (query === 'BEGIN') {
              return { rows: [], command: 'BEGIN', rowCount: 0, oid: 0, fields: [] };
            }

            if (query === 'COMMIT') {
              return { rows: [], command: 'COMMIT', rowCount: 0, oid: 0, fields: [] };
            }

            // Find PIX payment
            if (query.includes('SELECT id, student_id, plan_id, final_amount FROM pix_payments')) {
              return {
                rows: [{
                  id: 'pix-payment-id',
                  student_id: studentId,
                  plan_id: 'plan-id',
                  final_amount: '100.00',
                }],
                command: 'SELECT',
                rowCount: 1,
                oid: 0,
                fields: [],
              };
            }

            // Check PIX payment status - already paid
            if (query.includes('SELECT status FROM pix_payments')) {
              return {
                rows: [{ status: 'paid' }],
                command: 'SELECT',
                rowCount: 1,
                oid: 0,
                fields: [],
              };
            }

            return { rows: [], command: 'UNKNOWN', rowCount: 0, oid: 0, fields: [] };
          });

          vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as any);

          // Process webhook
          await service.handlePixPaymentSucceeded(mockPaymentIntent);

          // Property: Should commit without processing (idempotent)
          const commitCalls = mockClient.query.mock.calls.filter(
            call => call[0] === 'COMMIT'
          );
          expect(commitCalls.length).toBe(1);

          // Property: Should NOT update PIX payment (already paid)
          const updatePixCalls = mockClient.query.mock.calls.filter(
            call => typeof call[0] === 'string' && 
                   call[0].includes('UPDATE pix_payments')
          );
          expect(updatePixCalls.length).toBe(0);

          // Property: Should NOT create subscription (already processed)
          const subscriptionCalls = mockClient.query.mock.calls.filter(
            call => typeof call[0] === 'string' && 
                   call[0].includes('INSERT INTO subscriptions')
          );
          expect(subscriptionCalls.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4c: Webhook PIX ignores non-PIX payment intents
   * Validates: Requirements 5.3, 5.4, 5.5
   * 
   * For any payment intent that is not a PIX payment,
   * the webhook should skip processing.
   */
  it('Property 4c: PIX webhook ignores non-PIX payments', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // paymentIntentId
        fc.constantFrom('card', 'boleto', 'bank_transfer'), // non-PIX payment methods
        async (paymentIntentId, paymentMethod) => {
          // Create mock non-PIX PaymentIntent
          const mockPaymentIntent: Stripe.PaymentIntent = {
            id: paymentIntentId,
            object: 'payment_intent',
            amount: 10000,
            currency: 'brl',
            status: 'succeeded',
            payment_method_types: [paymentMethod],
            created: Math.floor(Date.now() / 1000),
            livemode: false,
          } as any;

          // Mock database client
          const mockClient = {
            query: vi.fn(),
            release: vi.fn(),
          };

          mockClient.query.mockImplementation(async (query: string) => {
            if (query === 'BEGIN') {
              return { rows: [], command: 'BEGIN', rowCount: 0, oid: 0, fields: [] };
            }

            if (query === 'COMMIT') {
              return { rows: [], command: 'COMMIT', rowCount: 0, oid: 0, fields: [] };
            }

            return { rows: [], command: 'UNKNOWN', rowCount: 0, oid: 0, fields: [] };
          });

          vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as any);

          // Process webhook
          await service.handlePixPaymentSucceeded(mockPaymentIntent);

          // Property: Should commit without processing
          const commitCalls = mockClient.query.mock.calls.filter(
            call => call[0] === 'COMMIT'
          );
          expect(commitCalls.length).toBe(1);

          // Property: Should NOT query for PIX payment
          const pixQueryCalls = mockClient.query.mock.calls.filter(
            call => typeof call[0] === 'string' && 
                   call[0].includes('SELECT id, student_id, plan_id, final_amount FROM pix_payments')
          );
          expect(pixQueryCalls.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
