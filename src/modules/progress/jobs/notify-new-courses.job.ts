import { pool } from '@config/database';
import { emailQueueService } from '@modules/notifications/services/email-queue.service';
import { logger } from '@shared/utils/logger';

export interface NewCourseNotificationData {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  instructorName: string;
  coverImage: string;
}

/**
 * Job to notify students about newly published courses
 * This should be run periodically (e.g., daily) or triggered when a course is published
 */
export class NotifyNewCoursesJob {
  /**
   * Find courses that were recently published and haven't been notified yet
   */
  async findNewCourses(): Promise<NewCourseNotificationData[]> {
    try {
      // Find courses published in the last 24 hours that haven't been notified
      const result = await pool.query(
        `SELECT c.id, c.title, c.description, c.cover_image, u.name as instructor_name
         FROM courses c
         JOIN instructors i ON c.instructor_id = i.id
         JOIN users u ON i.id = u.id
         WHERE c.status = 'published'
           AND c.published_at >= NOW() - INTERVAL '24 hours'
           AND NOT EXISTS (
             SELECT 1 FROM course_notifications cn 
             WHERE cn.course_id = c.id
           )
         ORDER BY c.published_at DESC`
      );

      return result.rows.map((row) => ({
        courseId: row.id,
        courseTitle: row.title,
        courseDescription: row.description,
        instructorName: row.instructor_name,
        coverImage: row.cover_image,
      }));
    } catch (error) {
      logger.error('Failed to find new courses', error);
      throw error;
    }
  }

  /**
   * Get all students with active subscriptions
   */
  async getActiveStudents(): Promise<Array<{ id: string; email: string; name: string }>> {
    try {
      const result = await pool.query(
        `SELECT u.id, u.email, u.name
         FROM users u
         JOIN students s ON u.id = s.id
         WHERE u.role = 'student'
           AND u.is_active = true
           AND s.subscription_status = 'active'
           AND (s.subscription_expires_at IS NULL OR s.subscription_expires_at > NOW())`
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get active students', error);
      throw error;
    }
  }

  /**
   * Send notification email about new course
   */
  async sendNewCourseEmail(
    student: { email: string; name: string },
    course: NewCourseNotificationData
  ): Promise<void> {
    await emailQueueService.enqueueNewCoursePublishedEmail({
      studentName: student.name,
      studentEmail: student.email,
      courseTitle: course.courseTitle,
      courseDescription: course.courseDescription,
      instructorName: course.instructorName,
      courseId: course.courseId,
    });
  }

  /**
   * Mark course as notified
   */
  async markCourseAsNotified(courseId: string): Promise<void> {
    try {
      // Create course_notifications table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS course_notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          students_notified INTEGER DEFAULT 0,
          UNIQUE(course_id)
        )
      `);

      await pool.query(
        `INSERT INTO course_notifications (course_id, notified_at)
         VALUES ($1, CURRENT_TIMESTAMP)
         ON CONFLICT (course_id) DO NOTHING`,
        [courseId]
      );
    } catch (error) {
      logger.error('Failed to mark course as notified', { courseId, error });
      throw error;
    }
  }

  /**
   * Update notification count
   */
  async updateNotificationCount(courseId: string, count: number): Promise<void> {
    try {
      await pool.query(
        `UPDATE course_notifications
         SET students_notified = $1
         WHERE course_id = $2`,
        [count, courseId]
      );
    } catch (error) {
      logger.error('Failed to update notification count', { courseId, error });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Run the notification job
   */
  async run(): Promise<void> {
    try {
      logger.info('Starting new courses notification job');

      // Find new courses
      const newCourses = await this.findNewCourses();

      if (newCourses.length === 0) {
        logger.info('No new courses to notify');
        return;
      }

      logger.info(`Found ${newCourses.length} new course(s) to notify`);

      // Get active students
      const activeStudents = await this.getActiveStudents();

      if (activeStudents.length === 0) {
        logger.info('No active students to notify');
        // Still mark courses as notified
        for (const course of newCourses) {
          await this.markCourseAsNotified(course.courseId);
        }
        return;
      }

      logger.info(`Found ${activeStudents.length} active student(s)`);

      // Send notifications for each course
      for (const course of newCourses) {
        let successCount = 0;
        let failCount = 0;

        logger.info(`Notifying students about course: ${course.courseTitle}`);

        // Send emails to all active students
        for (const student of activeStudents) {
          try {
            await this.sendNewCourseEmail(student, course);
            successCount++;
          } catch (error) {
            logger.error('Failed to send notification email', {
              studentId: student.id,
              courseId: course.courseId,
              error,
            });
            failCount++;
          }
        }

        // Mark course as notified
        await this.markCourseAsNotified(course.courseId);
        await this.updateNotificationCount(course.courseId, successCount);

        logger.info('Course notification completed', {
          courseId: course.courseId,
          courseTitle: course.courseTitle,
          successCount,
          failCount,
        });
      }

      logger.info('New courses notification job completed');
    } catch (error) {
      logger.error('New courses notification job failed', error);
      throw error;
    }
  }
}

export const notifyNewCoursesJob = new NotifyNewCoursesJob();
