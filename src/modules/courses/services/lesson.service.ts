import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

export interface CreateLessonData {
  module_id: string;
  title: string;
  description?: string;
  type: 'video' | 'pdf' | 'text' | 'external_link';
  content: string;
  duration?: number;
  order_index: number;
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  type?: 'video' | 'pdf' | 'text' | 'external_link';
  content?: string;
  duration?: number;
  order_index?: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  type: string;
  content: string;
  duration?: number;
  order_index: number;
  created_at: Date;
}

export class LessonService {
  /**
   * Create a new lesson
   */
  async createLesson(data: CreateLessonData): Promise<Lesson> {
    try {
      const result = await pool.query(
        `INSERT INTO lessons (module_id, title, description, type, content, duration, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          data.module_id,
          data.title,
          data.description || null,
          data.type,
          data.content,
          data.duration || null,
          data.order_index,
        ]
      );

      logger.info('Lesson created', {
        lessonId: result.rows[0].id,
        moduleId: data.module_id,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create lesson', error);
      throw error;
    }
  }

  /**
   * Get lesson by ID
   */
  async getLessonById(lessonId: string): Promise<Lesson | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM lessons WHERE id = $1',
        [lessonId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get lesson', error);
      throw error;
    }
  }

  /**
   * Get lessons by module
   */
  async getLessonsByModule(moduleId: string): Promise<Lesson[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index ASC',
        [moduleId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get lessons', error);
      throw error;
    }
  }

  /**
   * Update lesson
   */
  async updateLesson(lessonId: string, data: UpdateLessonData): Promise<Lesson> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(data.title);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.type !== undefined) {
        updates.push(`type = $${paramCount++}`);
        values.push(data.type);
      }
      if (data.content !== undefined) {
        updates.push(`content = $${paramCount++}`);
        values.push(data.content);
      }
      if (data.duration !== undefined) {
        updates.push(`duration = $${paramCount++}`);
        values.push(data.duration);
      }
      if (data.order_index !== undefined) {
        updates.push(`order_index = $${paramCount++}`);
        values.push(data.order_index);
      }

      if (updates.length === 0) {
        throw new Error('NO_UPDATES_PROVIDED');
      }

      values.push(lessonId);

      const result = await pool.query(
        `UPDATE lessons 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('LESSON_NOT_FOUND');
      }

      logger.info('Lesson updated', { lessonId });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update lesson', error);
      throw error;
    }
  }

  /**
   * Delete lesson
   */
  async deleteLesson(lessonId: string): Promise<void> {
    try {
      const result = await pool.query(
        'DELETE FROM lessons WHERE id = $1 RETURNING id',
        [lessonId]
      );

      if (result.rows.length === 0) {
        throw new Error('LESSON_NOT_FOUND');
      }

      logger.info('Lesson deleted', { lessonId });
    } catch (error) {
      logger.error('Failed to delete lesson', error);
      throw error;
    }
  }

  /**
   * Get next order index for a module
   */
  async getNextOrderIndex(moduleId: string): Promise<number> {
    try {
      const result = await pool.query(
        'SELECT COALESCE(MAX(order_index), 0) + 1 as next_index FROM lessons WHERE module_id = $1',
        [moduleId]
      );

      return result.rows[0].next_index;
    } catch (error) {
      logger.error('Failed to get next order index', error);
      throw error;
    }
  }

  /**
   * Count lessons in a module
   */
  async countLessonsInModule(moduleId: string): Promise<number> {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM lessons WHERE module_id = $1',
        [moduleId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to count lessons', error);
      throw error;
    }
  }

  /**
   * Count total lessons in a course
   */
  async countLessonsInCourse(courseId: string): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT COUNT(l.*) 
         FROM lessons l
         INNER JOIN modules m ON l.module_id = m.id
         WHERE m.course_id = $1`,
        [courseId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to count lessons in course', error);
      throw error;
    }
  }
}

export const lessonService = new LessonService();
