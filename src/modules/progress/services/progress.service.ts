import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';
import { storageService } from '@shared/services/storage.service';
import { cacheService } from '@shared/services/cache.service';

export interface CourseContent {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  workload: number;
  instructorId: string;
  instructorName: string;
  modules: ModuleWithLessons[];
  totalLessons: number;
  studentProgress?: {
    completedLessons: string[];
    progressPercentage: number;
    isFavorite: boolean;
    lastAccessedAt: Date | null;
    startedAt: Date;
    completedAt: Date | null;
  };
}

export interface ModuleWithLessons {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: LessonInfo[];
}

export interface LessonInfo {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'text' | 'external_link';
  duration: number | null;
  orderIndex: number;
}

export interface LessonContent {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'text' | 'external_link';
  content: string;
  duration: number | null;
  orderIndex: number;
  signedUrl?: string;
}

export class ProgressService {
  private readonly CACHE_TTL = cacheService.getTTLPresets();
  private readonly CACHE_KEYS = {
    STUDENT_PROGRESS: 'progress:student',
    COURSE_CONTENT: 'progress:course:content',
  };

  /**
   * Get course content with modules and lessons
   */
  async getCourseContent(courseId: string, studentId?: string): Promise<CourseContent> {
    try {
      // Get course details
      const courseResult = await pool.query(
        `SELECT c.id, c.title, c.description, c.cover_image, c.category, 
                c.workload, c.instructor_id, u.name as instructor_name
         FROM courses c
         JOIN instructors i ON c.instructor_id = i.id
         JOIN users u ON i.id = u.id
         WHERE c.id = $1 AND c.status = 'published'`,
        [courseId]
      );

      if (courseResult.rows.length === 0) {
        throw new Error('COURSE_NOT_FOUND');
      }

      const course = courseResult.rows[0];

      // Get modules with lessons
      const modulesResult = await pool.query(
        `SELECT m.id, m.title, m.description, m.order_index,
                l.id as lesson_id, l.title as lesson_title, 
                l.description as lesson_description, l.type as lesson_type,
                l.duration as lesson_duration, l.order_index as lesson_order
         FROM modules m
         LEFT JOIN lessons l ON m.id = l.module_id
         WHERE m.course_id = $1
         ORDER BY m.order_index, l.order_index`,
        [courseId]
      );

      // Group lessons by module
      const modulesMap = new Map<string, ModuleWithLessons>();
      let totalLessons = 0;

      for (const row of modulesResult.rows) {
        if (!modulesMap.has(row.id)) {
          modulesMap.set(row.id, {
            id: row.id,
            title: row.title,
            description: row.description,
            orderIndex: row.order_index,
            lessons: [],
          });
        }

        if (row.lesson_id) {
          modulesMap.get(row.id)!.lessons.push({
            id: row.lesson_id,
            title: row.lesson_title,
            description: row.lesson_description,
            type: row.lesson_type,
            duration: row.lesson_duration,
            orderIndex: row.lesson_order,
          });
          totalLessons++;
        }
      }

      const modules = Array.from(modulesMap.values());

      // Get student progress if studentId provided
      let studentProgress;
      if (studentId) {
        const progressResult = await pool.query(
          `SELECT completed_lessons, progress_percentage, is_favorite,
                  last_accessed_at, started_at, completed_at
           FROM student_progress
           WHERE student_id = $1 AND course_id = $2`,
          [studentId, courseId]
        );

        if (progressResult.rows.length > 0) {
          const progress = progressResult.rows[0];
          studentProgress = {
            completedLessons: progress.completed_lessons || [],
            progressPercentage: parseFloat(progress.progress_percentage),
            isFavorite: progress.is_favorite,
            lastAccessedAt: progress.last_accessed_at,
            startedAt: progress.started_at,
            completedAt: progress.completed_at,
          };
        }
      }

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        coverImage: course.cover_image,
        category: course.category,
        workload: course.workload,
        instructorId: course.instructor_id,
        instructorName: course.instructor_name,
        modules,
        totalLessons,
        studentProgress,
      };
    } catch (error) {
      logger.error('Failed to get course content', { courseId, error });
      throw error;
    }
  }

  /**
   * Get lesson content with signed URL for videos
   */
  async getLessonContent(lessonId: string): Promise<LessonContent> {
    try {
      const result = await pool.query(
        `SELECT l.id, l.module_id, l.title, l.description, l.type, 
                l.content, l.duration, l.order_index
         FROM lessons l
         JOIN modules m ON l.module_id = m.id
         JOIN courses c ON m.course_id = c.id
         WHERE l.id = $1 AND c.status = 'published'`,
        [lessonId]
      );

      if (result.rows.length === 0) {
        throw new Error('LESSON_NOT_FOUND');
      }

      const lesson = result.rows[0];

      // Generate signed URL for video content
      let signedUrl: string | undefined;
      if (lesson.type === 'video' && lesson.content) {
        // Extract key from URL or use content as key
        const key = lesson.content.includes('/')
          ? lesson.content.split('/').slice(-2).join('/')
          : lesson.content;

        // Generate signed URL valid for 4 hours
        signedUrl = await storageService.getSignedUrl(key, 14400);
      }

      return {
        id: lesson.id,
        moduleId: lesson.module_id,
        title: lesson.title,
        description: lesson.description,
        type: lesson.type,
        content: lesson.content,
        duration: lesson.duration,
        orderIndex: lesson.order_index,
        signedUrl,
      };
    } catch (error) {
      logger.error('Failed to get lesson content', { lessonId, error });
      throw error;
    }
  }

  /**
   * Mark a lesson as completed and update progress
   */
  async markLessonCompleted(
    studentId: string,
    courseId: string,
    lessonId: string
  ): Promise<{
    progressPercentage: number;
    completedLessons: string[];
    isCompleted: boolean;
  }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify lesson belongs to course
      const lessonCheck = await client.query(
        `SELECT l.id 
         FROM lessons l
         JOIN modules m ON l.module_id = m.id
         WHERE l.id = $1 AND m.course_id = $2`,
        [lessonId, courseId]
      );

      if (lessonCheck.rows.length === 0) {
        throw new Error('LESSON_NOT_IN_COURSE');
      }

      // Get total lessons in course
      const totalLessonsResult = await client.query(
        `SELECT COUNT(l.id) as total
         FROM lessons l
         JOIN modules m ON l.module_id = m.id
         WHERE m.course_id = $1`,
        [courseId]
      );

      const totalLessons = parseInt(totalLessonsResult.rows[0].total);

      if (totalLessons === 0) {
        throw new Error('COURSE_HAS_NO_LESSONS');
      }

      // Get or create progress record
      const progressResult = await client.query(
        `SELECT id, completed_lessons
         FROM student_progress
         WHERE student_id = $1 AND course_id = $2`,
        [studentId, courseId]
      );

      let completedLessons: string[] = [];
      let progressId: string;

      if (progressResult.rows.length === 0) {
        // Create new progress record
        const insertResult = await client.query(
          `INSERT INTO student_progress 
           (student_id, course_id, completed_lessons, progress_percentage, last_accessed_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING id, completed_lessons`,
          [studentId, courseId, [lessonId], 0]
        );
        progressId = insertResult.rows[0].id;
        completedLessons = [lessonId];
      } else {
        progressId = progressResult.rows[0].id;
        completedLessons = progressResult.rows[0].completed_lessons || [];

        // Add lesson if not already completed
        if (!completedLessons.includes(lessonId)) {
          completedLessons.push(lessonId);
        }
      }

      // Calculate progress percentage
      const progressPercentage = (completedLessons.length / totalLessons) * 100;
      const isCompleted = progressPercentage >= 100;

      // Update progress record
      await client.query(
        `UPDATE student_progress
         SET completed_lessons = $1,
             progress_percentage = $2,
             last_accessed_at = CURRENT_TIMESTAMP,
             completed_at = CASE WHEN $3 THEN CURRENT_TIMESTAMP ELSE completed_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [completedLessons, progressPercentage, isCompleted, progressId]
      );

      await client.query('COMMIT');

      // Invalidate student progress cache
      await this.invalidateStudentProgressCache(studentId);

      logger.info('Lesson marked as completed', {
        studentId,
        courseId,
        lessonId,
        progressPercentage,
        completedLessons: completedLessons.length,
        totalLessons,
      });

      return {
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        completedLessons,
        isCompleted,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to mark lesson as completed', { studentId, courseId, lessonId, error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update last accessed time for a course
   */
  async updateLastAccessed(studentId: string, courseId: string): Promise<void> {
    try {
      // Check if progress record exists
      const result = await pool.query(
        `SELECT id FROM student_progress
         WHERE student_id = $1 AND course_id = $2`,
        [studentId, courseId]
      );

      if (result.rows.length === 0) {
        // Create new progress record
        await pool.query(
          `INSERT INTO student_progress 
           (student_id, course_id, last_accessed_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)`,
          [studentId, courseId]
        );
      } else {
        // Update existing record
        await pool.query(
          `UPDATE student_progress
           SET last_accessed_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE student_id = $1 AND course_id = $2`,
          [studentId, courseId]
        );
      }
    } catch (error) {
      logger.error('Failed to update last accessed', { studentId, courseId, error });
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Get all progress for a student (with cache)
   */
  async getStudentProgress(studentId: string): Promise<any[]> {
    try {
      const cacheKey = cacheService.generateKey(this.CACHE_KEYS.STUDENT_PROGRESS, studentId);

      return await cacheService.getOrSet(
        cacheKey,
        async () => {
          const result = await pool.query(
            `SELECT sp.course_id, sp.progress_percentage, sp.is_favorite,
                    sp.last_accessed_at, sp.started_at, sp.completed_at,
                    c.title, c.description, c.cover_image, c.category, c.workload,
                    u.name as instructor_name,
                    (SELECT COUNT(*) FROM lessons l 
                     JOIN modules m ON l.module_id = m.id 
                     WHERE m.course_id = c.id) as total_lessons,
                    array_length(sp.completed_lessons, 1) as completed_lessons_count
             FROM student_progress sp
             JOIN courses c ON sp.course_id = c.id
             JOIN instructors i ON c.instructor_id = i.id
             JOIN users u ON i.id = u.id
             WHERE sp.student_id = $1
             ORDER BY sp.last_accessed_at DESC NULLS LAST`,
            [studentId]
          );

          return result.rows.map((row) => ({
            courseId: row.course_id,
            title: row.title,
            description: row.description,
            coverImage: row.cover_image,
            category: row.category,
            workload: row.workload,
            instructorName: row.instructor_name,
            progressPercentage: parseFloat(row.progress_percentage),
            isFavorite: row.is_favorite,
            lastAccessedAt: row.last_accessed_at,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            totalLessons: parseInt(row.total_lessons),
            completedLessonsCount: row.completed_lessons_count || 0,
          }));
        },
        this.CACHE_TTL.SHORT // 5 minutes
      );
    } catch (error) {
      logger.error('Failed to get student progress', { studentId, error });
      throw error;
    }
  }

  /**
   * Toggle favorite status for a course
   */
  async toggleFavorite(studentId: string, courseId: string): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if progress record exists
      const result = await client.query(
        `SELECT id, is_favorite FROM student_progress
         WHERE student_id = $1 AND course_id = $2`,
        [studentId, courseId]
      );

      let isFavorite: boolean;

      if (result.rows.length === 0) {
        // Create new progress record with favorite = true
        await client.query(
          `INSERT INTO student_progress 
           (student_id, course_id, is_favorite, last_accessed_at)
           VALUES ($1, $2, true, CURRENT_TIMESTAMP)`,
          [studentId, courseId]
        );
        isFavorite = true;
      } else {
        // Toggle favorite status
        isFavorite = !result.rows[0].is_favorite;
        await client.query(
          `UPDATE student_progress
           SET is_favorite = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE student_id = $2 AND course_id = $3`,
          [isFavorite, studentId, courseId]
        );
      }

      await client.query('COMMIT');

      // Invalidate student progress cache
      await this.invalidateStudentProgressCache(studentId);

      logger.info('Favorite status toggled', { studentId, courseId, isFavorite });

      return isFavorite;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to toggle favorite', { studentId, courseId, error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get student course history categorized by status
   */
  async getStudentHistory(studentId: string): Promise<{
    started: any[];
    inProgress: any[];
    completed: any[];
  }> {
    try {
      const allProgress = await this.getStudentProgress(studentId);

      const started = allProgress.filter(
        (p) => p.progressPercentage === 0 || (p.progressPercentage < 10 && !p.completedAt)
      );

      const inProgress = allProgress.filter(
        (p) => p.progressPercentage >= 10 && p.progressPercentage < 100 && !p.completedAt
      );

      const completed = allProgress.filter((p) => p.completedAt !== null);

      return {
        started,
        inProgress,
        completed,
      };
    } catch (error) {
      logger.error('Failed to get student history', { studentId, error });
      throw error;
    }
  }

  /**
   * Invalidate student progress cache
   */
  private async invalidateStudentProgressCache(studentId: string): Promise<void> {
    try {
      const cacheKey = cacheService.generateKey(this.CACHE_KEYS.STUDENT_PROGRESS, studentId);
      await cacheService.delete(cacheKey);
      logger.debug('Student progress cache invalidated', { studentId });
    } catch (error) {
      logger.error('Failed to invalidate student progress cache', { studentId, error });
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }
}

export const progressService = new ProgressService();
