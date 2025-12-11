import Stripe from 'stripe';
import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';
import { subscriptionService } from './subscription.service';
import { emailQueueService } from '@modules/notifications/services/email-queue.service';

// Helper to safely get timestamp from Stripe date fields
function getTimestamp(value: any): number {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return Math.floor(value.getTime() / 1000);
  return Math.floor(new Date(value).getTime() / 1000);
}

export class WebhookHandlerService {
  /**
   * Handle subscription.created event
   */
  async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const studentId = subscription.metadata.studentId;
      const planId = subscription.metadata.planId;

      if (!studentId || !planId) {
        throw new Error('Missing metadata in subscription');
      }

      logger.info('Processing subscription.created event', {
        subscriptionId: subscription.id,
        studentId,
      });

      const currentPeriodStart = getTimestamp((subscription as any).current_period_start);
      const currentPeriodEnd = getTimestamp((subscription as any).current_period_end);

      // Update or create subscription record
      const existingSubResult = await client.query(
        'SELECT id FROM subscriptions WHERE gateway_subscription_id = $1',
        [subscription.id]
      );

      if (existingSubResult.rows.length > 0) {
        // Update existing subscription
        await client.query(
          `UPDATE subscriptions 
           SET status = $1, current_period_start = $2, current_period_end = $3, updated_at = CURRENT_TIMESTAMP
           WHERE gateway_subscription_id = $4`,
          [
            subscription.status,
            new Date(currentPeriodStart * 1000),
            new Date(currentPeriodEnd * 1000),
            subscription.id,
          ]
        );
      } else {
        // Create new subscription
        await client.query(
          `INSERT INTO subscriptions 
           (student_id, plan_id, status, current_period_start, current_period_end, gateway_subscription_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            studentId,
            planId,
            subscription.status,
            new Date(currentPeriodStart * 1000),
            new Date(currentPeriodEnd * 1000),
            subscription.id,
          ]
        );
      }

      // Update student subscription status
      await client.query(
        `UPDATE students 
         SET subscription_status = $1, subscription_expires_at = $2
         WHERE id = $3`,
        [
          subscription.status,
          new Date(currentPeriodEnd * 1000),
          studentId,
        ]
      );

      await client.query('COMMIT');

      logger.info('Subscription created successfully', {
        subscriptionId: subscription.id,
        studentId,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to handle subscription.created', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle invoice.payment_succeeded event
   */
  async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const subscriptionId = typeof (invoice as any).subscription === 'string' 
        ? (invoice as any).subscription 
        : (invoice as any).subscription?.id;

      if (!subscriptionId) {
        logger.warn('Invoice has no subscription', { invoiceId: invoice.id });
        await client.query('COMMIT');
        return;
      }

      logger.info('Processing invoice.payment_succeeded event', {
        invoiceId: invoice.id,
        subscriptionId,
      });

      // Get subscription from database
      const subResult = await client.query(
        'SELECT id, student_id FROM subscriptions WHERE gateway_subscription_id = $1',
        [subscriptionId]
      );

      if (subResult.rows.length === 0) {
        throw new Error('Subscription not found');
      }

      const subscription = subResult.rows[0];

      const paymentIntent = typeof (invoice as any).payment_intent === 'string'
        ? (invoice as any).payment_intent
        : (invoice as any).payment_intent?.id || '';

      const paidAt = (invoice as any).status_transitions?.paid_at
        ? new Date((invoice as any).status_transitions.paid_at * 1000)
        : new Date();

      // Create payment record
      await client.query(
        `INSERT INTO payments 
         (subscription_id, amount, currency, status, gateway_payment_id, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          subscription.id,
          invoice.amount_paid / 100, // Convert from cents
          invoice.currency.toUpperCase(),
          'paid',
          paymentIntent,
          paidAt,
        ]
      );

      // Update subscription status to active
      await client.query(
        `UPDATE subscriptions 
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        ['active', subscription.id]
      );

      // Update student subscription status
      await client.query(
        `UPDATE students 
         SET subscription_status = $1
         WHERE id = $2`,
        ['active', subscription.student_id]
      );

      await client.query('COMMIT');

      logger.info('Payment processed successfully', {
        invoiceId: invoice.id,
        subscriptionId,
      });

      // Get student and plan details for email
      const detailsResult = await pool.query(
        `SELECT u.name, u.email, p.name as plan_name, s.current_period_end
         FROM users u
         INNER JOIN students st ON u.id = st.id
         INNER JOIN subscriptions s ON st.id = s.student_id
         INNER JOIN plans p ON s.plan_id = p.id
         WHERE s.id = $1`,
        [subscription.id]
      );

      if (detailsResult.rows.length > 0) {
        const details = detailsResult.rows[0];
        // Send subscription confirmed email (async, don't wait)
        emailQueueService.enqueueSubscriptionConfirmedEmail({
          studentName: details.name,
          studentEmail: details.email,
          planName: details.plan_name,
          amount: invoice.amount_paid / 100,
          expiresAt: new Date(details.current_period_end),
        }).catch((error) => {
          logger.error('Failed to enqueue subscription confirmed email', error);
        });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to handle invoice.payment_succeeded', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle invoice.payment_failed event
   */
  async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const subscriptionId = typeof (invoice as any).subscription === 'string' 
        ? (invoice as any).subscription 
        : (invoice as any).subscription?.id;

      if (!subscriptionId) {
        logger.warn('Invoice has no subscription', { invoiceId: invoice.id });
        await client.query('COMMIT');
        return;
      }

      logger.info('Processing invoice.payment_failed event', {
        invoiceId: invoice.id,
        subscriptionId,
      });

      // Get subscription from database
      const subResult = await client.query(
        'SELECT id, student_id FROM subscriptions WHERE gateway_subscription_id = $1',
        [subscriptionId]
      );

      if (subResult.rows.length === 0) {
        throw new Error('Subscription not found');
      }

      const subscription = subResult.rows[0];

      const paymentIntent = typeof (invoice as any).payment_intent === 'string'
        ? (invoice as any).payment_intent
        : (invoice as any).payment_intent?.id || '';

      // Create payment record with failed status
      await client.query(
        `INSERT INTO payments 
         (subscription_id, amount, currency, status, gateway_payment_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          subscription.id,
          invoice.amount_due / 100, // Convert from cents
          invoice.currency.toUpperCase(),
          'failed',
          paymentIntent,
        ]
      );

      // Update subscription status to suspended
      await client.query(
        `UPDATE subscriptions 
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        ['suspended', subscription.id]
      );

      // Update student subscription status
      await client.query(
        `UPDATE students 
         SET subscription_status = $1
         WHERE id = $2`,
        ['suspended', subscription.student_id]
      );

      await client.query('COMMIT');

      logger.info('Payment failure processed', {
        invoiceId: invoice.id,
        subscriptionId,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to handle invoice.payment_failed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle customer.subscription.deleted event
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      logger.info('Processing customer.subscription.deleted event', {
        subscriptionId: subscription.id,
      });

      // Get subscription from database
      const subResult = await client.query(
        'SELECT id, student_id FROM subscriptions WHERE gateway_subscription_id = $1',
        [subscription.id]
      );

      if (subResult.rows.length === 0) {
        throw new Error('Subscription not found');
      }

      const dbSubscription = subResult.rows[0];

      // Update subscription status to cancelled
      await client.query(
        `UPDATE subscriptions 
         SET status = $1, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        ['cancelled', dbSubscription.id]
      );

      // Update student subscription status
      await client.query(
        `UPDATE students 
         SET subscription_status = $1
         WHERE id = $2`,
        ['cancelled', dbSubscription.student_id]
      );

      await client.query('COMMIT');

      logger.info('Subscription deletion processed', {
        subscriptionId: subscription.id,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to handle customer.subscription.deleted', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle customer.subscription.updated event
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      logger.info('Processing customer.subscription.updated event', {
        subscriptionId: subscription.id,
      });

      const currentPeriodStart = getTimestamp((subscription as any).current_period_start);
      const currentPeriodEnd = getTimestamp((subscription as any).current_period_end);

      await subscriptionService.updateSubscriptionStatus(
        subscription.id,
        subscription.status,
        new Date(currentPeriodStart * 1000),
        new Date(currentPeriodEnd * 1000)
      );

      logger.info('Subscription update processed', {
        subscriptionId: subscription.id,
      });
    } catch (error) {
      logger.error('Failed to handle customer.subscription.updated', error);
      throw error;
    }
  }

  /**
   * Handle checkout.session.completed event
   * This handles both subscription mode and payment mode (for installments)
   */
  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      logger.info('Processing checkout.session.completed event', {
        sessionId: session.id,
        mode: session.mode,
      });

      const studentId = session.metadata?.studentId;
      const planId = session.metadata?.planId;
      const isSubscriptionPayment = session.metadata?.isSubscriptionPayment === 'true';

      if (!studentId || !planId) {
        throw new Error('Missing metadata in checkout session');
      }

      // If this is a payment mode session (for installments), create subscription manually
      if (session.mode === 'payment' && isSubscriptionPayment) {
        logger.info('Processing one-time payment for subscription (installments)', {
          sessionId: session.id,
          studentId,
          planId,
        });

        // Get plan details
        const planResult = await client.query(
          'SELECT * FROM plans WHERE id = $1',
          [planId]
        );

        if (planResult.rows.length === 0) {
          throw new Error('Plan not found');
        }

        const plan = planResult.rows[0];

        // Calculate subscription period
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration_days);

        // Check if student already has an active subscription
        const existingSubResult = await client.query(
          'SELECT id FROM subscriptions WHERE student_id = $1 AND status = $2',
          [studentId, 'active']
        );

        let subscriptionId: string;

        if (existingSubResult.rows.length > 0) {
          // Extend existing subscription
          const updateResult = await client.query(
            `UPDATE subscriptions
            SET end_date = end_date + INTERVAL '${plan.duration_days} days',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id`,
            [existingSubResult.rows[0].id]
          );
          subscriptionId = updateResult.rows[0].id;
        } else {
          // Create new subscription
          const insertResult = await client.query(
            `INSERT INTO subscriptions
            (student_id, plan_id, status, start_date, end_date, payment_method, amount_paid, gateway_subscription_id)
            VALUES ($1, $2, 'active', $3, $4, 'card', $5, $6)
            RETURNING id`,
            [
              studentId,
              planId,
              startDate,
              endDate,
              session.amount_total ? session.amount_total / 100 : 0,
              `checkout_${session.id}`,
            ]
          );
          subscriptionId = insertResult.rows[0].id;
        }

        // Create payment record
        const installments = session.metadata?.installments ? parseInt(session.metadata.installments) : 1;
        await client.query(
          `INSERT INTO payments
          (subscription_id, amount, status, payment_method, gateway_payment_id, paid_at)
          VALUES ($1, $2, 'completed', 'card', $3, CURRENT_TIMESTAMP)`,
          [
            subscriptionId,
            session.amount_total ? session.amount_total / 100 : 0,
            session.payment_intent as string,
          ]
        );

        await client.query('COMMIT');

        logger.info('Subscription created from one-time payment', {
          sessionId: session.id,
          subscriptionId,
          studentId,
          installments,
        });
      } else if (session.mode === 'subscription') {
        // Regular subscription mode - will be handled by subscription.created event
        logger.info('Subscription mode checkout completed, will be handled by subscription.created', {
          sessionId: session.id,
        });
        await client.query('COMMIT');
      } else {
        logger.warn('Unknown checkout session mode', {
          sessionId: session.id,
          mode: session.mode,
        });
        await client.query('COMMIT');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to handle checkout.session.completed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle payment_intent.succeeded event for PIX payments
   * Requirements: 5.3, 5.4, 5.5
   */
  async handlePixPaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      logger.info('Processing payment_intent.succeeded event for PIX', {
        paymentIntentId: paymentIntent.id,
      });

      // Check if this is a PIX payment
      const paymentMethodTypes = paymentIntent.payment_method_types || [];
      if (!paymentMethodTypes.includes('pix')) {
        logger.info('Payment intent is not PIX, skipping', {
          paymentIntentId: paymentIntent.id,
          paymentMethodTypes,
        });
        await client.query('COMMIT');
        return;
      }

      // Find the PIX payment in our database
      const pixPaymentResult = await client.query(
        'SELECT id, student_id, plan_id, final_amount FROM pix_payments WHERE gateway_charge_id = $1',
        [paymentIntent.id]
      );

      if (pixPaymentResult.rows.length === 0) {
        logger.warn('PIX payment not found in database', {
          paymentIntentId: paymentIntent.id,
        });
        await client.query('COMMIT');
        return;
      }

      const pixPayment = pixPaymentResult.rows[0];

      // Check if already processed
      const statusCheck = await client.query(
        'SELECT status FROM pix_payments WHERE id = $1',
        [pixPayment.id]
      );

      if (statusCheck.rows[0].status === 'paid') {
        logger.info('PIX payment already processed', {
          paymentId: pixPayment.id,
        });
        await client.query('COMMIT');
        return;
      }

      // Update PIX payment status to 'paid'
      await client.query(
        `UPDATE pix_payments
        SET status = 'paid', paid_at = CURRENT_TIMESTAMP, gateway_response = $1
        WHERE id = $2`,
        [JSON.stringify(paymentIntent), pixPayment.id]
      );

      // Get plan details
      const planResult = await client.query(
        'SELECT * FROM plans WHERE id = $1',
        [pixPayment.plan_id]
      );

      if (planResult.rows.length === 0) {
        throw new Error('Plan not found');
      }

      const plan = planResult.rows[0];

      // Calculate subscription period
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      // Create or update subscription
      const existingSubResult = await client.query(
        'SELECT id FROM subscriptions WHERE student_id = $1 AND status IN ($2, $3)',
        [pixPayment.student_id, 'pending', 'expired']
      );

      let subscriptionId: string;

      if (existingSubResult.rows.length > 0) {
        // Update existing subscription
        const updateResult = await client.query(
          `UPDATE subscriptions
          SET status = 'active',
              plan_id = $1,
              current_period_start = $2,
              current_period_end = $3,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING id`,
          [pixPayment.plan_id, currentPeriodStart, currentPeriodEnd, existingSubResult.rows[0].id]
        );
        subscriptionId = updateResult.rows[0].id;
      } else {
        // Create new subscription
        const insertResult = await client.query(
          `INSERT INTO subscriptions
          (student_id, plan_id, status, current_period_start, current_period_end, gateway_subscription_id)
          VALUES ($1, $2, 'active', $3, $4, $5)
          RETURNING id`,
          [pixPayment.student_id, pixPayment.plan_id, currentPeriodStart, currentPeriodEnd, `pix_${pixPayment.id}`]
        );
        subscriptionId = insertResult.rows[0].id;
      }

      // Create payment record
      await client.query(
        `INSERT INTO payments
        (subscription_id, amount, currency, status, gateway_payment_id, paid_at, payment_method, pix_payment_id)
        VALUES ($1, $2, $3, 'paid', $4, CURRENT_TIMESTAMP, 'pix', $5)`,
        [subscriptionId, pixPayment.final_amount, plan.currency, paymentIntent.id, pixPayment.id]
      );

      // Update student subscription status
      await client.query(
        `UPDATE students
        SET subscription_status = 'active', subscription_expires_at = $1
        WHERE id = $2`,
        [currentPeriodEnd, pixPayment.student_id]
      );

      await client.query('COMMIT');

      // Structured log for PIX payment webhook processing
      logger.info('PIX payment processed successfully via webhook', {
        event: 'pix_webhook_processed',
        paymentId: pixPayment.id,
        studentId: pixPayment.student_id,
        subscriptionId,
        finalAmount: pixPayment.final_amount,
        paymentIntentId: paymentIntent.id,
        timestamp: new Date().toISOString(),
      });

      // Get student details for email
      const studentResult = await pool.query(
        'SELECT u.name, u.email FROM users u WHERE u.id = $1',
        [pixPayment.student_id]
      );

      if (studentResult.rows.length > 0) {
        const student = studentResult.rows[0];
        
        // Send PIX payment confirmed email (async, don't wait)
        const { notificationService } = await import('@modules/notifications/services/notification.service');
        notificationService.sendPixPaymentConfirmedEmail({
          studentName: student.name,
          studentEmail: student.email,
          planName: plan.name,
          finalAmount: parseFloat(pixPayment.final_amount),
          expiresAt: currentPeriodEnd,
        }).catch((error) => {
          logger.error('Failed to send PIX payment confirmed email', error);
        });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Structured log for webhook error
      logger.error('Failed to handle PIX payment_intent.succeeded webhook', error, {
        event: 'pix_webhook_error',
        paymentIntentId: paymentIntent.id,
        timestamp: new Date().toISOString(),
      });
      
      throw error;
    } finally {
      client.release();
    }
  }
}

export const webhookHandlerService = new WebhookHandlerService();
