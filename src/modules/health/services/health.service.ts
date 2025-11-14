import { pool } from '../../../config/database';
import { redisClient } from '../../../config/redis';
import { logger } from '../../../shared/utils/logger';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database?: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    redis?: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu?: {
      usage: number;
    };
  };
}

export class HealthService {
  /**
   * Check overall application health
   */
  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    const health: HealthStatus = {
      status: 'healthy',
      timestamp,
      uptime,
      checks: {},
    };

    // Add memory info
    const memoryUsage = process.memoryUsage();
    health.checks.memory = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    };

    return health;
  }

  /**
   * Check database connection health
   */
  async checkDatabase(): Promise<HealthStatus['checks']['database']> {
    const startTime = Date.now();

    try {
      // Execute simple query to check connection
      await pool.query('SELECT 1');

      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        responseTime,
      };
    } catch (error) {
      logger.error('Database health check failed', error);

      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check Redis connection health
   */
  async checkRedis(): Promise<HealthStatus['checks']['redis']> {
    const startTime = Date.now();

    try {
      // Ping Redis
      await redisClient.ping();

      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        responseTime,
      };
    } catch (error) {
      logger.error('Redis health check failed', error);

      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check all services health
   */
  async checkAllServices(): Promise<HealthStatus> {
    const health = await this.checkHealth();

    // Check database
    health.checks.database = await this.checkDatabase();

    // Check Redis
    health.checks.redis = await this.checkRedis();

    // Determine overall status
    const hasUnhealthyService =
      health.checks.database?.status === 'down' ||
      health.checks.redis?.status === 'down';

    if (hasUnhealthyService) {
      health.status = 'unhealthy';
    }

    return health;
  }

  /**
   * Check if application is ready to accept traffic
   */
  async checkReadiness(): Promise<boolean> {
    try {
      // Check critical services
      const dbCheck = await this.checkDatabase();
      const redisCheck = await this.checkRedis();

      return (dbCheck?.status === 'up') && (redisCheck?.status === 'up');
    } catch (error) {
      logger.error('Readiness check failed', error as Error);
      return false;
    }
  }

  /**
   * Check if application is alive (liveness probe)
   */
  async checkLiveness(): Promise<boolean> {
    try {
      // Simple check to see if the process is responsive
      return true;
    } catch (error) {
      logger.error('Liveness check failed', error);
      return false;
    }
  }
}

export const healthService = new HealthService();
