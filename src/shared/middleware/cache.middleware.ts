import { Request, Response, NextFunction } from 'express';
import { cacheService } from '@shared/services/cache.service';
import { logger } from '@shared/utils/logger';

/**
 * Cache Middleware
 * Caches GET request responses in Redis
 * 
 * @param ttl - Time to live in seconds
 * @returns Express middleware function
 */
export const cacheMiddleware = (ttl: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key from URL and query params
      const cacheKey = `http:${req.originalUrl || req.url}`;

      // Try to get cached response
      const cachedResponse = await cacheService.get<any>(cacheKey);

      if (cachedResponse) {
        logger.debug('Cache hit', { key: cacheKey });
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedResponse);
      }

      // Cache miss - intercept res.json to cache the response
      logger.debug('Cache miss', { key: cacheKey });
      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        // Cache the response asynchronously (don't wait)
        cacheService.set(cacheKey, body, ttl).catch((error) => {
          logger.error('Failed to cache response', { key: cacheKey, error });
        });

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', error);
      // Don't fail the request if caching fails
      next();
    }
  };
};
