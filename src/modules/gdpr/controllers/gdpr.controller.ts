import { Request, Response, NextFunction } from 'express';
import { gdprService } from '../services/gdpr.service';
import { logger } from '@shared/utils/logger';
import { AuditService } from '@shared/services/audit.service';

/**
 * GDPR Controller
 * Handles LGPD/GDPR compliance endpoints
 */
export class GdprController {
  /**
   * Get all user data (GDPR data access request)
   * GET /api/gdpr/my-data
   */
  async getMyData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const userId = req.user.userId;

      // Get all user data
      const userData = await gdprService.getUserData(userId);

      // Log audit entry
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');
      await AuditService.logGdprDataAccess(userId, ipAddress, userAgent);

      logger.info('GDPR data access request completed', { userId });

      res.status(200).json({
        message: 'User data retrieved successfully',
        data: userData,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Request account deletion (GDPR right to be forgotten)
   * POST /api/gdpr/delete-account
   */
  async requestAccountDeletion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const userId = req.user.userId;

      // Create deletion request
      const deletionRequest = await gdprService.requestAccountDeletion(userId);

      // Log audit entry
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');
      await AuditService.logGdprDeletionRequest(userId, ipAddress, userAgent);

      logger.info('GDPR account deletion requested', { userId });

      res.status(200).json({
        message: 'Account deletion request submitted successfully',
        data: {
          requestId: deletionRequest.requestId,
          scheduledFor: deletionRequest.scheduledFor,
          note: 'Your account will be deleted in 15 days. You can cancel this request before the scheduled date.',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel account deletion request
   * POST /api/gdpr/cancel-deletion
   */
  async cancelAccountDeletion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const userId = req.user.userId;

      // Cancel deletion request
      await gdprService.cancelAccountDeletion(userId);

      logger.info('GDPR account deletion cancelled', { userId });

      res.status(200).json({
        message: 'Account deletion request cancelled successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_PENDING_DELETION_REQUEST') {
        res.status(404).json({
          error: {
            code: 'NO_PENDING_DELETION_REQUEST',
            message: 'No pending deletion request found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get deletion request status
   * GET /api/gdpr/deletion-status
   */
  async getDeletionStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const userId = req.user.userId;

      // Get deletion request status
      const status = await gdprService.getDeletionRequestStatus(userId);

      res.status(200).json({
        message: 'Deletion request status retrieved successfully',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const gdprController = new GdprController();
