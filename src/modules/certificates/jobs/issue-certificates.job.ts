import cron from 'node-cron';
import { pool } from '@config/database';
import { certificateService } from '../services/certificate.service';
import { emailQueueService } from '@modules/notifications/services/email-queue.service';
import { logger } from '@shared/utils/logger';

/**
 * Check for completed courses and issue certificates automatically
 * Runs every hour
 */
export function startCertificateIssuanceJob(): void {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Starting certificate issuance job');

      const result = await issuePendingCertificates();

      logger.info(
        `Certificate issuance job completed. Issued ${result.issued} certificates`
      );
    } catch (error) {
      logger.error('Certificate issuance job failed', error);
    }
  });

  logger.info('Certificate issuance job scheduled (hourly)');
}

/**
 * Issue certificates for all eligible students
 */
export async function issuePendingCertificates(): Promise<{
  issued: number;
  errors: number;
}> {
  const client = await pool.connect();
  let issued = 0;
  let errors = 0;

  try {
    // Find students who completed courses but don't have certificates yet
    const query = `
      SELECT DISTINCT
        sp.student_id,
        sp.course_id,
        u.name as student_name,
        u.email as student_email,
        c.title as course_name
      FROM student_progress sp
      INNER JOIN users u ON u.id = sp.student_id
      INNER JOIN courses c ON c.id = sp.course_id
      LEFT JOIN certificates cert ON cert.student_id = sp.student_id 
        AND cert.course_id = sp.course_id
      WHERE sp.progress_percentage = 100
        AND sp.completed_at IS NOT NULL
        AND cert.id IS NULL
    `;

    const result = await client.query(query);
    const eligibleStudents = result.rows;

    if (eligibleStudents.length === 0) {
      logger.info('No eligible students found for certificate issuance');
      return { issued: 0, errors: 0 };
    }

    logger.info(
      `Found ${eligibleStudents.length} students eligible for certificates`
    );

    // Process each eligible student
    for (const student of eligibleStudents) {
      try {
        // Check full eligibility (including assessment scores)
        const eligibility = await certificateService.checkEligibility(
          student.student_id,
          student.course_id
        );

        if (!eligibility.eligible) {
          logger.info('Student not eligible for certificate', {
            studentId: student.student_id,
            courseId: student.course_id,
            reason: eligibility.reason,
          });
          continue;
        }

        // Issue certificate
        const certificate = await certificateService.issueCertificate(
          student.student_id,
          student.course_id
        );

        // Send email notification (async, don't wait)
        emailQueueService.enqueueCertificateIssuedEmail({
          studentName: student.student_name,
          studentEmail: student.student_email,
          courseTitle: student.course_name,
          certificateId: certificate.id,
          verificationCode: certificate.verificationCode,
        }).catch((error) => {
          logger.error('Failed to enqueue certificate email', {
            error,
            studentId: student.student_id,
            certificateId: certificate.id,
          });
        });

        logger.info('Certificate issued and email queued', {
          studentId: student.student_id,
          courseId: student.course_id,
          certificateId: certificate.id,
        });

        issued++;
      } catch (error) {
        logger.error('Failed to issue certificate for student', {
          error,
          studentId: student.student_id,
          courseId: student.course_id,
        });
        errors++;
      }
    }

    return { issued, errors };
  } catch (error) {
    logger.error('Failed to issue pending certificates', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Manual trigger for testing purposes
 */
export async function issueCertificatesNow(): Promise<{
  issued: number;
  errors: number;
}> {
  logger.info('Manual certificate issuance triggered');
  return await issuePendingCertificates();
}
