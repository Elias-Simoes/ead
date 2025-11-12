import { Request, Response } from 'express';
import { studentService } from '../services/student.service';
import { logger } from '@shared/utils/logger';

export class StudentController {
  /**
   * Get student profile
   * GET /api/students/profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user!.userId;

      const profile = await studentService.getStudentProfile(studentId);

      if (!profile) {
        res.status(404).json({
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Student profile not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Get statistics
      const statistics = await studentService.getStudentStatistics(studentId);

      res.status(200).json({
        message: 'Profile retrieved successfully',
        data: {
          profile: {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            subscription_status: profile.subscription_status,
            subscription_expires_at: profile.subscription_expires_at,
            total_study_time: profile.total_study_time,
            is_active: profile.is_active,
            created_at: profile.created_at,
          },
          statistics,
        },
      });
    } catch (error) {
      logger.error('Failed to get student profile', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve profile',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Update student profile
   * PATCH /api/students/profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user!.userId;
      const { name } = req.body;

      const profile = await studentService.updateStudentProfile(studentId, {
        name,
      });

      res.status(200).json({
        message: 'Profile updated successfully',
        data: {
          profile: {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            subscription_status: profile.subscription_status,
            subscription_expires_at: profile.subscription_expires_at,
            total_study_time: profile.total_study_time,
            updated_at: profile.updated_at,
          },
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'STUDENT_NOT_FOUND') {
          res.status(404).json({
            error: {
              code: 'STUDENT_NOT_FOUND',
              message: 'Student not found',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      logger.error('Failed to update student profile', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update profile',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }
}

export const studentController = new StudentController();
