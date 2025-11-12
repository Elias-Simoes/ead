import { Request, Response, NextFunction } from 'express';
import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

/**
 * Middleware to verify that a student has an active subscription
 * Must be used after authenticate middleware
 * Only applies to students - admins and instructors bypass this check
 */
export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    // Admins and instructors bypass subscription check
    if (req.user.role === 'admin' || req.user.role === 'instructor') {
      next();
      return;
    }

    // For students, verify active subscription
    if (req.user.role === 'student') {
      const result = await pool.query(
        `SELECT subscription_status, subscription_expires_at 
         FROM students 
         WHERE id = $1`,
        [req.user.userId]
      );

      if (result.rows.length === 0) {
        logger.error('Student record not found', { userId: req.user.userId });
        res.status(404).json({
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'Student record not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const student = result.rows[0];

      // Check if subscription is active
      if (student.subscription_status !== 'active') {
        logger.warn('Subscription not active', {
          userId: req.user.userId,
          status: student.subscription_status,
        });

        res.status(403).json({
          error: {
            code: 'SUBSCRIPTION_REQUIRED',
            message: 'An active subscription is required to access this content',
            details: {
              currentStatus: student.subscription_status,
            },
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Check if subscription has expired
      if (student.subscription_expires_at) {
        const expiresAt = new Date(student.subscription_expires_at);
        const now = new Date();

        if (expiresAt < now) {
          logger.warn('Subscription expired', {
            userId: req.user.userId,
            expiresAt: expiresAt.toISOString(),
          });

          res.status(403).json({
            error: {
              code: 'SUBSCRIPTION_EXPIRED',
              message: 'Your subscription has expired. Please renew to continue accessing content',
              details: {
                expiredAt: expiresAt.toISOString(),
              },
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      // Subscription is active and valid
      next();
      return;
    }

    // Unknown role
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  } catch (error) {
    logger.error('Subscription verification error', error);
    res.status(500).json({
      error: {
        code: 'SUBSCRIPTION_CHECK_FAILED',
        message: 'Failed to verify subscription status',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};
