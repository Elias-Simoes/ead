import { Request, Response } from 'express';
import { paymentGatewayService } from '../services/payment-gateway.service';
import { webhookHandlerService } from '../services/webhook-handler.service';
import { logger } from '@shared/utils/logger';
import Stripe from 'stripe';

export class WebhookController {
  /**
   * POST /api/webhooks/payment
   * Handle Stripe webhook events
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        res.status(400).json({
          error: {
            code: 'MISSING_SIGNATURE',
            message: 'Missing Stripe signature',
          },
        });
        return;
      }

      // Verify webhook signature
      const event = paymentGatewayService.verifyWebhookSignature(
        req.body,
        signature
      );

      logger.info('Webhook event received', {
        type: event.type,
        id: event.id,
      });

      // Handle different event types
      switch (event.type) {
        case 'customer.subscription.created':
          await webhookHandlerService.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription
          );
          break;

        case 'customer.subscription.updated':
          await webhookHandlerService.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription
          );
          break;

        case 'customer.subscription.deleted':
          await webhookHandlerService.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
          );
          break;

        case 'invoice.payment_succeeded':
          await webhookHandlerService.handlePaymentSucceeded(
            event.data.object as Stripe.Invoice
          );
          break;

        case 'invoice.payment_failed':
          await webhookHandlerService.handlePaymentFailed(
            event.data.object as Stripe.Invoice
          );
          break;

        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }

      res.json({ received: true });
    } catch (error: any) {
      logger.error('Webhook processing failed', error);

      if (error.message === 'INVALID_WEBHOOK_SIGNATURE') {
        res.status(400).json({
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Invalid webhook signature',
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: 'Failed to process webhook',
        },
      });
    }
  }
}

export const webhookController = new WebhookController();
