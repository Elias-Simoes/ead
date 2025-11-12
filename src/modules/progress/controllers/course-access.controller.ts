import { Request, Response } from 'express';
import { progressService } from '../services/progress.service';
import { logger } from '@shared/utils/logger';

export class CourseAccessController {
  /**
   * GET /api/courses/:id/content
   * Get course content with modules and lessons
   */
  async getCourseContent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const studentId = req.user?.userId;

      const courseContent = await progressService.getCourseContent(id, studentId);

      res.status(200).json({
        success: true,
        data: courseContent,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'COURSE_NOT_FOUND') {
          res.status(404).json({
            error: {
              code: 'COURSE_NOT_FOUND',
              message: 'Course not found or not published',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      logger.error('Failed to get course content', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve course content',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * GET /api/lessons/:id/content
   * Get lesson content with signed URL for videos
   */
  async getLessonContent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const lessonContent = await progressService.getLessonContent(id);

      res.status(200).json({
        success: true,
        data: lessonContent,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'LESSON_NOT_FOUND') {
          res.status(404).json({
            error: {
              code: 'LESSON_NOT_FOUND',
              message: 'Lesson not found or course not published',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      logger.error('Failed to get lesson content', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve lesson content',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }
}

export const courseAccessController = new CourseAccessController();
