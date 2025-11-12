import { Request, Response } from 'express';
import { adminSubscriptionService } from '../services/admin-subscription.service';
import { logger } from '@shared/utils/logger';

export class AdminSubscriptionController {
  /**
   * GET /api/admin/subscriptions
   * Get all subscriptions with filters
   */
  async getAllSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const { status, planId, startDate, endDate, page, limit } = req.query;

      const filters = {
        status: status as string,
        planId: planId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      };

      const result = await adminSubscriptionService.getAllSubscriptions(filters);

      res.json(result);
    } catch (error) {
      logger.error('Error getting all subscriptions', error);
      res.status(500).json({
        error: {
          code: 'SUBSCRIPTIONS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve subscriptions',
        },
      });
    }
  }

  /**
   * GET /api/admin/subscriptions/stats
   * Get subscription statistics
   */
  async getSubscriptionStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await adminSubscriptionService.getSubscriptionStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error getting subscription stats', error);
      res.status(500).json({
        error: {
          code: 'STATS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve subscription statistics',
        },
      });
    }
  }
}

export const adminSubscriptionController = new AdminSubscriptionController();
