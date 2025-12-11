import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

export interface PaymentMetrics {
  conversionRateByMethod: {
    card: {
      total: number;
      successful: number;
      rate: number;
    };
    pix: {
      total: number;
      successful: number;
      rate: number;
    };
  };
  installmentDistribution: {
    [key: number]: number;
  };
  pixMetrics: {
    averageConfirmationTime: number; // in seconds
    expirationRate: number;
    averageDiscount: number;
  };
  totalRevenue: {
    card: number;
    pix: number;
    total: number;
  };
  period: {
    start: Date;
    end: Date;
  };
}

export interface PaymentMethodStats {
  method: 'card' | 'pix';
  count: number;
  totalAmount: number;
  averageAmount: number;
}

/**
 * Payment Metrics Service
 * Tracks and calculates payment-related metrics for dashboard
 * Requirements: 7.5
 */
export class PaymentMetricsService {
  /**
   * Get comprehensive payment metrics for a time period
   */
  async getPaymentMetrics(startDate: Date, endDate: Date): Promise<PaymentMetrics> {
    try {
      logger.info('Calculating payment metrics', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const [
        conversionRates,
        installmentDist,
        pixMetrics,
        revenue,
      ] = await Promise.all([
        this.getConversionRateByMethod(startDate, endDate),
        this.getInstallmentDistribution(startDate, endDate),
        this.getPixMetrics(startDate, endDate),
        this.getRevenueByMethod(startDate, endDate),
      ]);

      const metrics: PaymentMetrics = {
        conversionRateByMethod: conversionRates,
        installmentDistribution: installmentDist,
        pixMetrics,
        totalRevenue: revenue,
        period: {
          start: startDate,
          end: endDate,
        },
      };

      logger.info('Payment metrics calculated successfully', {
        period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to calculate payment metrics', error);
      throw error;
    }
  }

  /**
   * Get conversion rate by payment method
   * Conversion rate = successful payments / total payment attempts
   */
  private async getConversionRateByMethod(
    startDate: Date,
    endDate: Date
  ): Promise<PaymentMetrics['conversionRateByMethod']> {
    try {
      // Card payments
      const cardResult = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful
        FROM payments
        WHERE payment_method = 'card'
          AND created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const cardTotal = parseInt(cardResult.rows[0]?.total || '0');
      const cardSuccessful = parseInt(cardResult.rows[0]?.successful || '0');
      const cardRate = cardTotal > 0 ? (cardSuccessful / cardTotal) * 100 : 0;

      // PIX payments
      const pixResult = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful
        FROM pix_payments
        WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const pixTotal = parseInt(pixResult.rows[0]?.total || '0');
      const pixSuccessful = parseInt(pixResult.rows[0]?.successful || '0');
      const pixRate = pixTotal > 0 ? (pixSuccessful / pixTotal) * 100 : 0;

      return {
        card: {
          total: cardTotal,
          successful: cardSuccessful,
          rate: Math.round(cardRate * 100) / 100,
        },
        pix: {
          total: pixTotal,
          successful: pixSuccessful,
          rate: Math.round(pixRate * 100) / 100,
        },
      };
    } catch (error) {
      logger.error('Failed to calculate conversion rate by method', error);
      throw error;
    }
  }

  /**
   * Get distribution of installment choices
   */
  private async getInstallmentDistribution(
    startDate: Date,
    endDate: Date
  ): Promise<{ [key: number]: number }> {
    try {
      const result = await pool.query(
        `SELECT 
          COALESCE(installments, 1) as installments,
          COUNT(*) as count
        FROM payments
        WHERE payment_method = 'card'
          AND created_at BETWEEN $1 AND $2
          AND status = 'paid'
        GROUP BY COALESCE(installments, 1)
        ORDER BY installments`,
        [startDate, endDate]
      );

      const distribution: { [key: number]: number } = {};
      
      for (const row of result.rows) {
        const installments = parseInt(row.installments);
        const count = parseInt(row.count);
        distribution[installments] = count;
      }

      return distribution;
    } catch (error) {
      logger.error('Failed to calculate installment distribution', error);
      throw error;
    }
  }

  /**
   * Get PIX-specific metrics
   */
  private async getPixMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<PaymentMetrics['pixMetrics']> {
    try {
      // Average confirmation time (time between creation and payment)
      const confirmationTimeResult = await pool.query(
        `SELECT 
          AVG(EXTRACT(EPOCH FROM (paid_at - created_at))) as avg_confirmation_seconds
        FROM pix_payments
        WHERE status = 'paid'
          AND created_at BETWEEN $1 AND $2
          AND paid_at IS NOT NULL`,
        [startDate, endDate]
      );

      const avgConfirmationTime = parseFloat(
        confirmationTimeResult.rows[0]?.avg_confirmation_seconds || '0'
      );

      // Expiration rate
      const expirationResult = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired
        FROM pix_payments
        WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const total = parseInt(expirationResult.rows[0]?.total || '0');
      const expired = parseInt(expirationResult.rows[0]?.expired || '0');
      const expirationRate = total > 0 ? (expired / total) * 100 : 0;

      // Average discount used
      const discountResult = await pool.query(
        `SELECT 
          AVG(discount) as avg_discount
        FROM pix_payments
        WHERE status = 'paid'
          AND created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const avgDiscount = parseFloat(discountResult.rows[0]?.avg_discount || '0');

      return {
        averageConfirmationTime: Math.round(avgConfirmationTime),
        expirationRate: Math.round(expirationRate * 100) / 100,
        averageDiscount: Math.round(avgDiscount * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to calculate PIX metrics', error);
      throw error;
    }
  }

  /**
   * Get total revenue by payment method
   */
  private async getRevenueByMethod(
    startDate: Date,
    endDate: Date
  ): Promise<PaymentMetrics['totalRevenue']> {
    try {
      // Card revenue
      const cardResult = await pool.query(
        `SELECT 
          COALESCE(SUM(amount), 0) as total_revenue
        FROM payments
        WHERE payment_method = 'card'
          AND status = 'paid'
          AND created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const cardRevenue = parseFloat(cardResult.rows[0]?.total_revenue || '0');

      // PIX revenue
      const pixResult = await pool.query(
        `SELECT 
          COALESCE(SUM(final_amount), 0) as total_revenue
        FROM pix_payments
        WHERE status = 'paid'
          AND created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const pixRevenue = parseFloat(pixResult.rows[0]?.total_revenue || '0');

      return {
        card: Math.round(cardRevenue * 100) / 100,
        pix: Math.round(pixRevenue * 100) / 100,
        total: Math.round((cardRevenue + pixRevenue) * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to calculate revenue by method', error);
      throw error;
    }
  }

  /**
   * Get payment method statistics
   */
  async getPaymentMethodStats(
    startDate: Date,
    endDate: Date
  ): Promise<PaymentMethodStats[]> {
    try {
      const stats: PaymentMethodStats[] = [];

      // Card stats
      const cardResult = await pool.query(
        `SELECT 
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(AVG(amount), 0) as avg_amount
        FROM payments
        WHERE payment_method = 'card'
          AND status = 'paid'
          AND created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      if (cardResult.rows.length > 0) {
        stats.push({
          method: 'card',
          count: parseInt(cardResult.rows[0].count),
          totalAmount: parseFloat(cardResult.rows[0].total_amount),
          averageAmount: parseFloat(cardResult.rows[0].avg_amount),
        });
      }

      // PIX stats
      const pixResult = await pool.query(
        `SELECT 
          COUNT(*) as count,
          COALESCE(SUM(final_amount), 0) as total_amount,
          COALESCE(AVG(final_amount), 0) as avg_amount
        FROM pix_payments
        WHERE status = 'paid'
          AND created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      if (pixResult.rows.length > 0) {
        stats.push({
          method: 'pix',
          count: parseInt(pixResult.rows[0].count),
          totalAmount: parseFloat(pixResult.rows[0].total_amount),
          averageAmount: parseFloat(pixResult.rows[0].avg_amount),
        });
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get payment method stats', error);
      throw error;
    }
  }

  /**
   * Get daily payment trends
   */
  async getDailyPaymentTrends(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    date: string;
    cardPayments: number;
    pixPayments: number;
    cardRevenue: number;
    pixRevenue: number;
  }>> {
    try {
      const result = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(CASE WHEN payment_method = 'card' AND status = 'paid' THEN 1 END) as card_payments,
          COUNT(CASE WHEN payment_method = 'pix' AND status = 'paid' THEN 1 END) as pix_payments,
          COALESCE(SUM(CASE WHEN payment_method = 'card' AND status = 'paid' THEN amount ELSE 0 END), 0) as card_revenue,
          COALESCE(SUM(CASE WHEN payment_method = 'pix' AND status = 'paid' THEN amount ELSE 0 END), 0) as pix_revenue
        FROM (
          SELECT created_at, payment_method, status, amount
          FROM payments
          WHERE created_at BETWEEN $1 AND $2
          UNION ALL
          SELECT created_at, 'pix' as payment_method, status, final_amount as amount
          FROM pix_payments
          WHERE created_at BETWEEN $1 AND $2
        ) combined
        GROUP BY DATE(created_at)
        ORDER BY date`,
        [startDate, endDate]
      );

      return result.rows.map(row => ({
        date: row.date,
        cardPayments: parseInt(row.card_payments),
        pixPayments: parseInt(row.pix_payments),
        cardRevenue: parseFloat(row.card_revenue),
        pixRevenue: parseFloat(row.pix_revenue),
      }));
    } catch (error) {
      logger.error('Failed to get daily payment trends', error);
      throw error;
    }
  }
}

export const paymentMetricsService = new PaymentMetricsService();
