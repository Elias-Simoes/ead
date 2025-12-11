import Stripe from 'stripe';
import { pool } from '@config/database';
import { config } from '@config/env';
import { logger } from '@shared/utils/logger';
import { paymentConfigService } from './payment-config.service';
import { notificationService } from '@modules/notifications/services/notification.service';

export interface CreatePixPaymentParams {
  studentId: string;
  planId: string;
  studentEmail: string;
  amount: number;
}

export interface PixPaymentResult {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  copyPasteCode: string;
  expiresAt: Date;
  amount: number;
  discount: number;
  finalAmount: number;
}

export interface PixPaymentStatus {
  id: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  paidAt: Date | null;
  finalAmount: number;
}

/**
 * PIX Payment Service
 * Handles PIX payment creation, status checking, and expiration
 */
export class PixPaymentService {
  private stripe: Stripe;

  constructor() {
    if (!config.payment.stripe.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(config.payment.stripe.secretKey, {
      apiVersion: '2025-10-29.clover',
    });
  }

  /**
   * Create a PIX payment with discount
   * Requirements: 3.1, 3.2, 3.3, 5.1
   */
  async createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
    try {
      logger.info('Creating PIX payment', {
        studentId: params.studentId,
        planId: params.planId,
        amount: params.amount,
      });

      // Get payment configuration for discount and expiration
      const paymentConfig = await paymentConfigService.getConfig();

      // Calculate discount based on configuration
      const discount = (params.amount * paymentConfig.pixDiscountPercent) / 100;
      const finalAmount = params.amount - discount;

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + paymentConfig.pixExpirationMinutes);

      // Check if we're in development/test mode and PIX is not available
      const isDevelopment = config.nodeEnv !== 'production';
      let paymentIntent: any;
      let qrCode: string;
      let qrCodeBase64: string;

      try {
        // Try to create PaymentIntent with PIX method
        paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(finalAmount * 100), // Convert to cents
          currency: 'brl',
          payment_method_types: ['pix'],
          metadata: {
            studentId: params.studentId,
            planId: params.planId,
            originalAmount: params.amount.toString(),
            discount: discount.toString(),
            finalAmount: finalAmount.toString(),
          },
          description: `Assinatura - Plano ${params.planId}`,
        });

        // Extract PIX data from payment intent
        if (!paymentIntent.next_action?.pix_display_qr_code) {
          throw new Error('PIX_QR_CODE_NOT_GENERATED');
        }

