import cron from 'node-cron';
import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

/**
 * Check for expired subscriptions and suspend them
 * Runs daily at 00:00 (midnight)
 */
export function startExpiredSubscriptionsJob(): void {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Starting expired subscriptions check job');

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Find subscriptions that have expired
        const expiredSubsResult = await client.query(
          `SELECT s.id, s.student_id, s.gateway_subscription_id
           FROM subscriptions s
           WHERE s.status = 'active'
           AND s.current_period_end < CURRENT_TIMESTAMP`
        );

        const expiredSubs = expiredSubsResult.rows;

        if (expiredSubs.length === 0) {
          logger.info('No expired subscriptions found');
          await client.query('COMMIT');
          return;
        }

        logger.info(`Found ${expiredSubs.length} expired subscriptions`);

        // Update subscription status to suspended
        for (const sub of expiredSubs) {
          await client.query(
            `UPDATE subscriptions 
             SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [sub.id]
          );

          // Update student subscription status
          await client.query(
            `UPDATE students 
             SET subscription_status = 'suspended'
             WHERE id = $1`,
            [sub.student_id]
          );

          logger.info('Subscription suspended', {
            subscriptionId: sub.id,
            studentId: sub.student_id,
          });
        }

        await client.query('COMMIT');

        logger.info(
          `Expired subscriptions check completed. Suspended ${expiredSubs.length} subscriptions`
        );
      } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Failed to process expired subscriptions', error);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Expired subscriptions job failed', error);
    }
  });

  logger.info('Expired subscriptions check job scheduled (daily at midnight)');
}

/**
 * Manual trigger for testing purposes
 */
export async function checkExpiredSubscriptionsNow(): Promise<{
  suspended: number;
}> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find subscriptions that have expired
    const expiredSubsResult = await client.query(
      `SELECT s.id, s.student_id, s.gateway_subscription_id
       FROM subscriptions s
       WHERE s.status = 'active'
       AND s.current_period_end < CURRENT_TIMESTAMP`
    );

    const expiredSubs = expiredSubsResult.rows;

    if (expiredSubs.length === 0) {
      await client.query('COMMIT');
      return { suspended: 0 };
    }

    // Update subscription status to suspended
    for (const sub of expiredSubs) {
      await client.query(
        `UPDATE subscriptions 
         SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [sub.id]
      );

      // Update student subscription status
      await client.query(
        `UPDATE students 
         SET subscription_status = 'suspended'
         WHERE id = $1`,
        [sub.student_id]
      );
    }

    await client.query('COMMIT');

    return { suspended: expiredSubs.length };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to check expired subscriptions', error);
    throw error;
  } finally {
    client.release();
  }
}
