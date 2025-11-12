import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { logger } from '@shared/utils/logger';

export class SubscriptionController {
  /**
   * POST /api/subscriptions
   * Create a new subscription and redirect to checkout
   */
  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.body;
      const studentId = req.user!.userId;

      if (!planId) {
        res.status(400).json({
          error: {
            code: 'MISSING_PLAN_ID',
            message: 'Plan ID is required',
          },
        });
        return;
      }

      // Get student email
      const { email } = req.user!;

      const result = await subscriptionService.createSubscription({
        studentId,
        planId,
        studentEmail: email,
      });

      res.status(201).json({
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
      });
    } catch (error: any) {
      logger.error('Error creating subscription', error);

      if (error.message === 'STUDENT_NOT_FOUND') {
        res.status(404).json({
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'Student not found',
          },
        });
        return;
      }

      if (error.message === 'PLAN_NOT_FOUND_OR_INACTIVE') {
        res.status(404).json({
          error: {
            code: 'PLAN_NOT_FOUND',
            message: 'Plan not found or inactive',
          },
        });
        return;
      }

      if (error.message === 'STUDENT_ALREADY_HAS_ACTIVE_SUBSCRIPTION') {
        res.status(409).json({
          error: {
            code: 'ALREADY_SUBSCRIBED',
            message: 'Student already has an active subscription',
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'SUBSCRIPTION_CREATION_FAILED',
          message: 'Failed to create subscription',
        },
      });
    }
  }

  /**
   * GET /api/subscriptions/current
   * Get current subscription for the authenticated student
   */
  async getCurrentSubscription(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user!.userId;

      const subscription =
        await subscriptionService.getCurrentSubscription(studentId);

      if (!subscription) {
        res.status(404).json({
          error: {
            code: 'NO_SUBSCRIPTION',
            message: 'No subscription found',
          },
        });
        return;
      }

      res.json(subscription);
    } catch (error) {
      logger.error('Error getting current subscription', error);
      res.status(500).json({
        error: {
          code: 'SUBSCRIPTION_RETRIEVAL_FAILED',
          message: 'Failed to retrieve subscription',
        },
      });
    }
  }

  /**
   * POST /api/subscriptions/cancel
   * Cancel the current subscription
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user!.userId;

      const subscription =
        await subscriptionService.cancelSubscription(studentId);

      res.json({
        message: 'Subscription cancelled successfully',
        subscription,
      });
    } catch (error: any) {
      logger.error('Error cancelling subscription', error);

      if (error.message === 'NO_ACTIVE_SUBSCRIPTION') {
        res.status(404).json({
          error: {
            code: 'NO_ACTIVE_SUBSCRIPTION',
            message: 'No active subscription found',
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'SUBSCRIPTION_CANCELLATION_FAILED',
          message: 'Failed to cancel subscription',
        },
      });
    }
  }

  /**
   * POST /api/subscriptions/reactivate
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user!.userId;

      const subscription =
        await subscriptionService.reactivateSubscription(studentId);

      res.json({
        message: 'Subscription reactivated successfully',
        subscription,
      });
    } catch (error: any) {
      logger.error('Error reactivating subscription', error);

      if (error.message === 'NO_CANCELLED_SUBSCRIPTION') {
        res.status(404).json({
          error: {
            code: 'NO_CANCELLED_SUBSCRIPTION',
            message: 'No cancelled subscription found',
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'SUBSCRIPTION_REACTIVATION_FAILED',
          message: 'Failed to reactivate subscription',
        },
      });
    }
  }

  /**
   * GET /api/subscriptions/plans
   * Get all active plans
   */
  async getActivePlans(_req: Request, res: Response): Promise<void> {
    try {
      const plans = await subscriptionService.getActivePlans();
      res.json(plans);
    } catch (error) {
      logger.error('Error getting active plans', error);
      res.status(500).json({
        error: {
          code: 'PLANS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve plans',
        },
      });
    }
  }
}

export const subscriptionController = new SubscriptionController();