        const pixData = paymentIntent.next_action.pix_display_qr_code;
        qrCode = pixData.data || '';
        qrCodeBase64 = pixData.image_url_png || '';
      } catch (stripeError: any) {
        // If PIX is not available in Stripe (common in dev/test), create a mock payment
        if (isDevelopment && stripeError.message?.includes('pix')) {
          logger.warn('PIX not available in Stripe, creating mock payment for development', {
            studentId: params.studentId,
            planId: params.planId,
          });

          // Generate a mock payment intent ID
          const mockPaymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          
          // Generate mock PIX code (simplified for testing)
          const mockPixCode = `00020126580014br.gov.bcb.pix0136${mockPaymentIntentId}520400005303986540${finalAmount.toFixed(2)}5802BR5925PLATAFORMA EAD TESTE6009SAO PAULO62070503***6304`;
          
          // Generate a QR code image URL using a QR code API service
          const qrCodeData = encodeURIComponent(mockPixCode);
          const mockQRCodeBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrCodeData}`;

          paymentIntent = {
            id: mockPaymentIntentId,
            status: 'requires_action',
            amount: Math.round(finalAmount * 100),
            currency: 'brl',
            metadata: {
              studentId: params.studentId,
              planId: params.planId,
              originalAmount: params.amount.toString(),
              discount: discount.toString(),
              finalAmount: finalAmount.toString(),
              mock: 'true',
            },
          };

          qrCode = mockPixCode;
          qrCodeBase64 = mockQRCodeBase64;

          logger.info('Mock PIX payment created for development', {
            paymentIntentId: mockPaymentIntentId,
            studentId: params.studentId,
          });
        } else {
          throw stripeError;
        }
      }

      // Save to pix_payments table
      const result = await pool.query(
        `INSERT INTO pix_payments (
          student_id,
          plan_id,
          amount,
          discount,
          final_amount,
          qr_code,
          copy_paste_code,
          status,
          expires_at,
          gateway_charge_id,
          gateway_response
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          params.studentId,
          params.planId,
          params.amount,
          discount,
          finalAmount,
          qrCode,
          qrCode, // copy_paste_code is the same as qr_code for PIX
          'pending',
          expiresAt,
          paymentIntent.id,
          JSON.stringify(paymentIntent),
        ]
      );

      const paymentId = result.rows[0].id;

      // Structured log for PIX payment creation
      logger.info('PIX payment created successfully', {
        event: 'pix_payment_created',
        paymentId,
        studentId: params.studentId,
        planId: params.planId,
        amount: params.amount,
        discount,
        finalAmount,
        expiresAt: expiresAt.toISOString(),
        gatewayChargeId: paymentIntent.id,
        timestamp: new Date().toISOString(),
      });

      // Get student and plan details for email
      const studentResult = await pool.query(
        'SELECT name, email FROM users WHERE id = $1',
        [params.studentId]
      );

      const planResult = await pool.query(
        'SELECT name FROM plans WHERE id = $1',
        [params.planId]
      );

      // Send pending payment email
      if (studentResult.rows.length > 0 && planResult.rows.length > 0) {
        try {
          await notificationService.sendPixPaymentPendingEmail({
            studentName: studentResult.rows[0].name,
            studentEmail: studentResult.rows[0].email,
            planName: planResult.rows[0].name,
            amount: params.amount,
            discount,
            finalAmount,
            copyPasteCode: qrCode,
            expiresAt,
            paymentId,
          });

          logger.info('PIX payment pending email sent', { paymentId });
        } catch (emailError) {
          // Log error but don't fail the payment creation
          logger.error('Failed to send PIX payment pending email', {
            paymentId,
            error: emailError,
          });
        }
      }

      return {
        paymentId,
        qrCode,
        qrCodeBase64,
        copyPasteCode: qrCode,
        expiresAt,
        amount: params.amount,
        discount,
        finalAmount,
      };
    } catch (error) {
      logger.error('Failed to create PIX payment', error);
      throw new Error('PIX_PAYMENT_CREATION_FAILED');
    }
  }

  /**
   * Check PIX payment status
   * Requirements: 6.1, 6.3
   */
  async checkPixPaymentStatus(paymentId: string): Promise<PixPaymentStatus> {
    try {
      logger.info('Checking PIX payment status', { paymentId });

      // Get payment from database
      const result = await pool.query(
        `SELECT 
          id,
          status,
          paid_at as "paidAt",
          final_amount as "finalAmount",
          gateway_charge_id as "gatewayChargeId"
        FROM pix_payments
        WHERE id = $1`,
        [paymentId]
      );

      if (result.rows.length === 0) {
        throw new Error('PIX_PAYMENT_NOT_FOUND');
      }

      const payment = result.rows[0];

      // If already paid or expired, return current status
      if (payment.status === 'paid' || payment.status === 'expired' || payment.status === 'cancelled') {
        return {
          id: payment.id,
          status: payment.status,
          paidAt: payment.paidAt,
          finalAmount: parseFloat(payment.finalAmount),
        };
      }

      // Check status in Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(payment.gatewayChargeId);

      // Update status if changed
      if (paymentIntent.status === 'succeeded' && payment.status !== 'paid') {
        await pool.query(
          `UPDATE pix_payments
          SET status = 'paid', paid_at = CURRENT_TIMESTAMP, gateway_response = $1
          WHERE id = $2`,
          [JSON.stringify(paymentIntent), paymentId]
        );

        // Structured log for PIX payment confirmation
        logger.info('PIX payment confirmed', {
          event: 'pix_payment_confirmed',
          paymentId,
          gatewayChargeId: payment.gatewayChargeId,
          finalAmount: parseFloat(payment.finalAmount),
          confirmedAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        });

        return {
          id: payment.id,
          status: 'paid',
          paidAt: new Date(),
          finalAmount: parseFloat(payment.finalAmount),
        };
      }

      // Return current status
      return {
        id: payment.id,
        status: payment.status,
        paidAt: payment.paidAt,
        finalAmount: parseFloat(payment.finalAmount),
      };
    } catch (error) {
      logger.error('Failed to check PIX payment status', error);
      throw error;
    }
  }

  /**
   * Expire pending PIX payments that have passed their expiration time
   * Requirements: 5.2, 6.3
   */
  async expirePendingPayments(): Promise<number> {
    try {
      logger.info('Running PIX payment expiration job');

      // Find pending payments that have expired
      const result = await pool.query(
        `SELECT id, gateway_charge_id as "gatewayChargeId"
        FROM pix_payments
        WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP`
      );

      const expiredPayments = result.rows;
      let expiredCount = 0;

      for (const payment of expiredPayments) {
        try {
          // Cancel in Stripe if possible
          try {
            await this.stripe.paymentIntents.cancel(payment.gatewayChargeId);
          } catch (stripeError) {
            // Log but don't fail if Stripe cancellation fails
            logger.warn('Failed to cancel payment intent in Stripe', {
              paymentId: payment.id,
              error: stripeError,
            });
          }

          // Mark as expired in database
          await pool.query(
            `UPDATE pix_payments
            SET status = 'expired'
            WHERE id = $1`,
            [payment.id]
          );

          expiredCount++;
          
          // Structured log for PIX payment expiration
          logger.info('PIX payment expired', {
            event: 'pix_payment_expired',
            paymentId: payment.id,
            gatewayChargeId: payment.gatewayChargeId,
            expiredAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
          });

          // Get student and plan details for email
          const detailsResult = await pool.query(
            `SELECT u.name, u.email, p.name as plan_name, pp.plan_id
             FROM pix_payments pp
             INNER JOIN users u ON pp.student_id = u.id
             INNER JOIN plans p ON pp.plan_id = p.id
             WHERE pp.id = $1`,
            [payment.id]
          );

          if (detailsResult.rows.length > 0) {
            const details = detailsResult.rows[0];
            
            // Send expired payment email (async, don't wait)
            notificationService.sendPixPaymentExpiredEmail({
              studentName: details.name,
              studentEmail: details.email,
              planName: details.plan_name,
              planId: details.plan_id,
            }).catch((emailError) => {
              logger.error('Failed to send PIX payment expired email', {
                paymentId: payment.id,
                error: emailError,
              });
            });
          }
        } catch (error) {
          logger.error('Failed to expire PIX payment', {
            paymentId: payment.id,
            error,
          });
        }
      }

      logger.info('PIX payment expiration job completed', {
        expiredCount,
        totalChecked: expiredPayments.length,
      });

      return expiredCount;
    } catch (error) {
      logger.error('Failed to run PIX payment expiration job', error);
      throw error;
    }
  }
}

export const pixPaymentService = new PixPaymentService();
