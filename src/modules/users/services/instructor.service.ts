import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';
import bcrypt from 'bcrypt';

export interface CreateInstructorData {
  email: string;
  name: string;
  bio?: string;
  expertise?: string[];
}

export interface InstructorProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  bio?: string;
  expertise?: string[];
  is_suspended: boolean;
  suspended_at?: Date;
  suspended_by?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class InstructorService {
  /**
   * Create a new instructor
   * Generates a random password and creates both user and instructor records
   */
  async createInstructor(data: CreateInstructorData, createdBy: string): Promise<{ instructor: InstructorProfile; temporaryPassword: string }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [data.email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }

      // Generate temporary password
      const temporaryPassword = this.generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);

      // Create user record
      const userResult = await client.query(
        `INSERT INTO users (email, name, role, password_hash, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, role, is_active, created_at, updated_at`,
        [data.email, data.name, 'instructor', passwordHash, true]
      );

      const user = userResult.rows[0];

      // Create instructor record
      const instructorResult = await client.query(
        `INSERT INTO instructors (id, bio, expertise, is_suspended)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [user.id, data.bio || null, data.expertise || [], false]
      );

      const instructor = instructorResult.rows[0];

      await client.query('COMMIT');

      logger.info('Instructor created', {
        instructorId: user.id,
        email: data.email,
        createdBy,
      });

      return {
        instructor: {
          ...user,
          ...instructor,
        },
        temporaryPassword,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create instructor', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all instructors with pagination
   */
  async getInstructors(page: number = 1, limit: number = 20): Promise<{ instructors: InstructorProfile[]; total: number; page: number; totalPages: number }> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users WHERE role = 'instructor'`
      );
      const total = parseInt(countResult.rows[0].count);

      // Get instructors
      const result = await pool.query(
        `SELECT 
          u.id, u.email, u.name, u.role, u.is_active, u.created_at, u.updated_at,
          i.bio, i.expertise, i.is_suspended, i.suspended_at, i.suspended_by
         FROM users u
         LEFT JOIN instructors i ON u.id = i.id
         WHERE u.role = 'instructor'
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return {
        instructors: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get instructors', error);
      throw error;
    }
  }

  /**
   * Get instructor by ID
   */
  async getInstructorById(instructorId: string): Promise<InstructorProfile | null> {
    try {
      const result = await pool.query(
        `SELECT 
          u.id, u.email, u.name, u.role, u.is_active, u.created_at, u.updated_at,
          i.bio, i.expertise, i.is_suspended, i.suspended_at, i.suspended_by
         FROM users u
         LEFT JOIN instructors i ON u.id = i.id
         WHERE u.id = $1 AND u.role = 'instructor'`,
        [instructorId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get instructor', error);
      throw error;
    }
  }

  /**
   * Suspend or reactivate an instructor
   */
  async toggleInstructorSuspension(
    instructorId: string,
    suspend: boolean,
    adminId: string
  ): Promise<InstructorProfile> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if instructor exists
      const instructorCheck = await client.query(
        'SELECT id FROM users WHERE id = $1 AND role = $2',
        [instructorId, 'instructor']
      );

      if (instructorCheck.rows.length === 0) {
        throw new Error('INSTRUCTOR_NOT_FOUND');
      }

      // Update instructor suspension status
      await client.query(
        `UPDATE instructors 
         SET is_suspended = $1, 
             suspended_at = $2, 
             suspended_by = $3
         WHERE id = $4`,
        [
          suspend,
          suspend ? new Date() : null,
          suspend ? adminId : null,
          instructorId,
        ]
      );

      // Get updated instructor
      const result = await client.query(
        `SELECT 
          u.id, u.email, u.name, u.role, u.is_active, u.created_at, u.updated_at,
          i.bio, i.expertise, i.is_suspended, i.suspended_at, i.suspended_by
         FROM users u
         LEFT JOIN instructors i ON u.id = i.id
         WHERE u.id = $1`,
        [instructorId]
      );

      await client.query('COMMIT');

      logger.info('Instructor suspension toggled', {
        instructorId,
        suspended: suspend,
        adminId,
      });

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to toggle instructor suspension', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate a random temporary password
   */
  private generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}

export const instructorService = new InstructorService();
