import cron from 'node-cron';
import { gdprService } from '../services/gdpr.service';
import { logger } from '@shared/utils/logger';

/**
 * Cron job to process pending GDPR deletion requests
 * Runs daily at 2:00 AM
 */
export const startGdprDeletionJob = (): void => {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting GDPR deletion job');
      await gdprService.processPendingDeletions();
      logger.info('GDPR deletion job completed');
    } catch (error) {
      logger.error('Error in GDPR deletion job', error);
    }
  });

  logger.info('GDPR deletion job scheduled (daily at 2:00 AM)');
};
