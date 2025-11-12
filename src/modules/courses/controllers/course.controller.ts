import { Request, Response } from 'express';
import { courseService } from '../services/course.service';
import { logger } from '@shared/utils/logger';

export class CourseController {
  /**
   * Create a new course (draft)
   * POST /api/courses
   */
  async createCourse(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, cover_image, category, workload } = req.body;
      const instructorId = req.user!.userId;

      const course = await courseService.createCourse({
        title,
        description,
        cover_image,
        category,
        workload,
        instructor_id: instructorId,
      });

      res.status(201).json({
        message: 'Course created successfully',
        data: { course },
      });
    } catch (error) {
      logger.error('Failed to create course', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create course',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get course by ID
   * GET /api/courses/:id
   */
  async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      const course = await courseService.getCourseWithDetails(id);

      if (!course) {
        res.status(404).json({
          error: {
            code: 'COURSE_NOT_FOUND',
            message: 'Course not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Check access permissions
      // Instructors can only see their own courses unless published
      if (userRole === 'instructor' && course.instructor_id !== userId && course.status !== 'published') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this course',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Students can only see published courses
      if (userRole === 'student' && course.status !== 'published') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'This course is not available',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      res.status(200).json({
        message: 'Course retrieved successfully',
        data: { course },
      });
    } catch (error) {
      logger.error('Failed to get course', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve course',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Update course
   * PATCH /api/courses/:id
   */
  async updateCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, cover_image, category, workload } = req.body;
      const instructorId = req.user!.userId;

      // Check ownership
      const isOwner = await courseService.isInstructorOwner(id, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this course',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const course = await courseService.updateCourse(id, {
        title,
        description,
        cover_image,
        category,
        workload,
      });

      res.status(200).json({
        message: 'Course updated successfully',
        data: { course },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'COURSE_NOT_FOUND') {
          res.status(404).json({
            error: {
              code: 'COURSE_NOT_FOUND',
              message: 'Course not found',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
        if (error.message === 'NO_UPDATES_PROVIDED') {
          res.status(400).json({
            error: {
              code: 'NO_UPDATES_PROVIDED',
              message: 'No updates provided',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      logger.error('Failed to update course', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update course',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Delete course (only draft)
   * DELETE /api/courses/:id
   */
  async deleteCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const instructorId = req.user!.userId;

      // Check ownership
      const isOwner = await courseService.isInstructorOwner(id, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this course',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      await courseService.deleteCourse(id);

      res.status(200).json({
        message: 'Course deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'COURSE_NOT_FOUND') {
          res.status(404).json({
            error: {
              code: 'COURSE_NOT_FOUND',
              message: 'Course not found',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
        if (error.message === 'CANNOT_DELETE_NON_DRAFT_COURSE') {
          res.status(400).json({
            error: {
              code: 'CANNOT_DELETE_NON_DRAFT_COURSE',
              message: 'Only draft courses can be deleted',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      logger.error('Failed to delete course', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete course',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get instructor's courses
   * GET /api/instructor/courses
   */
  async getInstructorCourses(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await courseService.getCoursesByInstructor(instructorId, page, limit);

      res.status(200).json({
        message: 'Courses retrieved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to get instructor courses', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve courses',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Submit course for approval
   * POST /api/courses/:id/submit
   */
  async submitForApproval(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const instructorId = req.user!.userId;

      // Check ownership
      const isOwner = await courseService.isInstructorOwner(id, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to submit this course',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const course = await courseService.submitForApproval(id);

      res.status(200).json({
        message: 'Course submitted for approval successfully',
        data: { course },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'COURSE_NOT_FOUND') {
          res.status(404).json({
            error: {
              code: 'COURSE_NOT_FOUND',
              message: 'Course not found',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
        if (error.message === 'COURSE_NOT_DRAFT') {
          res.status(400).json({
            error: {
              code: 'COURSE_NOT_DRAFT',
              message: 'Only draft courses can be submitted for approval',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
        if (error.message === 'COURSE_NEEDS_MODULE') {
          res.status(400).json({
            error: {
              code: 'COURSE_NEEDS_MODULE',
              message: 'Course must have at least one module before submission',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
        if (error.message === 'COURSE_NEEDS_LESSON') {
          res.status(400).json({
            error: {
              code: 'COURSE_NEEDS_LESSON',
              message: 'Course must have at least one lesson before submission',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      logger.error('Failed to submit course for approval', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit course for approval',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Approve course (admin only)
   * PATCH /api/admin/courses/:id/approve
   */
  async approveCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.userId;

      const course = await courseService.approveCourse(id, adminId);

      // TODO: Send notification email to instructor

      res.status(200).json({
        message: 'Course approved successfully',
        data: { course },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'COURSE_NOT_FOUND') {
          res.status(404).json({
            error: {
              code: 'COURSE_NOT_FOUND',
              message: 'Course not found',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
        if (error.message === 'COURSE_NOT_PENDING') {
          res.status(400).json({
            error: {
              code: 'COURSE_NOT_PENDING',
              message: 'Only courses pending approval can be approved',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      logger.error('Failed to approve course', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to approve course',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Reject course (admin only)
   * PATCH /api/admin/courses/:id/reject
   */
  async rejectCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user!.userId;

      const course = await courseService.rejectCourse(id, adminId, reason);

      // TODO: Send notification email to instructor with rejection reason

      res.status(200).json({
        message: 'Course rejected successfully',
        data: { course, reason },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'COURSE_NOT_FOUND') {
          res.status(404).json({
            error: {
              code: 'COURSE_NOT_FOUND',
              message: 'Course not found',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
        if (error.message === 'COURSE_NOT_PENDING') {
          res.status(400).json({
            error: {
              code: 'COURSE_NOT_PENDING',
              message: 'Only courses pending approval can be rejected',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      logger.error('Failed to reject course', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reject course',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get courses pending approval (admin only)
   * GET /api/admin/courses/pending
   */
  async getPendingCourses(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await courseService.getPendingCourses(page, limit);

      res.status(200).json({
        message: 'Pending courses retrieved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to get pending courses', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve pending courses',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get published courses with filters
   * GET /api/courses
   */
  async getPublishedCourses(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await courseService.getPublishedCourses(page, limit, category, search);

      res.status(200).json({
        message: 'Published courses retrieved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to get published courses', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve published courses',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }
}

export const courseController = new CourseController();
