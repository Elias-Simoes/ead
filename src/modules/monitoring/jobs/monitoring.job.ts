import * as cron from 'node-cron';
import { metricsService } from '../services/metrics.service';
import { alertService } from '../services/alert.service';
import { healthService } from '../../health/services/health.service';
import { logger } from '../../../shared/utils/logger';

export class MonitoringJob {
  private metricsCronJob: cron.ScheduledTask | null = null;
  private healthCronJob: cron.ScheduledTask | null = null;

  /**
   * Start monitoring jobs
   */
  start(): void {
    logger.info('Starting monitoring jobs...');

    // Collect metrics every 1 minute
    this.metricsCronJob = cron.schedule('*/1 * * * *', async () => {
      try {
        await metricsService.collectMetrics();
      } catch (error) {
        logger.error('Failed to collect metrics', error);
      }
    });

    // Check health every 5 minutes
    this.healthCronJob = cron.schedule('*/5 * * * *', async () => {
      try {
        const health = await healthService.checkAllServices();

        // Alert if any service is down
        if (health.checks.database?.status === 'down') {
          await alertService.alertServiceDown(
            'Database',
            health.checks.database.error
          );
        }

        if (health.checks.redis?.status === 'down') {
          await alertService.alertServiceDown(
            'Redis',
            health.checks.redis.error
          );
        }
      } catch (error) {
        logger.error('Failed to check health', error);
      }
    });

    logger.info('Monitoring jobs started successfully');
  }

  /**
   * Stop monitoring jobs
   */
  stop(): void {
    if (this.metricsCronJob) {
      this.metricsCronJob.stop();
      logger.info('Metrics collection job stopped');
    }

    if (this.healthCronJob) {
      this.healthCronJob.stop();
      logger.info('Health check job stopped');
    }
  }
}

export const monitoringJob = new MonitoringJob();
