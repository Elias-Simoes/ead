import Stripe from 'stripe';
import { config } from '@config/env';
import { logger } from '@shared/utils/logger';

export interface CheckoutSessionData {
  planId: string;
  planName: string;
  planPrice: number;
  currency: string;
  studentId: string;
  studentEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

export interface SubscriptionData {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionResult {
  subscriptionId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export class PaymentGatewayService {
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
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    data: CheckoutSessionData
  ): Promise<CheckoutSessionResult> {
    try {
      logger.info('Creating Stripe checkout session', {
        studentId: data.studentId,
        planId: data.planId,
      });

      // Create or retrieve customer
      const customer = await this.getOrCreateCustomer(
        data.studentEmail,
        data.studentId
      );

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        customer: customer.id,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: data.currency.toLowerCase(),
              product_data: {
                name: data.planName,
              },
              recurring: {
                interval: 'month',
              },
              unit_amount: Math.round(data.planPrice * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          studentId: data.studentId,
          planId: data.planId,
        },
        subscription_data: {
          metadata: {
            studentId: data.studentId,
            planId: data.planId,
          },
        },
      });

      logger.info('Checkout session created successfully', {
        sessionId: session.id,
        studentId: data.studentId,
      });

      return {
        sessionId: session.id,
        checkoutUrl: session.url || '',
      };
    } catch (error) {
      logger.error('Failed to create checkout session', error);
      throw new Error('CHECKOUT_SESSION_CREATION_FAILED');
    }
  }

  /**
   * Create a subscription directly (without checkout)
   */
  async createSubscription(
    data: SubscriptionData
  ): Promise<SubscriptionResult> {
    try {
      logger.info('Creating Stripe subscription', {
        customerId: data.customerId,
      });

      const subscription = await this.stripe.subscriptions.create({
        customer: data.customerId,
        items: [{ price: data.priceId }],
        metadata: data.metadata,
      });

      logger.info('Subscription created successfully', {
        subscriptionId: subscription.id,
      });

      const currentPeriodStart = (subscription as any).current_period_start;
      const currentPeriodEnd = (subscription as any).current_period_end;

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(currentPeriodStart * 1000),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      };
    } catch (error) {
      logger.error('Failed to create subscription', error);
      throw new Error('SUBSCRIPTION_CREATION_FAILED');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      logger.info('Cancelling Stripe subscription', { subscriptionId });

      await this.stripe.subscriptions.cancel(subscriptionId);

      logger.info('Subscription cancelled successfully', { subscriptionId });
    } catch (error) {
      logger.error('Failed to cancel subscription', error);
      throw new Error('SUBSCRIPTION_CANCELLATION_FAILED');
    }
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<void> {
    try {
      logger.info('Reactivating Stripe subscription', { subscriptionId });

      await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      logger.info('Subscription reactivated successfully', { subscriptionId });
    } catch (error) {
      logger.error('Failed to reactivate subscription', error);
      throw new Error('SUBSCRIPTION_REACTIVATION_FAILED');
    }
  }

  /**
   * Get or create a Stripe customer
   */
  private async getOrCreateCustomer(
    email: string,
    studentId: string
  ): Promise<Stripe.Customer> {
    try {
      // Search for existing customer
      const customers = await this.stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return customers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: email,
        metadata: {
          studentId: studentId,
        },
      });

      return customer;
    } catch (error) {
      logger.error('Failed to get or create customer', error);
      throw new Error('CUSTOMER_CREATION_FAILED');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.payment.stripe.webhookSecret
      );

      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed', error);
      throw new Error('INVALID_WEBHOOK_SIGNATURE');
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      const currentPeriodStart = (subscription as any).current_period_start;
      const currentPeriodEnd = (subscription as any).current_period_end;

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(currentPeriodStart * 1000),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      };
    } catch (error) {
      logger.error('Failed to retrieve subscription', error);
      throw new Error('SUBSCRIPTION_RETRIEVAL_FAILED');
    }
  }
}

export const paymentGatewayService = new PaymentGatewayService();
