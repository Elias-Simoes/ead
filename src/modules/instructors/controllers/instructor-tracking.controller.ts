import { Request, Response } from 'express';
import { instructorTrackingService } from '../services/instructor-tracking.service';
import { logger } from '@shared/utils/logger';

export class InstructorTrackingController {
  /**
   * GET /api/instructor/courses
   * Get all courses for the authenticated instructor
   */
  async getInstructorCourses(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;

      const courses = await instructorTrackingService.getInstructorCourses(instructorId);

      res.status(200).json({
        success: true,
        data: {
          totalCourses: courses.length,
          courses,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get instructor courses', { error });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get instructor courses',
        },
      });
    }
  }

  /**
   * GET /api/instructor/courses/:id/students
   * Get all students enrolled in a course
   */
  async getEnrolledStudents(req: Request, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      const instructorId = req.user!.userId;

      const students = await instructorTrackingService.getEnrolledStudents(courseId, instructorId);

      res.status(200).json({
        success: true,
        data: {
          courseId,
          totalStudents: students.length,
          students,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get enrolled students', { error });

      if (error.message === 'COURSE_NOT_FOUND_OR_NOT_OWNED') {
        res.status(404).json({
          success: false,
          error: {
            code: 'COURSE_NOT_FOUND',
            message: 'Course not found or you do not have permission to view it',
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get enrolled students',
        },
      });
    }
  }

  /**
   * GET /api/instructor/students/:id/progress/:courseId
   * Get detailed progress for a specific student in a course
   */
  async getStudentDetailedProgress(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.params.id;
      const courseId = req.params.courseId;
      const instructorId = req.user!.userId;

      const progress = await instructorTrackingService.getStudentDetailedProgress(
        studentId,
        courseId,
        instructorId
      );

      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error: any) {
      logger.error('Failed to get student detailed progress', { error });

      if (error.message === 'COURSE_NOT_FOUND_OR_NOT_OWNED') {
        res.status(404).json({
          success: false,
          error: {
            code: 'COURSE_NOT_FOUND',
            message: 'Course not found or you do not have permission to view it',
          },
        });
        return;
      }

      if (error.message === 'STUDENT_PROGRESS_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            code: 'PROGRESS_NOT_FOUND',
            message: 'Student has not started this course yet',
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get student progress',
        },
      });
    }
  }

  /**
   * GET /api/instructor/dashboard
   * Get instructor dashboard with metrics
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;

      const dashboard = await instructorTrackingService.getInstructorDashboard(instructorId);

      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      logger.error('Failed to get instructor dashboard', { error });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get dashboard data',
        },
      });
    }
  }
}

export const instructorTrackingController = new InstructorTrackingController();
