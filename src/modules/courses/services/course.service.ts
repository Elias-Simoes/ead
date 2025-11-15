import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';
import { emailQueueService } from '@modules/notifications/services/email-queue.service';
import { cacheService } from '@shared/services/cache.service';
import { storageService } from '@shared/services/storage.service';

export interface CreateCourseData {
  title: string;
  description?: string;
  cover_image?: string;
  category?: string;
  workload: number;
  instructor_id: string;
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  cover_image?: string;
  category?: string;
  workload?: number;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  category?: string;
  workload: number;
  instructor_id: string;
  status: string;
  version: number;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

export class CourseService {
  private readonly CACHE_TTL = cacheService.getTTLPresets();
  private readonly CACHE_KEYS = {
    COURSE: 'course',
    COURSE_DETAILS: 'course:details',
    PUBLISHED_COURSES: 'courses:published',
    INSTRUCTOR_COURSES: 'courses:instructor',
  };

  /**
   * Enrich course with full cover image URL
   */
  private enrichCourseWithUrls(course: any): any {
    if (!course) return null;
    
    return {
      ...course,
      cover_image_url: storageService.buildPublicUrl(course.cover_image),
    };
  }

  /**
   * Create a new course (draft status)
   */
  async createCourse(data: CreateCourseData): Promise<Course> {
    try {
      const result = await pool.query(
        `INSERT INTO courses (title, description, cover_image, category, workload, instructor_id, status, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          data.title,
          data.description || null,
          data.cover_image || null,
          data.category || null,
          data.workload,
          data.instructor_id,
          'draft',
          1,
        ]
      );

      logger.info('Course created', {
        courseId: result.rows[0].id,
        instructorId: data.instructor_id,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create course', error);
      throw error;
    }
  }

  /**
   * Get course by ID (with cache)
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const cacheKey = cacheService.generateKey(this.CACHE_KEYS.COURSE, courseId);

      const course = await cacheService.getOrSet(
        cacheKey,
        async () => {
          const result = await pool.query(
            'SELECT * FROM courses WHERE id = $1',
            [courseId]
          );

          if (result.rows.length === 0) {
            return null;
          }

          return result.rows[0];
        },
        this.CACHE_TTL.LONG // 1 hour
      );

      return this.enrichCourseWithUrls(course);
    } catch (error) {
      logger.error('Failed to get course', error);
      throw error;
    }
  }

  /**
   * Get course with full details (including modules and lessons) - with cache
   */
  async getCourseWithDetails(courseId: string): Promise<any | null> {
    try {
      const cacheKey = cacheService.generateKey(this.CACHE_KEYS.COURSE_DETAILS, courseId);

      const courseWithDetails = await cacheService.getOrSet(
        cacheKey,
        async () => {
          const client = await pool.connect();

          try {
            // Get course
            const courseResult = await client.query(
              'SELECT * FROM courses WHERE id = $1',
              [courseId]
            );

            if (courseResult.rows.length === 0) {
              return null;
            }

            const course = courseResult.rows[0];

            // Get modules
            const modulesResult = await client.query(
              'SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index ASC',
              [courseId]
            );

            // Get lessons for each module
            const modules = await Promise.all(
              modulesResult.rows.map(async (module) => {
                const lessonsResult = await client.query(
                  'SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index ASC',
                  [module.id]
                );

                return {
                  ...module,
                  lessons: lessonsResult.rows,
                };
              })
            );

            return {
              ...course,
              modules,
            };
          } finally {
            client.release();
          }
        },
        this.CACHE_TTL.LONG // 1 hour
      );

      return this.enrichCourseWithUrls(courseWithDetails);
    } catch (error) {
      logger.error('Failed to get course with details', error);
      throw error;
    }
  }

  /**
   * Update course
   */
  async updateCourse(
    courseId: string,
    data: UpdateCourseData
  ): Promise<Course> {
    try {
      // Build dynamic update query
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
      if (data.cover_image !== undefined) {
        updates.push(`cover_image = $${paramCount++}`);
        values.push(data.cover_image);
      }
      if (data.category !== undefined) {
        updates.push(`category = $${paramCount++}`);
        values.push(data.category);
      }
      if (data.workload !== undefined) {
        updates.push(`workload = $${paramCount++}`);
        values.push(data.workload);
      }

      if (updates.length === 0) {
        throw new Error('NO_UPDATES_PROVIDED');
      }

      values.push(courseId);

      const result = await pool.query(
        `UPDATE courses 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('COURSE_NOT_FOUND');
      }

      // Invalidate cache for this course
      await this.invalidateCourseCache(courseId);

      logger.info('Course updated', { courseId });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update course', error);
      throw error;
    }
  }

  /**
   * Delete course (only if draft)
   */
  async deleteCourse(courseId: string): Promise<void> {
    try {
      // Check if course is draft
      const course = await this.getCourseById(courseId);

      if (!course) {
        throw new Error('COURSE_NOT_FOUND');
      }

      if (course.status !== 'draft') {
        throw new Error('CANNOT_DELETE_NON_DRAFT_COURSE');
      }

      await pool.query('DELETE FROM courses WHERE id = $1', [courseId]);

      logger.info('Course deleted', { courseId });
    } catch (error) {
      logger.error('Failed to delete course', error);
      throw error;
    }
  }

