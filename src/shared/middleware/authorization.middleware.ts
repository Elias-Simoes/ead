import { Request, Response, NextFunction } from 'express';
import { logger } from '@shared/utils/logger';

/**
 * Authorization middleware to check user roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Check if user role is allowed
      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        logger.warn('Authorization failed', {
          userId: req.user.userId,
          userRole,
          allowedRoles,
          path: req.path,
        });

        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // User is authorized
      next();
    } catch (error) {
      logger.error('Authorization middleware error', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during authorization',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}
