import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';
import { AuditService } from '@shared/services/audit.service';

/**
 * GDPR Service
 * Handles LGPD/GDPR compliance operations
 */
export class GdprService {
  /**
   * Get all user data for GDPR data access request
   * @param userId - User ID
   * @returns Complete user data
   */
  async getUserData(userId: string): Promise<any> {
    try {
      // Get user basic info
      const userResult = await pool.query(
        `SELECT id, email, name, role, is_active, last_access_at, created_at, updated_at
         FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      const user = userResult.rows[0];
      const userData: any = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.is_active,
          lastAccessAt: user.last_access_at,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      };

      // Get role-specific data
      if (user.role === 'student') {
        const studentResult = await pool.query(
          `SELECT subscription_status, subscription_expires_at, total_study_time, 
                  gdpr_consent, gdpr_consent_at
           FROM students WHERE id = $1`,
          [userId]
        );
        userData.student = studentResult.rows[0] || null;

        // Get student progress
        const progressResult = await pool.query(
          `SELECT sp.*, c.title as course_title
           FROM student_progress sp
           JOIN courses c ON sp.course_id = c.id
           WHERE sp.student_id = $1`,
          [userId]
        );
        userData.progress = progressResult.rows;

        // Get certificates
        const certificatesResult = await pool.query(
          `SELECT cert.*, c.title as course_title
           FROM certificates cert
           JOIN courses c ON cert.course_id = c.id
           WHERE cert.student_id = $1`,
          [userId]
        );
        userData.certificates = certificatesResult.rows;

        // Get subscriptions
        const subscriptionsResult = await pool.query(
          `SELECT s.*, p.name as plan_name
           FROM subscriptions s
           LEFT JOIN plans p ON s.plan_id = p.id
           WHERE s.student_id = $1`,
          [userId]
        );
        userData.subscriptions = subscriptionsResult.rows;

        // Get payments
        const paymentsResult = await pool.query(
          `SELECT pay.*
           FROM payments pay
           JOIN subscriptions s ON pay.subscription_id = s.id
           WHERE s.student_id = $1`,
          [userId]
        );
        userData.payments = paymentsResult.rows;

        // Get assessment submissions
        const assessmentsResult = await pool.query(
          `SELECT sa.*, a.title as assessment_title, c.title as course_title
           FROM student_assessments sa
           JOIN assessments a ON sa.assessment_id = a.id
           JOIN courses c ON a.course_id = c.id
           WHERE sa.student_id = $1`,
          [userId]
        );
        userData.assessments = assessmentsResult.rows;
      } else if (user.role === 'instructor') {
        const instructorResult = await pool.query(
          `SELECT bio, expertise, is_suspended, suspended_at
           FROM instructors WHERE id = $1`,
          [userId]
        );
        userData.instructor = instructorResult.rows[0] || null;

        // Get courses created
        const coursesResult = await pool.query(
          `SELECT id, title, description, category, workload, status, version, 
                  created_at, updated_at, published_at
           FROM courses WHERE instructor_id = $1`,
          [userId]
        );
        userData.courses = coursesResult.rows;
      }

      // Get audit logs
      const auditLogs = await AuditService.getUserLogs(userId, 1000);
      userData.auditLogs = auditLogs;

      return userData;
    } catch (error) {
      logger.error('Error fetching user data for GDPR', error);
      throw error;
    }
  }

  /**
   * Request account deletion (GDPR right to be forgotten)
   * @param userId - User ID
   * @returns Deletion request details
   */
  async requestAccountDeletion(userId: string): Promise<{
    requestId: string;
    scheduledFor: Date;
  }> {
    try {
      // Check if there's already a pending request
      const existingRequest = await pool.query(
        `SELECT id, scheduled_for FROM gdpr_deletion_requests
         WHERE user_id = $1 AND status = 'pending'`,
        [userId]
      );

      if (existingRequest.rows.length > 0) {
        return {
          requestId: existingRequest.rows[0].id,
          scheduledFor: existingRequest.rows[0].scheduled_for,
        };
      }

      // Schedule deletion for 15 days from now
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + 15);

      // Create deletion request
      const result = await pool.query(
        `INSERT INTO gdpr_deletion_requests (user_id, scheduled_for)
         VALUES ($1, $2)
         RETURNING id, scheduled_for`,
        [userId, scheduledFor]
      );

      const request = result.rows[0];

      logger.info('GDPR deletion request created', {
        userId,
        requestId: request.id,
        scheduledFor: request.scheduled_for,
      });

      return {
        requestId: request.id,
        scheduledFor: request.scheduled_for,
      };
    } catch (error) {
      logger.error('Error creating GDPR deletion request', error);
      throw error;
    }
  }

  /**
   * Cancel account deletion request
   * @param userId - User ID
   */
  async cancelAccountDeletion(userId: string): Promise<void> {
    try {
      const result = await pool.query(
        `UPDATE gdpr_deletion_requests
         SET status = 'cancelled'
         WHERE user_id = $1 AND status = 'pending'
         RETURNING id`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('NO_PENDING_DELETION_REQUEST');
      }

      logger.info('GDPR deletion request cancelled', { userId });
    } catch (error) {
      logger.error('Error cancelling GDPR deletion request', error);
      throw error;
    }
  }

  /**
   * Process pending deletion requests (called by cron job)
   */
  async processPendingDeletions(): Promise<void> {
    try {
      // Get pending requests that are due
      const result = await pool.query(
        `SELECT id, user_id FROM gdpr_deletion_requests
         WHERE status = 'pending' AND scheduled_for <= CURRENT_TIMESTAMP`
      );

      for (const request of result.rows) {
        try {
          // Mark as processing
          await pool.query(
            `UPDATE gdpr_deletion_requests SET status = 'processing' WHERE id = $1`,
            [request.id]
          );

          // Anonymize user data
          await this.anonymizeUserData(request.user_id);

          // Mark as completed
          await pool.query(
            `UPDATE gdpr_deletion_requests 
             SET status = 'completed', processed_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [request.id]
          );

          // Log completion
          await AuditService.logGdprDeletionComplete(request.user_id);

          logger.info('GDPR deletion completed', {
            requestId: request.id,
            userId: request.user_id,
          });
        } catch (error) {
          logger.error('Error processing GDPR deletion', {
            requestId: request.id,
            error,
          });
          // Continue with next request
        }
      }
    } catch (error) {
      logger.error('Error processing pending GDPR deletions', error);
    }
  }

  /**
   * Anonymize user data while keeping required records
   * @param userId - User ID
   */
  private async anonymizeUserData(userId: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Anonymize user basic info
      await client.query(
        `UPDATE users 
         SET email = $1,
             name = 'Deleted User',
             password_hash = 'DELETED',
             is_active = false
         WHERE id = $2`,
        [`deleted_${userId}@anonymized.local`, userId]
      );

      // Anonymize student data if exists
      await client.query(
        `UPDATE students 
         SET gdpr_consent = false
         WHERE id = $1`,
        [userId]
      );

      // Anonymize instructor data if exists
      await client.query(
        `UPDATE instructors 
         SET bio = NULL,
             expertise = NULL
         WHERE id = $1`,
        [userId]
      );

      // Keep payment records but anonymize sensitive data
      // (Required for financial/legal compliance)
      await client.query(
        `UPDATE payments 
         SET gateway_payment_id = 'ANONYMIZED'
         WHERE subscription_id IN (
           SELECT id FROM subscriptions WHERE student_id = $1
         )`,
        [userId]
      );

      // Keep certificates but anonymize (required for validation)
      // The verification system will still work with the code

      // Delete progress data (not required to keep)
      await client.query(
        `DELETE FROM student_progress WHERE student_id = $1`,
        [userId]
      );

      // Delete assessment submissions (not required to keep)
      await client.query(
        `DELETE FROM student_assessments WHERE student_id = $1`,
        [userId]
      );

      // Anonymize audit logs
      await client.query(
        `UPDATE audit_logs 
         SET ip_address = 'ANONYMIZED',
             user_agent = 'ANONYMIZED'
         WHERE user_id = $1`,
        [userId]
      );

      await client.query('COMMIT');

      logger.info('User data anonymized', { userId });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error anonymizing user data', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get deletion request status
   * @param userId - User ID
   */
  async getDeletionRequestStatus(userId: string): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT id, requested_at, scheduled_for, processed_at, status
         FROM gdpr_deletion_requests
         WHERE user_id = $1
         ORDER BY requested_at DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching deletion request status', error);
      throw error;
    }
  }
}

export const gdprService = new GdprService();
