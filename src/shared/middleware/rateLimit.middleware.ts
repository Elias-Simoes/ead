import { Request, Response, NextFunction } from 'express';
import { redisClient } from '@config/redis';
import { config } from '@config/env';
import { logger } from '@shared/utils/logger';

/**
 * Rate limiting middleware using Redis
 * @param maxAttempts - Maximum number of attempts allowed
 * @param windowMs - Time window in milliseconds
 * @param keyPrefix - Prefix for Redis key
 */
export const rateLimit = (
  maxAttempts: number,
  windowMs: number,
  keyPrefix: string
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get client IP address
      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket.remoteAddress ||
        'unknown';

      // Create Redis key
      const key = `${keyPrefix}:${ip}`;

      // Get current attempt count
      const attempts = await redisClient.get(key);
      const currentAttempts = attempts ? parseInt(attempts, 10) : 0;

      // Check if limit exceeded
      if (currentAttempts >= maxAttempts) {
        const ttl = await redisClient.ttl(key);
        const retryAfter = ttl > 0 ? ttl : Math.floor(windowMs / 1000);

        logger.warn('Rate limit exceeded', {
          ip,
          keyPrefix,
          attempts: currentAttempts,
          maxAttempts,
        });

        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter,
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Increment attempt count
      const newAttempts = currentAttempts + 1;
      
      if (currentAttempts === 0) {
        // First attempt - set with expiration
        await redisClient.set(key, newAttempts.toString(), {
          PX: windowMs,
        });
      } else {
        // Subsequent attempts - just increment
        await redisClient.set(key, newAttempts.toString());
      }

      // If not first attempt, ensure TTL is set
      if (currentAttempts > 0) {
        const ttl = await redisClient.ttl(key);
        if (ttl === -1) {
          // No expiration set, set it now
          await redisClient.expire(key, Math.floor(windowMs / 1000));
        }
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxAttempts.toString());
      res.setHeader(
        'X-RateLimit-Remaining',
        Math.max(0, maxAttempts - newAttempts).toString()
      );

      next();
    } catch (error) {
      logger.error('Rate limit middleware error', error);
      // Don't block request if Redis fails
      next();
    }
  };
};

/**
 * Login rate limiting middleware
 * 5 attempts per 15 minutes per IP
 */
export const loginRateLimit = rateLimit(
  config.rateLimit.loginMaxAttempts,
  config.rateLimit.windowMs,
  'login'
);

/**
 * Global API rate limiting middleware
 * 100 requests per minute per IP
 */
export const globalRateLimit = rateLimit(
  config.rateLimit.maxRequests,
  60000, // 1 minute
  'api'
);

/**
 * Clear rate limit for a specific IP and key prefix
 * Useful for clearing rate limit after successful login
 */
export const clearRateLimit = async (
  ip: string,
  keyPrefix: string
): Promise<void> => {
  try {
    const key = `${keyPrefix}:${ip}`;
    await redisClient.del(key);
  } catch (error) {
    logger.error('Error clearing rate limit', error);
  }
};
