import { Request, Response, NextFunction } from 'express';
import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

/**
 * Middleware to update last_access_at timestamp for authenticated users
 * Updates asynchronously to avoid blocking the request
 */
export const updateLastAccess = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Only update if user is authenticated
  if (req.user && req.user.userId) {
    const userId = req.user.userId;

    // Update asynchronously without blocking the request
    setImmediate(async () => {
      try {
        await pool.query(
          'UPDATE users SET last_access_at = CURRENT_TIMESTAMP WHERE id = $1',
          [userId]
        );
      } catch (error) {
        // Log error but don't fail the request
        logger.error('Failed to update last access timestamp', {
          error,
          userId,
        });
      }
    });
  }

  next();
};
