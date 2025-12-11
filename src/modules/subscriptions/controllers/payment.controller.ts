import { Request, Response } from 'express';
import { logger } from '@shared/utils/logger';
import { paymentGatewayService } from '../services/payment-gateway.service';
import { pixPaymentService } from '../services/pix-payment.service';
import { paymentConfigService } from '../services/payment-config.service';
import { pool } from '@config/database';
import { config } from '@config/env';

export class PaymentController {
  /**
   * GET /api/payments/pix/:paymentId/status
   * Get PIX payment status
   * Requirements: 6.1, 6.2
   */
  async getPixPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const studentId = req.user!.userId;

      // Validate that payment belongs to the user
      const paymentCheck = await pool.query(
        'SELECT id, student_id FROM pix_payments WHERE id = $1',
        [paymentId]
      );

      if (paymentCheck.rows.length === 0) {
        res.status(404).json({
          error: {
            code: 'PIX_PAYMENT_NOT_FOUND',
            message: 'PIX payment not found',
          },
        });
        return;
      }

      const payment = paymentCheck.rows[0];

      if (payment.student_id !== studentId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this payment',
          },
        });
        return;
      }

      // Get updated status
      const status = await pixPaymentService.checkPixPaymentStatus(paymentId);

      logger.info('PIX payment status retrieved', {
        paymentId,
        studentId,
        status: status.status,
      });

      res.json({
        id: status.id,
        status: status.status,
        paidAt: status.paidAt,
        finalAmount: status.finalAmount,
      });
    } catch (error: any) {
      logger.error('Error getting PIX payment status', error);

      if (error.message === 'PIX_PAYMENT_NOT_FOUND') {
        res.status(404).json({
          error: {
            code: 'PIX_PAYMENT_NOT_FOUND',
            message: 'PIX payment not found',
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'PIX_STATUS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve PIX payment status',
        },
      });
    }
  }

  /**
   * POST /api/payments/checkout
   * Create a checkout session with payment method selection (card or PIX)
   * Requirements: 1.2, 2.1, 3.1
   */
  async createCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { planId, paymentMethod, installments } = req.body;
      const studentId = req.user!.userId;
      const { email } = req.user!;

      // Validate required fields
      if (!planId) {
        res.status(400).json({
          error: {
            code: 'MISSING_PLAN_ID',
            message: 'Plan ID is required',
          },
        });
        return;
      }

      if (!paymentMethod || !['card', 'pix'].includes(paymentMethod)) {
        res.status(400).json({
          error: {
            code: 'INVALID_PAYMENT_METHOD',
            message: 'Payment method must be either "card" or "pix"',
          },
        });
        return;
      }

      // Get payment configuration
      const paymentConfig = await paymentConfigService.getConfig();

      // Validate installments for card payments
      if (paymentMethod === 'card' && installments) {
        if (installments < 1 || installments > paymentConfig.maxInstallments) {
          res.status(400).json({
            error: {
              code: 'INVALID_INSTALLMENTS',
              message: `Installments must be between 1 and ${paymentConfig.maxInstallments}`,
            },
          });
          return;
        }
      }

      // Check if student exists
      const studentCheck = await pool.query(
        'SELECT id, email FROM users WHERE id = $1 AND role = $2',
        [studentId, 'student']
      );

      if (studentCheck.rows.length === 0) {
        res.status(404).json({
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'Student not found',
          },
        });
        return;
      }

      // Check if plan exists and is active
      const planResult = await pool.query(
        'SELECT * FROM plans WHERE id = $1 AND is_active = true',
        [planId]
      );

      if (planResult.rows.length === 0) {
        res.status(404).json({
          error: {
            code: 'PLAN_NOT_FOUND',
            message: 'Plan not found or inactive',
          },
        });
        return;
      }

      const plan = planResult.rows[0];

      // Check if student already has an active subscription
      const activeSubCheck = await pool.query(
        'SELECT id FROM subscriptions WHERE student_id = $1 AND status = $2',
        [studentId, 'active']
      );

      if (activeSubCheck.rows.length > 0) {
        res.status(409).json({
          error: {
            code: 'ALREADY_SUBSCRIBED',
            message: 'Student already has an active subscription',
          },
        });
        return;
      }

      // Route to appropriate payment method
      if (paymentMethod === 'pix') {
        // Create PIX payment
        const pixPayment = await pixPaymentService.createPixPayment({
          studentId,
          planId,
          studentEmail: email,
          amount: parseFloat(plan.price),
        });

        logger.info('PIX payment created for checkout', {
          studentId,
          planId,
          paymentId: pixPayment.paymentId,
        });

        res.status(201).json({
          data: {
            paymentMethod: 'pix',
            paymentId: pixPayment.paymentId,
            qrCode: pixPayment.qrCode,
            qrCodeBase64: pixPayment.qrCodeBase64,
            copyPasteCode: pixPayment.copyPasteCode,
            expiresAt: pixPayment.expiresAt,
            amount: pixPayment.amount,
            discount: pixPayment.discount,
            finalAmount: pixPayment.finalAmount,
          },
        });
      } else {
        // Create Stripe checkout session with installments
        const checkoutSession = await paymentGatewayService.createCheckoutWithPaymentOptions({
          planId: plan.id,
          planName: plan.name,
          planPrice: parseFloat(plan.price),
          currency: plan.currency,
          studentId,
          studentEmail: email,
          successUrl: `${config.app.frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${config.app.frontendUrl}/subscription/cancel`,
          paymentMethod: 'card',
          installments: installments || 1,
        });

        logger.info('Card checkout session created', {
          studentId,
          planId,
          sessionId: checkoutSession.sessionId,
          installments: installments || 1,
        });

        res.status(201).json({
          paymentMethod: 'card',
          checkoutUrl: checkoutSession.checkoutUrl,
          sessionId: checkoutSession.sessionId,
          installments: installments || 1,
        });
      }
    } catch (error: any) {
      logger.error('Error creating checkout', error);

      res.status(500).json({
        error: {
          code: 'CHECKOUT_CREATION_FAILED',
          message: 'Failed to create checkout',
        },
      });
    }
  }
}

export const paymentController = new PaymentController();
