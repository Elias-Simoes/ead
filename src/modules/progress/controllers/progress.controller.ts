import { Request, Response } from 'express';
import { progressService } from '../services/progress.service';
import { logger } from '@shared/utils/logger';

export class ProgressController {
  /**
   * POST /api/courses/:courseId/progress
   * Mark a lesson as completed
   */
  async markLessonCompleted(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { lessonId } = req.body;
      const studentId = req.user!.userId;

      if (!lessonId) {
        res.status(400).json({
          error: {
            code: 'MISSING_LESSON_ID',
            message: 'Lesson ID is required',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const result = await progressService.markLessonCompleted(
        studentId,
        courseId,
        lessonId
      );

      res.status(200).json({
        success: true,
        data: {
          progressPercentage: result.progressPercentage,
          completedLessonsCount: result.completedLessons.length,
          isCompleted: result.isCompleted,
        },
        message: result.isCompleted
          ? 'Congratulations! You have completed this course'
          : 'Lesson marked as completed',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'LESSON_NOT_IN_COURSE') {
          res.status(400).json({
            error: {
              code: 'LESSON_NOT_IN_COURSE',
              message: 'The specified lesson does not belong to this course',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }

        if (error.message === 'COURSE_HAS_NO_LESSONS') {
          res.status(400).json({
            error: {
              code: 'COURSE_HAS_NO_LESSONS',
              message: 'This course has no lessons',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      logger.error('Failed to mark lesson as completed', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update progress',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * GET /api/students/courses/progress
   * Get all progress for the authenticated student
   */
  async getStudentProgress(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user!.userId;

      const progress = await progressService.getStudentProgress(studentId);

      res.status(200).json({
        success: true,
        data: progress,
        count: progress.length,
      });
    } catch (error) {
      logger.error('Failed to get student progress', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve progress',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * PATCH /api/courses/:id/favorite
   * Toggle favorite status for a course
   */
  async toggleFavorite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const studentId = req.user!.userId;

      const isFavorite = await progressService.toggleFavorite(studentId, id);

      res.status(200).json({
        success: true,
        data: {
          courseId: id,
          isFavorite,
        },
        message: isFavorite
          ? 'Course added to favorites'
          : 'Course removed from favorites',
      });
    } catch (error) {
      logger.error('Failed to toggle favorite', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update favorite status',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * GET /api/students/courses/history
   * Get student course history categorized by status
   */
  async getStudentHistory(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user!.userId;

      const history = await progressService.getStudentHistory(studentId);

      res.status(200).json({
        success: true,
        data: history,
        summary: {
          started: history.started.length,
          inProgress: history.inProgress.length,
          completed: history.completed.length,
          total: history.started.length + history.inProgress.length + history.completed.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get student history', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve course history',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }
}

export const progressController = new ProgressController();
