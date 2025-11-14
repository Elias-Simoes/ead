import * as cron from 'node-cron';
import { config } from '../../../config/env';
import { backupService } from '../services/backup.service';
import { alertService } from '../../monitoring/services/alert.service';
import { logger } from '../../../shared/utils/logger';

export class BackupJob {
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Start the backup cron job
   */
  start(): void {
    if (!config.backup.enabled) {
      logger.info('Backup job is disabled');
      return;
    }

    const schedule = config.backup.schedule; // Default: '0 3 * * *' (3:00 AM daily)

    logger.info(`Starting backup job with schedule: ${schedule}`);

    this.cronJob = cron.schedule(schedule, async () => {
      try {
        logger.info('Backup job triggered');
        await backupService.executeBackup();
      } catch (error) {
        logger.error('Backup job failed', error);
        await alertService.alertBackupFailure(error as Error);
      }
    });

    logger.info('Backup job started successfully');
  }

  /**
   * Stop the backup cron job
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Backup job stopped');
    }
  }

  /**
   * Execute backup immediately (manual trigger)
   */
  async executeNow(): Promise<void> {
    logger.info('Manual backup triggered');
    await backupService.executeBackup();
  }
}

export const backupJob = new BackupJob();
