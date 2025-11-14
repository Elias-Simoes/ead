import { Request, Response } from 'express';
import { healthService } from '../services/health.service';
import { logger } from '../../../shared/utils/logger';

export class HealthController {
  /**
   * Basic health check endpoint
   * GET /health
   */
  async getHealth(_req: Request, res: Response): Promise<void> {
    try {
      const health = await healthService.checkHealth();

      res.status(200).json(health);
    } catch (error) {
      logger.error('Health check failed', error);
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
      });
    }
  }

  /**
   * Database health check endpoint
   * GET /health/db
   */
  async getDatabaseHealth(_req: Request, res: Response): Promise<void> {
    try {
      const dbHealth = await healthService.checkDatabase();

      const statusCode = dbHealth?.status === 'up' ? 200 : 503;

      res.status(statusCode).json({
        service: 'database',
        ...dbHealth,
      });
    } catch (error) {
      logger.error('Database health check failed', error);
      res.status(503).json({
        service: 'database',
        status: 'down',
        error: 'Database health check failed',
      });
    }
  }

  /**
   * Redis health check endpoint
   * GET /health/redis
   */
  async getRedisHealth(_req: Request, res: Response): Promise<void> {
    try {
      const redisHealth = await healthService.checkRedis();

      const statusCode = redisHealth?.status === 'up' ? 200 : 503;

      res.status(statusCode).json({
        service: 'redis',
        ...redisHealth,
      });
    } catch (error) {
      logger.error('Redis health check failed', error);
      res.status(503).json({
        service: 'redis',
        status: 'down',
        error: 'Redis health check failed',
      });
    }
  }

  /**
   * Comprehensive health check (all services)
   * GET /health/all
   */
  async getAllServicesHealth(_req: Request, res: Response): Promise<void> {
    try {
      const health = await healthService.checkAllServices();

      const statusCode = health.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Comprehensive health check failed', error);
      res.status(503).json({
        status: 'unhealthy',
        error: 'Comprehensive health check failed',
      });
    }
  }

  /**
   * Readiness probe (Kubernetes)
   * GET /health/ready
   */
  async getReadiness(_req: Request, res: Response): Promise<void> {
    try {
      const isReady = await healthService.checkReadiness();

      if (isReady) {
        res.status(200).json({
          status: 'ready',
          message: 'Application is ready to accept traffic',
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          message: 'Application is not ready to accept traffic',
        });
      }
    } catch (error) {
      logger.error('Readiness check failed', error);
      res.status(503).json({
        status: 'not_ready',
        error: 'Readiness check failed',
      });
    }
  }

  /**
   * Liveness probe (Kubernetes)
   * GET /health/live
   */
  async getLiveness(_req: Request, res: Response): Promise<void> {
    try {
      const isAlive = await healthService.checkLiveness();

      if (isAlive) {
        res.status(200).json({
          status: 'alive',
          message: 'Application is alive',
        });
      } else {
        res.status(503).json({
          status: 'dead',
          message: 'Application is not responding',
        });
      }
    } catch (error) {
      logger.error('Liveness check failed', error);
      res.status(503).json({
        status: 'dead',
        error: 'Liveness check failed',
      });
    }
  }
}

export const healthController = new HealthController();
