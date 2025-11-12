import { Request, Response } from 'express';
import { instructorService } from '../services/instructor.service';
import { emailService } from '@shared/services/email.service';
import { config } from '@config/env';
import { logger } from '@shared/utils/logger';

export class InstructorController {
  /**
   * Create a new instructor
   * POST /api/admin/instructors
   */
  async createInstructor(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, bio, expertise } = req.body;
      const adminId = req.user!.userId;

      const result = await instructorService.createInstructor(
        { email, name, bio, expertise },
        adminId
      );

      // Send email notification with credentials
      try {
        await emailService.sendInstructorCredentials({
          name: result.instructor.name,
          email: result.instructor.email,
          temporaryPassword: result.temporaryPassword,
          loginUrl: `${config.apiUrl}/login`,
        });
      } catch (emailError) {
        // Log email error but don't fail the request
        logger.error('Failed to send instructor credentials email', emailError);
      }

      res.status(201).json({
        message: 'Instructor created successfully',
        data: {
          instructor: {
            id: result.instructor.id,
            email: result.instructor.email,
            name: result.instructor.name,
            role: result.instructor.role,
            bio: result.instructor.bio,
            expertise: result.instructor.expertise,
            is_suspended: result.instructor.is_suspended,
            is_active: result.instructor.is_active,
            created_at: result.instructor.created_at,
          },
          temporaryPassword: result.temporaryPassword,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'EMAIL_ALREADY_EXISTS') {
          res.status(409).json({
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'An account with this email already exists',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      logger.error('Failed to create instructor', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create instructor',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get all instructors with pagination
   * GET /api/admin/instructors
   */
  async getInstructors(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await instructorService.getInstructors(page, limit);

      res.status(200).json({
        message: 'Instructors retrieved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to get instructors', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve instructors',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get instructor by ID
   * GET /api/admin/instructors/:id
   */
  async getInstructorById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const instructor = await instructorService.getInstructorById(id);

      if (!instructor) {
        res.status(404).json({
          error: {
            code: 'INSTRUCTOR_NOT_FOUND',
            message: 'Instructor not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      res.status(200).json({
        message: 'Instructor retrieved successfully',
        data: {
          instructor: {
            id: instructor.id,
            email: instructor.email,
            name: instructor.name,
            role: instructor.role,
            bio: instructor.bio,
            expertise: instructor.expertise,
            is_suspended: instructor.is_suspended,
            suspended_at: instructor.suspended_at,
            is_active: instructor.is_active,
            created_at: instructor.created_at,
            updated_at: instructor.updated_at,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get instructor', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve instructor',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Suspend or reactivate an instructor
   * PATCH /api/admin/instructors/:id/suspend
   */
  async toggleSuspension(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { suspend } = req.body;
      const adminId = req.user!.userId;

      const instructor = await instructorService.toggleInstructorSuspension(
        id,
        suspend,
        adminId
      );

      res.status(200).json({
        message: `Instructor ${suspend ? 'suspended' : 'reactivated'} successfully`,
        data: {
          instructor: {
            id: instructor.id,
            email: instructor.email,
            name: instructor.name,
            is_suspended: instructor.is_suspended,
            suspended_at: instructor.suspended_at,
          },
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'INSTRUCTOR_NOT_FOUND') {
          res.status(404).json({
            error: {
              code: 'INSTRUCTOR_NOT_FOUND',
              message: 'Instructor not found',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      logger.error('Failed to toggle instructor suspension', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update instructor status',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }
}

export const instructorController = new InstructorController();
