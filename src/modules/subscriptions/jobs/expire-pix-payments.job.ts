import cron from 'node-cron';
import { logger } from '@shared/utils/logger';
import { pixPaymentService } from '../services/pix-payment.service';

/**
 * Expire pending PIX payments that have passed their expiration time
 * Runs every 5 minutes
 * Requirements: 5.2, 6.3
 */
export function startExpirePixPaymentsJob(): void {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      logger.info('Starting PIX payment expiration job');

      const expiredCount = await pixPaymentService.expirePendingPayments();

      logger.info('PIX payment expiration job completed', {
        expiredCount,
      });
    } catch (error) {
      logger.error('PIX payment expiration job failed', error);
    }
  });

  logger.info('PIX payment expiration job scheduled (every 5 minutes)');
}

/**
 * Manual trigger for testing purposes
 */
export async function expirePixPaymentsNow(): Promise<{
  expired: number;
}> {
  try {
    logger.info('Manually triggering PIX payment expiration');

    const expiredCount = await pixPaymentService.expirePendingPayments();

    logger.info('Manual PIX payment expiration completed', {
      expiredCount,
    });

    return { expired: expiredCount };
  } catch (error) {
    logger.error('Failed to manually expire PIX payments', error);
    throw error;
  }
}
