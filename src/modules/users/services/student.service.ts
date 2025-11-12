import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

export interface StudentProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription_status: string;
  subscription_expires_at?: Date;
  total_study_time: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateStudentProfileData {
  name?: string;
}

export class StudentService {
  /**
   * Get student profile by user ID
   */
  async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    try {
      const result = await pool.query(
        `SELECT 
          u.id, u.email, u.name, u.role, u.is_active, u.created_at, u.updated_at,
          s.subscription_status, s.subscription_expires_at, s.total_study_time
         FROM users u
         LEFT JOIN students s ON u.id = s.id
         WHERE u.id = $1 AND u.role = 'student'`,
        [studentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get student profile', error);
      throw error;
    }
  }

  /**
   * Update student profile
   * Only allows updating name (other fields are managed by system)
   */
  async updateStudentProfile(
    studentId: string,
    data: UpdateStudentProfileData
  ): Promise<StudentProfile> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if student exists
      const studentCheck = await client.query(
        'SELECT id FROM users WHERE id = $1 AND role = $2',
        [studentId, 'student']
      );

      if (studentCheck.rows.length === 0) {
        throw new Error('STUDENT_NOT_FOUND');
      }

      // Update user name if provided
      if (data.name) {
        await client.query(
          'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [data.name, studentId]
        );
      }

      // Get updated profile
      const result = await client.query(
        `SELECT 
          u.id, u.email, u.name, u.role, u.is_active, u.created_at, u.updated_at,
          s.subscription_status, s.subscription_expires_at, s.total_study_time
         FROM users u
         LEFT JOIN students s ON u.id = s.id
         WHERE u.id = $1`,
        [studentId]
      );

      await client.query('COMMIT');

      logger.info('Student profile updated', {
        studentId,
        updatedFields: Object.keys(data),
      });

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to update student profile', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get student statistics
   * Returns additional information about the student's activity
   */
  async getStudentStatistics(studentId: string): Promise<{
    totalCoursesStarted: number;
    totalCoursesCompleted: number;
    totalStudyTime: number;
    certificatesEarned: number;
  }> {
    try {
      // This will be implemented when course progress and certificates modules are ready
      // For now, return basic data from students table
      const result = await pool.query(
        'SELECT total_study_time FROM students WHERE id = $1',
        [studentId]
      );

      if (result.rows.length === 0) {
        return {
          totalCoursesStarted: 0,
          totalCoursesCompleted: 0,
          totalStudyTime: 0,
          certificatesEarned: 0,
        };
      }

      return {
        totalCoursesStarted: 0, // Will be calculated from student_progress table
        totalCoursesCompleted: 0, // Will be calculated from student_progress table
        totalStudyTime: result.rows[0].total_study_time || 0,
        certificatesEarned: 0, // Will be calculated from certificates table
      };
    } catch (error) {
      logger.error('Failed to get student statistics', error);
      throw error;
    }
  }
}

export const studentService = new StudentService();
