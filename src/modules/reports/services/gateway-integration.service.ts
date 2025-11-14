import Stripe from 'stripe';
import { config } from '@config/env';
import { logger } from '@shared/utils/logger';
import { pool } from '@config/database';

export interface GatewayFinancialData {
  totalPaymentsFromGateway: number;
  totalRevenueFromGateway: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  averageTransactionValue: number;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;
}

export interface ConsolidatedFinancialMetrics {
  localData: {
    totalRevenue: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
  };
  gatewayData: GatewayFinancialData;
  consolidated: {
    totalRevenue: number;
    averageRevenuePerSubscriber: number;
    paymentSuccessRate: number;
    refundRate: number;
  };
}

export class GatewayIntegrationService {
  private stripe: Stripe;

  constructor() {
    if (!config.payment.stripe.secretKey) {
      logger.warn('Stripe secret key not configured, gateway integration disabled');
      this.stripe = null as any;
    } else {
      this.stripe = new Stripe(config.payment.stripe.secretKey, {
        apiVersion: '2025-10-29.clover',
      });
    }
  }

  /**
   * Fetch financial data from payment gateway
   */
  async getGatewayFinancialData(
    startDate: Date,
    endDate: Date
  ): Promise<GatewayFinancialData> {
    try {
      if (!this.stripe) {
        logger.warn('Stripe not configured, returning empty gateway data');
        return this.getEmptyGatewayData();
      }

      logger.info('Fetching financial data from Stripe', { startDate, endDate });

      // Convert dates to Unix timestamps
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);

      // Fetch charges (payments) from Stripe
      const charges = await this.fetchAllCharges(startTimestamp, endTimestamp);

      // Calculate metrics
      const totalPayments = charges.length;
      const successfulCharges = charges.filter((c) => c.status === 'succeeded');
      const failedCharges = charges.filter((c) => c.status === 'failed');
      const refundedCharges = charges.filter((c) => c.refunded);

      const totalRevenue = successfulCharges.reduce(
        (sum, c) => sum + c.amount,
        0
      ) / 100; // Convert from cents

      const averageTransactionValue =
        successfulCharges.length > 0
          ? totalRevenue / successfulCharges.length
          : 0;

      // Payment method breakdown
      const paymentMethodMap = new Map<string, { count: number; revenue: number }>();
      
      successfulCharges.forEach((charge) => {
        const method = charge.payment_method_details?.type || 'unknown';
        const existing = paymentMethodMap.get(method) || { count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += charge.amount / 100;
        paymentMethodMap.set(method, existing);
      });

      const paymentMethodBreakdown = Array.from(paymentMethodMap.entries()).map(
        ([method, data]) => ({
          method,
          count: data.count,
          revenue: data.revenue,
        })
      );

      return {
        totalPaymentsFromGateway: totalPayments,
        totalRevenueFromGateway: totalRevenue,
        successfulPayments: successfulCharges.length,
        failedPayments: failedCharges.length,
        refundedPayments: refundedCharges.length,
        averageTransactionValue: parseFloat(averageTransactionValue.toFixed(2)),
        paymentMethodBreakdown,
      };
    } catch (error) {
      logger.error('Failed to fetch gateway financial data', error);
      // Return empty data instead of throwing to allow reports to continue
      return this.getEmptyGatewayData();
    }
  }

  /**
   * Fetch all charges from Stripe (handles pagination)
   */
  private async fetchAllCharges(
    startTimestamp: number,
    endTimestamp: number
  ): Promise<Stripe.Charge[]> {
    const allCharges: Stripe.Charge[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: Stripe.ChargeListParams = {
        limit: 100,
        created: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
      };

      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const charges = await this.stripe.charges.list(params);
      allCharges.push(...charges.data);

      hasMore = charges.has_more;
      if (hasMore && charges.data.length > 0) {
        startingAfter = charges.data[charges.data.length - 1].id;
      }
    }

    return allCharges;
  }

  /**
   * Get local payment data from database
   */
  private async getLocalFinancialData(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenue: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
  }> {
    try {
      const result = await pool.query(
        `
        SELECT 
          COUNT(*) as total_payments,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful_payments,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue
        FROM payments
        WHERE created_at >= $1 AND created_at <= $2
      `,
        [startDate, endDate]
      );

      const row = result.rows[0];

      return {
        totalRevenue: parseFloat(row.total_revenue),
        totalPayments: parseInt(row.total_payments),
        successfulPayments: parseInt(row.successful_payments),
        failedPayments: parseInt(row.failed_payments),
      };
    } catch (error) {
      logger.error('Failed to fetch local financial data', error);
      throw error;
    }
  }

  /**
   * Consolidate local and gateway financial data
   */
  async getConsolidatedFinancialMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<ConsolidatedFinancialMetrics> {
    try {
      logger.info('Consolidating financial metrics', { startDate, endDate });

      // Fetch data from both sources
      const [localData, gatewayData] = await Promise.all([
        this.getLocalFinancialData(startDate, endDate),
        this.getGatewayFinancialData(startDate, endDate),
      ]);

      // Use gateway data as source of truth if available, otherwise use local data
      const totalRevenue = gatewayData.totalRevenueFromGateway > 0
        ? gatewayData.totalRevenueFromGateway
        : localData.totalRevenue;

      const totalPayments = gatewayData.totalPaymentsFromGateway > 0
        ? gatewayData.totalPaymentsFromGateway
        : localData.totalPayments;

      const successfulPayments = gatewayData.successfulPayments > 0
        ? gatewayData.successfulPayments
        : localData.successfulPayments;

      // Calculate consolidated metrics
      const paymentSuccessRate =
        totalPayments > 0
          ? (successfulPayments / totalPayments) * 100
          : 0;

      const refundRate =
        successfulPayments > 0
          ? (gatewayData.refundedPayments / successfulPayments) * 100
          : 0;

      // Get active subscribers count
      const subscribersResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE status = 'active'
      `);

      const activeSubscribers = parseInt(subscribersResult.rows[0].count);
      const averageRevenuePerSubscriber =
        activeSubscribers > 0 ? totalRevenue / activeSubscribers : 0;

      return {
        localData,
        gatewayData,
        consolidated: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          averageRevenuePerSubscriber: parseFloat(
            averageRevenuePerSubscriber.toFixed(2)
          ),
          paymentSuccessRate: parseFloat(paymentSuccessRate.toFixed(2)),
          refundRate: parseFloat(refundRate.toFixed(2)),
        },
      };
    } catch (error) {
      logger.error('Failed to consolidate financial metrics', error);
      throw error;
    }
  }

  /**
   * Return empty gateway data structure
   */
  private getEmptyGatewayData(): GatewayFinancialData {
    return {
      totalPaymentsFromGateway: 0,
      totalRevenueFromGateway: 0,
      successfulPayments: 0,
      failedPayments: 0,
      refundedPayments: 0,
      averageTransactionValue: 0,
      paymentMethodBreakdown: [],
    };
  }
}

export const gatewayIntegrationService = new GatewayIntegrationService();
