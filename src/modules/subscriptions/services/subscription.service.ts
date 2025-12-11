import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';
import { paymentGatewayService } from './payment-gateway.service';
import { config } from '@config/env';

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id: string;
  student_id: string;
  plan_id: string;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
  cancelled_at?: Date;
  gateway_subscription_id?: string;
  created_at: Date;
  updated_at: Date;
  plan?: Plan;
}

export interface CreateSubscriptionData {
  studentId: string;
  planId: string;
  studentEmail: string;
}

export class SubscriptionService {
  /**
   * Create a new subscription and redirect to checkout
   */
  async createSubscription(data: CreateSubscriptionData): Promise<{
    checkoutUrl: string;
    sessionId: string;
  }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if student exists
      const studentCheck = await client.query(
        'SELECT id, email FROM users WHERE id = $1 AND role = $2',
        [data.studentId, 'student']
      );

      if (studentCheck.rows.length === 0) {
        throw new Error('STUDENT_NOT_FOUND');
      }

      // Check if plan exists and is active
      const planResult = await client.query(
        'SELECT * FROM plans WHERE id = $1 AND is_active = true',
        [data.planId]
      );

      if (planResult.rows.length === 0) {
        throw new Error('PLAN_NOT_FOUND_OR_INACTIVE');
      }

      const plan = planResult.rows[0];

      // Check if student already has an active subscription
      const activeSubCheck = await client.query(
        'SELECT id FROM subscriptions WHERE student_id = $1 AND status = $2',
        [data.studentId, 'active']
      );

      if (activeSubCheck.rows.length > 0) {
        throw new Error('STUDENT_ALREADY_HAS_ACTIVE_SUBSCRIPTION');
      }

      // Create checkout session with payment gateway
      const checkoutSession = await paymentGatewayService.createCheckoutSession(
        {
          planId: plan.id,
          planName: plan.name,
          planPrice: parseFloat(plan.price),
          currency: plan.currency,
          studentId: data.studentId,
          studentEmail: data.studentEmail,
          successUrl: `${config.apiUrl}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${config.apiUrl}/subscriptions/cancel`,
        }
      );

      // Create pending subscription record
      await client.query(
        `INSERT INTO subscriptions 
         (student_id, plan_id, status, current_period_start, current_period_end, gateway_subscription_id)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 month', $4)`,
        [data.studentId, data.planId, 'pending', checkoutSession.sessionId]
      );

      await client.query('COMMIT');

      logger.info('Subscription checkout created', {
        studentId: data.studentId,
        planId: data.planId,
        sessionId: checkoutSession.sessionId,
      });

