import { pool } from '@config/database';
import { emailService } from '@shared/services/email.service';
import { logger } from '@shared/utils/logger';
import { config } from '@config/env';

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
    const html = this.getNewCourseEmailTemplate(student.name, course);
    const text = this.getNewCourseEmailTextTemplate(student.name, course);

    await emailService.sendEmail({
      to: student.email,
      subject: `Novo Curso Disponível: ${course.courseTitle}`,
      html,
      text,
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

  /**
   * Get HTML template for new course email
   */
  private getNewCourseEmailTemplate(
    studentName: string,
    course: NewCourseNotificationData
  ): string {
    const courseUrl = `${config.app.frontendUrl}/courses/${course.courseId}`;

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Curso Disponível</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4F46E5;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .course-card {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .course-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    .course-info {
      padding: 20px;
    }
    .course-title {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin: 0 0 10px 0;
    }
    .course-instructor {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 15px;
    }
    .course-description {
      color: #4b5563;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎓 Novo Curso Disponível!</h1>
  </div>
  <div class="content">
    <p>Olá <strong>${studentName}</strong>,</p>
    
    <p>Temos uma ótima notícia! Um novo curso acaba de ser publicado na plataforma e está disponível para você:</p>
    
    <div class="course-card">
      ${course.coverImage ? `<img src="${course.coverImage}" alt="${course.courseTitle}" class="course-image">` : ''}
      <div class="course-info">
        <h2 class="course-title">${course.courseTitle}</h2>
        <p class="course-instructor">Por ${course.instructorName}</p>
        <p class="course-description">${course.courseDescription}</p>
      </div>
    </div>
    
    <p>Como assinante ativo, você já tem acesso completo a este curso. Comece agora mesmo!</p>
    
    <center>
      <a href="${courseUrl}" class="button">Acessar Curso</a>
    </center>
    
    <p>Aproveite e bons estudos!</p>
    
    <p><strong>Equipe Plataforma EAD</strong></p>
  </div>
  
  <div class="footer">
    <p>Este é um e-mail automático, por favor não responda.</p>
    <p>&copy; ${new Date().getFullYear()} Plataforma EAD. Todos os direitos reservados.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get plain text template for new course email
   */
  private getNewCourseEmailTextTemplate(
    studentName: string,
    course: NewCourseNotificationData
  ): string {
    const courseUrl = `${config.app.frontendUrl}/courses/${course.courseId}`;

    return `
🎓 Novo Curso Disponível!

Olá ${studentName},

Temos uma ótima notícia! Um novo curso acaba de ser publicado na plataforma e está disponível para você:

${course.courseTitle}
Por ${course.instructorName}

${course.courseDescription}

Como assinante ativo, você já tem acesso completo a este curso. Comece agora mesmo!

Acessar Curso: ${courseUrl}

Aproveite e bons estudos!

Equipe Plataforma EAD

---
Este é um e-mail automático, por favor não responda.
© ${new Date().getFullYear()} Plataforma EAD. Todos os direitos reservados.
    `.trim();
  }
}

export const notifyNewCoursesJob = new NotifyNewCoursesJob();