  /**
   * Get courses by instructor
   */
  async getCoursesByInstructor(
    instructorId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ courses: Course[]; total: number; page: number; totalPages: number }> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM courses WHERE instructor_id = $1',
        [instructorId]
      );
      const total = parseInt(countResult.rows[0].count);

      // Get courses
      const result = await pool.query(
        `SELECT * FROM courses 
         WHERE instructor_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [instructorId, limit, offset]
      );

      // Enrich courses with URLs
      const enrichedCourses = result.rows.map(course => this.enrichCourseWithUrls(course));

      return {
        courses: enrichedCourses,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get courses by instructor', error);
      throw error;
    }
  }

  /**
   * Check if instructor owns course
   */
  async isInstructorOwner(courseId: string, instructorId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT id FROM courses WHERE id = $1 AND instructor_id = $2',
        [courseId, instructorId]
      );

      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check course ownership', error);
      throw error;
    }
  }

  /**
   * Submit course for approval
   */
  async submitForApproval(courseId: string): Promise<Course> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get course
      const courseResult = await client.query(
        'SELECT * FROM courses WHERE id = $1',
        [courseId]
      );

      if (courseResult.rows.length === 0) {
        throw new Error('COURSE_NOT_FOUND');
      }

      const course = courseResult.rows[0];

      // Check if course is in draft status
      if (course.status !== 'draft') {
        throw new Error('COURSE_NOT_DRAFT');
      }

      // Check if course has at least 1 module
      const moduleCount = await client.query(
        'SELECT COUNT(*) FROM modules WHERE course_id = $1',
        [courseId]
      );

      if (parseInt(moduleCount.rows[0].count) === 0) {
        throw new Error('COURSE_NEEDS_MODULE');
      }

      // Check if course has at least 1 lesson
      const lessonCount = await client.query(
        `SELECT COUNT(l.*) 
         FROM lessons l
         INNER JOIN modules m ON l.module_id = m.id
         WHERE m.course_id = $1`,
        [courseId]
      );

      if (parseInt(lessonCount.rows[0].count) === 0) {
        throw new Error('COURSE_NEEDS_LESSON');
      }

      // Update course status to pending_approval
      const result = await client.query(
        `UPDATE courses 
         SET status = 'pending_approval'
         WHERE id = $1
         RETURNING *`,
        [courseId]
      );

      await client.query('COMMIT');

      logger.info('Course submitted for approval', { courseId });

      // Get instructor details for email
      const instructorResult = await pool.query(
        'SELECT u.name, u.email FROM users u WHERE u.id = $1',
        [result.rows[0].instructor_id]
      );

      if (instructorResult.rows.length > 0) {
        const instructor = instructorResult.rows[0];
        // Send course submitted email (async, don't wait)
        emailQueueService.enqueueCourseSubmittedEmail({
          instructorName: instructor.name,
          instructorEmail: instructor.email,
          courseTitle: result.rows[0].title,
          courseId: result.rows[0].id,
        }).catch((error) => {
          logger.error('Failed to enqueue course submitted email', error);
        });
      }

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to submit course for approval', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Approve course (admin only)
   */
  async approveCourse(courseId: string, adminId: string): Promise<Course> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get course with full details
      const courseWithDetails = await this.getCourseWithDetails(courseId);

      if (!courseWithDetails) {
        throw new Error('COURSE_NOT_FOUND');
      }

      // Check if course is pending approval
      if (courseWithDetails.status !== 'pending_approval') {
        throw new Error('COURSE_NOT_PENDING');
      }

      // Create version snapshot
      await this.createVersionSnapshot(courseId, courseWithDetails.version, courseWithDetails, adminId, client);

      // Update course status to published
      const result = await client.query(
        `UPDATE courses 
         SET status = 'published', published_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [courseId]
      );

      await client.query('COMMIT');

      // Invalidate cache since course is now published
      await this.invalidateCourseCache(courseId);
      await this.invalidatePublishedCoursesCache();

      logger.info('Course approved', { courseId, adminId });

      // Get instructor details for email
      const instructorResult = await pool.query(
        'SELECT u.name, u.email FROM users u WHERE u.id = $1',
        [result.rows[0].instructor_id]
      );

      if (instructorResult.rows.length > 0) {
        const instructor = instructorResult.rows[0];
        // Send course approved email (async, don't wait)
        emailQueueService.enqueueCourseApprovedEmail({
          instructorName: instructor.name,
          instructorEmail: instructor.email,
          courseTitle: result.rows[0].title,
          courseId: result.rows[0].id,
        }).catch((error) => {
          logger.error('Failed to enqueue course approved email', error);
        });
      }

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to approve course', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a version snapshot of the course
   */
  private async createVersionSnapshot(
    courseId: string,
    version: number,
    snapshot: any,
    userId: string,
    client: any
  ): Promise<void> {
    try {
      await client.query(
        `INSERT INTO course_versions (course_id, version, snapshot, created_by)
         VALUES ($1, $2, $3, $4)`,
        [courseId, version, JSON.stringify(snapshot), userId]
      );

      logger.info('Course version snapshot created', { courseId, version });
    } catch (error) {
      logger.error('Failed to create version snapshot', error);
      throw error;
    }
  }

