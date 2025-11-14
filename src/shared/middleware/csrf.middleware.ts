import { Request, Response, NextFunction } from 'express';
import { CsrfService } from '@shared/services/csrf.service';
import { logger } from '@shared/utils/logger';

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing operations (POST, PUT, PATCH, DELETE)
 */
export const csrfProtection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip CSRF validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next();
      return;
    }

    // Skip CSRF validation for webhook endpoints
    if (req.path.startsWith('/api/webhooks')) {
      next();
      return;
    }

    // Get session ID from user (requires authentication)
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required for CSRF protection',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const sessionId = req.user.userId;

    // Get CSRF token from header
    const csrfToken = req.headers['x-csrf-token'] as string;

    if (!csrfToken) {
      logger.warn('Missing CSRF token', {
        userId: req.user.userId,
        path: req.path,
        method: req.method,
      });

      res.status(403).json({
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token is required',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    // Validate CSRF token
    const isValid = await CsrfService.validateToken(sessionId, csrfToken);

    if (!isValid) {
      logger.warn('Invalid CSRF token', {
        userId: req.user.userId,
        path: req.path,
        method: req.method,
      });

      res.status(403).json({
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'Invalid CSRF token',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    // Refresh token TTL on successful validation
    await CsrfService.refreshToken(sessionId);

    next();
  } catch (error) {
    logger.error('CSRF middleware error', error);
    res.status(500).json({
      error: {
        code: 'CSRF_VALIDATION_ERROR',
        message: 'Error validating CSRF token',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

/**
 * Endpoint to get a CSRF token
 * Should be called after authentication
 */
export const getCsrfToken = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    const sessionId = req.user.userId;
    const token = await CsrfService.generateToken(sessionId);

    res.status(200).json({
      csrfToken: token,
    });
  } catch (error) {
    logger.error('Error generating CSRF token', error);
    res.status(500).json({
      error: {
        code: 'CSRF_GENERATION_ERROR',
        message: 'Error generating CSRF token',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};
