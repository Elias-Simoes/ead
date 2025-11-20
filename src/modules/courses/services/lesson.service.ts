import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

export interface CreateLessonData {
  module_id: string;
  title: string;
  description?: string;
  // Old format (for backward compatibility)
  type?: 'video' | 'pdf' | 'text' | 'external_link';
  content?: string;
  // New format (multiple content types)
  video_url?: string;
  video_file_key?: string;
  text_content?: string;
  pdf_file_key?: string;
  pdf_url?: string;
  external_link?: string;
  duration?: number;
  order_index: number;
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  // Old format (for backward compatibility)
  type?: 'video' | 'pdf' | 'text' | 'external_link';
  content?: string;
  // New format (multiple content types)
  video_url?: string;
  video_file_key?: string;
  text_content?: string;
  pdf_file_key?: string;
  pdf_url?: string;
  external_link?: string;
  duration?: number;
  order_index?: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  // Old format fields
  type?: string;
  content?: string;
  // New format fields
  video_url?: string;
  video_file_key?: string;
  text_content?: string;
  pdf_file_key?: string;
  pdf_url?: string;
  external_link?: string;
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
        `INSERT INTO lessons (
          module_id, title, description, type, content, duration, order_index,
          video_url, video_file_key, text_content, pdf_file_key, pdf_url, external_link
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          data.module_id,
          data.title,
          data.description || null,
          data.type || null,
          data.content || null,
          data.duration || null,
          data.order_index,
          data.video_url || null,
          data.video_file_key || null,
          data.text_content || null,
          data.pdf_file_key || null,
          data.pdf_url || null,
          data.external_link || null,
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
  async getLessonById(lessonId: string): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT l.*, c.instructor_id 
         FROM lessons l
         JOIN modules m ON l.module_id = m.id
         JOIN courses c ON m.course_id = c.id
         WHERE l.id = $1`,
        [lessonId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const lesson = result.rows[0];

      // text_content agora é uma string simples, não precisa de conversão
      // Apenas retornar como está

      return lesson;
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

      // text_content agora é uma string simples, retornar como está
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
      if (data.video_url !== undefined) {
        updates.push(`video_url = $${paramCount++}`);
        values.push(data.video_url);
      }
      if (data.video_file_key !== undefined) {
        updates.push(`video_file_key = $${paramCount++}`);
        values.push(data.video_file_key);
      }
      if (data.text_content !== undefined) {
        updates.push(`text_content = $${paramCount++}`);
        values.push(data.text_content);
      }
      if (data.pdf_file_key !== undefined) {
        updates.push(`pdf_file_key = $${paramCount++}`);
        values.push(data.pdf_file_key);
      }
      if (data.pdf_url !== undefined) {
        updates.push(`pdf_url = $${paramCount++}`);
        values.push(data.pdf_url);
      }
      if (data.external_link !== undefined) {
        updates.push(`external_link = $${paramCount++}`);
        values.push(data.external_link);
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
