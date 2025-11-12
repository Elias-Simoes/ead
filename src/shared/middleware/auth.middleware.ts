import { Request, Response, NextFunction } from 'express';
import { tokenService, TokenPayload } from '@modules/auth/services/token.service';
import { logger } from '@shared/utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * Validates the JWT token from the Authorization header
 * and adds the user payload to the request object
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication token is required',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = tokenService.verifyAccessToken(token);

    // Add user to request
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXPIRED') {
        res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Authentication token has expired',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      if (error.message === 'INVALID_TOKEN') {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }
    }

    logger.error('Authentication error', error);
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

/**
 * Middleware to authorize requests based on user roles
 * Must be used after authenticate middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const authorize = (...allowedRoles: Array<'admin' | 'instructor' | 'student'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });

      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't fail if token is missing
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = tokenService.verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Silently fail for optional authentication
    next();
  }
};