  /**
   * Reject course (admin only)
   */
  async rejectCourse(courseId: string, adminId: string, reason: string): Promise<Course> {
    try {
      // Get course
      const course = await this.getCourseById(courseId);

      if (!course) {
        throw new Error('COURSE_NOT_FOUND');
      }

      // Check if course is pending approval
      if (course.status !== 'pending_approval') {
        throw new Error('COURSE_NOT_PENDING');
      }

      // Update course status back to draft
      const result = await pool.query(
        `UPDATE courses 
         SET status = 'draft'
         WHERE id = $1
         RETURNING *`,
        [courseId]
      );

      logger.info('Course rejected', { courseId, adminId, reason });

      // Get instructor details for email
      const instructorResult = await pool.query(
        'SELECT u.name, u.email FROM users u WHERE u.id = $1',
        [result.rows[0].instructor_id]
      );

      if (instructorResult.rows.length > 0) {
        const instructor = instructorResult.rows[0];
        // Send course rejected email (async, don't wait)
        emailQueueService.enqueueCourseRejectedEmail({
          instructorName: instructor.name,
          instructorEmail: instructor.email,
          courseTitle: result.rows[0].title,
          courseId: result.rows[0].id,
          reason,
        }).catch((error) => {
          logger.error('Failed to enqueue course rejected email', error);
        });
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to reject course', error);
      throw error;
    }
  }

  /**
   * Get courses pending approval (admin)
   */
  async getPendingCourses(
    page: number = 1,
    limit: number = 20
  ): Promise<{ courses: Course[]; total: number; page: number; totalPages: number }> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await pool.query(
        "SELECT COUNT(*) FROM courses WHERE status = 'pending_approval'"
      );
      const total = parseInt(countResult.rows[0].count);

      // Get courses
      const result = await pool.query(
        `SELECT c.*, u.name as instructor_name, u.email as instructor_email
         FROM courses c
         INNER JOIN users u ON c.instructor_id = u.id
         WHERE c.status = 'pending_approval'
         ORDER BY c.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return {
        courses: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get pending courses', error);
      throw error;
    }
  }

  /**
   * Get published courses with filters
   */
  async getPublishedCourses(
    page: number = 1,
    limit: number = 20,
    category?: string,
    search?: string
  ): Promise<{ courses: Course[]; total: number; page: number; totalPages: number }> {
    try {
      const offset = (page - 1) * limit;

      // Build WHERE clause
      let whereClause = "WHERE c.status = 'published'";
      const params: any[] = [];
      let paramCount = 1;

      if (category) {
        whereClause += ` AND c.category = $${paramCount++}`;
        params.push(category);
      }

      if (search) {
        whereClause += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
        paramCount++;
      }

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM courses c ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Get courses
      params.push(limit, offset);
      const result = await pool.query(
        `SELECT c.*, u.name as instructor_name
         FROM courses c
         INNER JOIN users u ON c.instructor_id = u.id
         ${whereClause}
         ORDER BY c.published_at DESC
         LIMIT $${paramCount++} OFFSET $${paramCount}`,
        params
      );

      return {
        courses: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get published courses', error);
      throw error;
    }
  }

  /**
   * Get course version history
   */
  async getCourseVersions(courseId: string): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT cv.*, u.name as created_by_name
         FROM course_versions cv
         LEFT JOIN users u ON cv.created_by = u.id
         WHERE cv.course_id = $1
         ORDER BY cv.version DESC`,
        [courseId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get course versions', error);
      throw error;
    }
  }

  /**
   * Get specific course version
   */
  async getCourseVersion(courseId: string, version: number): Promise<any | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM course_versions 
         WHERE course_id = $1 AND version = $2`,
        [courseId, version]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get course version', error);
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific course
   */
  private async invalidateCourseCache(courseId: string): Promise<void> {
    try {
      // Invalidate course cache
      await cacheService.delete(cacheService.generateKey(this.CACHE_KEYS.COURSE, courseId));
      
      // Invalidate course details cache
      await cacheService.delete(cacheService.generateKey(this.CACHE_KEYS.COURSE_DETAILS, courseId));
      
      // Invalidate all published courses lists (they contain this course)
      await cacheService.deletePattern(`${this.CACHE_KEYS.PUBLISHED_COURSES}:*`);
      
      logger.debug('Course cache invalidated', { courseId });
    } catch (error) {
      logger.error('Failed to invalidate course cache', { courseId, error });
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }

  /**
   * Invalidate all published courses cache
   */
  private async invalidatePublishedCoursesCache(): Promise<void> {
    try {
      await cacheService.deletePattern(`${this.CACHE_KEYS.PUBLISHED_COURSES}:*`);
      logger.debug('Published courses cache invalidated');
    } catch (error) {
      logger.error('Failed to invalidate published courses cache', error);
    }
  }
}

export const courseService = new CourseService();
