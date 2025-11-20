import { Request, Response } from 'express';
import { lessonService } from '../services/lesson.service';
import { moduleService } from '../services/module.service';
import { courseService } from '../services/course.service';
import { logger } from '@shared/utils/logger';

export class LessonController {
  /**
   * Get lesson by ID
   * GET /api/lessons/:id
   */
  async getLessonById(req: Request, res: Response): Promise<void> {
    try {
      const { id: lessonId } = req.params;
      const instructorId = req.user!.userId;

      // Get lesson
      const lesson = await lessonService.getLessonById(lessonId);
      if (!lesson) {
        res.status(404).json({
          error: {
            code: 'LESSON_NOT_FOUND',
            message: 'Lesson not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Get module to get course_id
      const module = await moduleService.getModuleById(lesson.module_id);
      if (!module) {
        res.status(404).json({
          error: {
            code: 'MODULE_NOT_FOUND',
            message: 'Module not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Check if instructor owns the course
      const isOwner = await courseService.isInstructorOwner(module.course_id, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this lesson',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      res.status(200).json({
        data: lesson,
      });
    } catch (error) {
      logger.error('Failed to get lesson', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get lesson',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Create a new lesson
   * POST /api/modules/:id/lessons
   */
  async createLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id: moduleId } = req.params;
      const { 
        title, 
        description, 
        type, 
        content, 
        duration, 
        order_index,
        video_url,
        video_file_key,
        text_content,
        pdf_file_key,
        pdf_url,
        external_link
      } = req.body;
      const instructorId = req.user!.userId;

      // Get module to check course ownership
      const module = await moduleService.getModuleById(moduleId);
      if (!module) {
        res.status(404).json({
          error: {
            code: 'MODULE_NOT_FOUND',
            message: 'Module not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Check if instructor owns the course
      const isOwner = await courseService.isInstructorOwner(module.course_id, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to add lessons to this module',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Get next order index if not provided
      const finalOrderIndex = order_index !== undefined 
        ? order_index 
        : await lessonService.getNextOrderIndex(moduleId);

      const lesson = await lessonService.createLesson({
        module_id: moduleId,
        title,
        description,
        type,
        content,
        duration,
        order_index: finalOrderIndex,
        video_url,
        video_file_key,
        text_content,
        pdf_file_key,
        pdf_url,
        external_link,
      });

      res.status(201).json({
        message: 'Lesson created successfully',
        data: lesson,
      });
    } catch (error) {
      logger.error('Failed to create lesson', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create lesson',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Update lesson
   * PATCH /api/lessons/:id
   */
  async updateLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id: lessonId } = req.params;
      const { 
        title, 
        description, 
        type, 
        content, 
        duration, 
        order_index,
        video_url,
        video_file_key,
        text_content,
        pdf_file_key,
        pdf_url,
        external_link
      } = req.body;
      const instructorId = req.user!.userId;

      // Log para debug
      logger.info('Updating lesson', {
        lessonId,
        hasTextContent: !!text_content,
        textContentLength: text_content?.length,
        hasVideoUrl: !!video_url,
        hasExternalLink: !!external_link,
      });

      // Get lesson to check course ownership
      const lesson = await lessonService.getLessonById(lessonId);
      if (!lesson) {
        res.status(404).json({
          error: {
            code: 'LESSON_NOT_FOUND',
            message: 'Lesson not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Get module to get course_id
      const module = await moduleService.getModuleById(lesson.module_id);
      if (!module) {
        res.status(404).json({
          error: {
            code: 'MODULE_NOT_FOUND',
            message: 'Module not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Check if instructor owns the course
      const isOwner = await courseService.isInstructorOwner(module.course_id, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this lesson',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const updatedLesson = await lessonService.updateLesson(lessonId, {
        title,
        description,
        type,
        content,
        duration,
        order_index,
        video_url,
        video_file_key,
        text_content,
        pdf_file_key,
        pdf_url,
        external_link,
      });

      res.status(200).json({
        message: 'Lesson updated successfully',
        data: updatedLesson,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_UPDATES_PROVIDED') {
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

      logger.error('Failed to update lesson', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update lesson',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Delete lesson
   * DELETE /api/lessons/:id
   */
  async deleteLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id: lessonId } = req.params;
      const instructorId = req.user!.userId;

      // Get lesson to check course ownership
      const lesson = await lessonService.getLessonById(lessonId);
      if (!lesson) {
        res.status(404).json({
          error: {
            code: 'LESSON_NOT_FOUND',
            message: 'Lesson not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Get module to get course_id
      const module = await moduleService.getModuleById(lesson.module_id);
      if (!module) {
        res.status(404).json({
          error: {
            code: 'MODULE_NOT_FOUND',
            message: 'Module not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Check if instructor owns the course
      const isOwner = await courseService.isInstructorOwner(module.course_id, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this lesson',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      await lessonService.deleteLesson(lessonId);

      res.status(200).json({
        message: 'Lesson deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete lesson', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete lesson',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }
}

export const lessonController = new LessonController();
