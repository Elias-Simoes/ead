import { Request, Response } from 'express';
import { paymentMetricsService } from '../services/payment-metrics.service';
import { logger } from '@shared/utils/logger';

/**
 * Payment Metrics Controller
 * Provides endpoints for payment analytics and dashboard
 */
export class PaymentMetricsController {
  /**
   * GET /api/admin/payments/metrics
   * Get comprehensive payment metrics for a time period
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      // Default to last 30 days if not specified
      const start = startDate 
        ? new Date(startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const end = endDate
        ? new Date(endDate as string)
        : new Date();

      logger.info('Fetching payment metrics', {
        userId: req.user?.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      const metrics = await paymentMetricsService.getPaymentMetrics(start, end);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Failed to fetch payment metrics', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment metrics',
      });
    }
  }

  /**
   * GET /api/admin/payments/stats
   * Get payment method statistics
   */
  async getPaymentMethodStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate 
        ? new Date(startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const end = endDate
        ? new Date(endDate as string)
        : new Date();

      logger.info('Fetching payment method stats', {
        userId: req.user?.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      const stats = await paymentMetricsService.getPaymentMethodStats(start, end);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to fetch payment method stats', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment method stats',
      });
    }
  }

  /**
   * GET /api/admin/payments/trends
   * Get daily payment trends
   */
  async getDailyTrends(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate 
        ? new Date(startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const end = endDate
        ? new Date(endDate as string)
        : new Date();

      logger.info('Fetching daily payment trends', {
        userId: req.user?.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      const trends = await paymentMetricsService.getDailyPaymentTrends(start, end);

      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      logger.error('Failed to fetch daily payment trends', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch daily payment trends',
      });
    }
  }
}

export const paymentMetricsController = new PaymentMetricsController();