      return {
        checkoutUrl: checkoutSession.checkoutUrl,
        sessionId: checkoutSession.sessionId,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create subscription', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get current subscription for a student
   */
  async getCurrentSubscription(
    studentId: string
  ): Promise<Subscription | null> {
    try {
      const result = await pool.query(
        `SELECT s.*, p.name as plan_name, p.price as plan_price, p.currency as plan_currency, p.interval as plan_interval
         FROM subscriptions s
         LEFT JOIN plans p ON s.plan_id = p.id
         WHERE s.student_id = $1
         ORDER BY s.created_at DESC
         LIMIT 1`,
        [studentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        student_id: row.student_id,
        plan_id: row.plan_id,
        status: row.status,
        current_period_start: row.current_period_start,
        current_period_end: row.current_period_end,
        cancelled_at: row.cancelled_at,
        gateway_subscription_id: row.gateway_subscription_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        plan: {
          id: row.plan_id,
          name: row.plan_name,
          price: parseFloat(row.plan_price),
          currency: row.plan_currency,
          interval: row.plan_interval,
          is_active: true,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      };
    } catch (error) {
      logger.error('Failed to get current subscription', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(studentId: string): Promise<Subscription> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get active subscription
      const subResult = await client.query(
        'SELECT * FROM subscriptions WHERE student_id = $1 AND status = $2',
        [studentId, 'active']
      );

      if (subResult.rows.length === 0) {
        throw new Error('NO_ACTIVE_SUBSCRIPTION');
      }

      const subscription = subResult.rows[0];

      // Cancel in payment gateway
      if (subscription.gateway_subscription_id) {
        await paymentGatewayService.cancelSubscription(
          subscription.gateway_subscription_id
        );
      }

      // Update subscription status
      const updateResult = await client.query(
        `UPDATE subscriptions 
         SET status = $1, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        ['cancelled', subscription.id]
      );

      // Update student subscription status
      await client.query(
        `UPDATE students 
         SET subscription_status = $1
         WHERE id = $2`,
        ['cancelled', studentId]
      );

      await client.query('COMMIT');

      logger.info('Subscription cancelled', {
        studentId,
        subscriptionId: subscription.id,
      });

      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to cancel subscription', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(studentId: string): Promise<Subscription> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get cancelled subscription
      const subResult = await client.query(
        'SELECT * FROM subscriptions WHERE student_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
        [studentId, 'cancelled']
      );

      if (subResult.rows.length === 0) {
        throw new Error('NO_CANCELLED_SUBSCRIPTION');
      }

      const subscription = subResult.rows[0];

      // Reactivate in payment gateway
      if (subscription.gateway_subscription_id) {
        await paymentGatewayService.reactivateSubscription(
          subscription.gateway_subscription_id
        );
      }

      // Update subscription status
      const updateResult = await client.query(
        `UPDATE subscriptions 
         SET status = $1, cancelled_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        ['active', subscription.id]
      );

      // Update student subscription status
      await client.query(
        `UPDATE students 
         SET subscription_status = $1, subscription_expires_at = $2
         WHERE id = $3`,
        ['active', subscription.current_period_end, studentId]
      );

      await client.query('COMMIT');

      logger.info('Subscription reactivated', {
        studentId,
        subscriptionId: subscription.id,
      });

      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to reactivate subscription', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all active plans
   */
  async getActivePlans(): Promise<Plan[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM plans WHERE is_active = true ORDER BY price ASC'
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get active plans', error);
      throw error;
    }
  }

  /**
   * Get specific plan by ID
   */
  async getPlanById(planId: string): Promise<Plan | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM plans WHERE id = $1',
        [planId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error: any) {
      // If it's an invalid UUID format, return null instead of throwing
      if (error.code === '22P02') {
        logger.warn(`Invalid UUID format for plan ID: ${planId}`);
        return null;
      }
      
      logger.error('Failed to get plan by ID', error);
      throw error;
    }
  }

  /**
   * Renew an expired or cancelled subscription
   */
  async renewSubscription(data: CreateSubscriptionData): Promise<{
    checkoutUrl: string;
    sessionId: string;
  }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if student exists
      const studentCheck = await client.query(
        'SELECT id, email FROM users WHERE id = $1 AND role = $2',
        [data.studentId, 'student']
      );

      if (studentCheck.rows.length === 0) {
        throw new Error('STUDENT_NOT_FOUND');
      }

      // Check if plan exists and is active
      const planResult = await client.query(
        'SELECT * FROM plans WHERE id = $1 AND is_active = true',
        [data.planId]
      );

      if (planResult.rows.length === 0) {
        throw new Error('PLAN_NOT_FOUND_OR_INACTIVE');
      }

      const plan = planResult.rows[0];

      // Check if student already has an active subscription
      const activeSubCheck = await client.query(
        'SELECT id FROM subscriptions WHERE student_id = $1 AND status = $2',
        [data.studentId, 'active']
      );

      if (activeSubCheck.rows.length > 0) {
        throw new Error('STUDENT_ALREADY_HAS_ACTIVE_SUBSCRIPTION');
      }

      // Create checkout session with payment gateway
      const checkoutSession = await paymentGatewayService.createCheckoutSession(
        {
          planId: plan.id,
          planName: plan.name,
          planPrice: parseFloat(plan.price),
          currency: plan.currency,
          studentId: data.studentId,
          studentEmail: data.studentEmail,
          successUrl: `${config.app.frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${config.app.frontendUrl}/subscription/cancel`,
        }
      );

      // Create pending subscription record
      await client.query(
        `INSERT INTO subscriptions 
         (student_id, plan_id, status, current_period_start, current_period_end, gateway_subscription_id)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 month', $4)`,
        [data.studentId, data.planId, 'pending', checkoutSession.sessionId]
      );

      await client.query('COMMIT');

      logger.info('Subscription renewal checkout created', {
        studentId: data.studentId,
        planId: data.planId,
        sessionId: checkoutSession.sessionId,
      });

      return {
        checkoutUrl: checkoutSession.checkoutUrl,
        sessionId: checkoutSession.sessionId,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to renew subscription', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update subscription status (used by webhook handler)
   */
  async updateSubscriptionStatus(
    gatewaySubscriptionId: string,
    status: string,
    currentPeriodStart: Date,
    currentPeriodEnd: Date
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update subscription
      const subResult = await client.query(
        `UPDATE subscriptions 
         SET status = $1, current_period_start = $2, current_period_end = $3, updated_at = CURRENT_TIMESTAMP
         WHERE gateway_subscription_id = $4
         RETURNING student_id`,
        [status, currentPeriodStart, currentPeriodEnd, gatewaySubscriptionId]
      );

      if (subResult.rows.length === 0) {
        throw new Error('SUBSCRIPTION_NOT_FOUND');
      }

      const studentId = subResult.rows[0].student_id;

      // Update student subscription status
      await client.query(
        `UPDATE students 
         SET subscription_status = $1, subscription_expires_at = $2
         WHERE id = $3`,
        [status, currentPeriodEnd, studentId]
      );

      await client.query('COMMIT');

      logger.info('Subscription status updated', {
        gatewaySubscriptionId,
        status,
        studentId,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to update subscription status', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export const subscriptionService = new SubscriptionService();
