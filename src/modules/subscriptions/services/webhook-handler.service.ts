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
}

export const webhookHandlerService = new WebhookHandlerService();
