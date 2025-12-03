import { Request, Response } from 'express';
import { moduleService } from '../services/module.service';
import { courseService } from '../services/course.service';
import { logger } from '@shared/utils/logger';

export class ModuleController {
  /**
   * Get module by ID
   * GET /api/modules/:id
   */
  async getModuleById(req: Request, res: Response): Promise<void> {
    try {
      const { id: moduleId } = req.params;
      const instructorId = req.user!.userId;

      // Get module
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
            message: 'You do not have permission to view this module',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      res.status(200).json({
        data: module,
      });
    } catch (error) {
      logger.error('Failed to get module', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get module',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get all modules for a course
   * GET /api/courses/:id/modules
   */
  async getModulesByCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id: courseId } = req.params;

      // Check if course exists
      const course = await courseService.getCourseById(courseId);
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

      const modules = await moduleService.getModulesByCourse(courseId);

      res.status(200).json({
        message: 'Modules retrieved successfully',
        data: modules,
      });
    } catch (error) {
      logger.error('Failed to get modules', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get modules',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Create a new module
   * POST /api/courses/:id/modules
   */
  async createModule(req: Request, res: Response): Promise<void> {
    try {
      const { id: courseId } = req.params;
      const { title, description, order_index } = req.body;
      const instructorId = req.user!.userId;

      // Check if course exists and instructor owns it
      const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to add modules to this course',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Get next order index if not provided
      const finalOrderIndex = order_index !== undefined 
        ? order_index 
        : await moduleService.getNextOrderIndex(courseId);

      const module = await moduleService.createModule({
        course_id: courseId,
        title,
        description,
        order_index: finalOrderIndex,
      });

      res.status(201).json({
        message: 'Module created successfully',
        data: { module },
      });
    } catch (error) {
      logger.error('Failed to create module', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create module',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Update module
   * PATCH /api/modules/:id
   */
  async updateModule(req: Request, res: Response): Promise<void> {
    try {
      const { id: moduleId } = req.params;
      const { title, description, order_index } = req.body;
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
            message: 'You do not have permission to update this module',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const updatedModule = await moduleService.updateModule(moduleId, {
        title,
        description,
        order_index,
      });

      res.status(200).json({
        message: 'Module updated successfully',
        data: { module: updatedModule },
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

      logger.error('Failed to update module', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update module',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Delete module
   * DELETE /api/modules/:id
   */
  async deleteModule(req: Request, res: Response): Promise<void> {
    try {
      const { id: moduleId } = req.params;
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
            message: 'You do not have permission to delete this module',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      await moduleService.deleteModule(moduleId);

      res.status(200).json({
        message: 'Module deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'MODULE_HAS_ASSESSMENT') {
        res.status(400).json({
          error: {
            code: 'MODULE_HAS_ASSESSMENT',
            message: 'Cannot delete module that has an assessment. Delete the assessment first.',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      logger.error('Failed to delete module', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete module',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }
}

export const moduleController = new ModuleController();
