import { Request, Response } from 'express';
import { studentAssessmentService } from '../services/student-assessment.service';
import { assessmentService } from '../services/assessment.service';
import { courseService } from '@modules/courses/services/course.service';
import { logger } from '@shared/utils/logger';

export class InstructorAssessmentController {
  /**
   * Get pending assessments for grading
   * GET /api/instructor/assessments/pending
   */
  async getPendingAssessments(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;

      const pendingAssessments = await studentAssessmentService.getPendingAssessments(instructorId);

      res.status(200).json({
        message: 'Pending assessments retrieved successfully',
        data: { assessments: pendingAssessments },
      });
    } catch (error) {
      logger.error('Failed to get pending assessments', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve pending assessments',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get all submissions for an assessment
   * GET /api/assessments/:id/submissions
   */
  async getAssessmentSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { id: assessmentId } = req.params;
      const instructorId = req.user!.userId;

      // Get course ID from assessment
      const courseId = await assessmentService.getCourseIdByAssessmentId(assessmentId);
      if (!courseId) {
        res.status(404).json({
          error: {
            code: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Check if instructor owns the course
      const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view submissions for this assessment',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const submissions = await studentAssessmentService.getAssessmentSubmissions(assessmentId);

      res.status(200).json({
        message: 'Assessment submissions retrieved successfully',
        data: { submissions },
      });
    } catch (error) {
      logger.error('Failed to get assessment submissions', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve assessment submissions',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Grade a student assessment
   * PATCH /api/student-assessments/:id/grade
   */
  async gradeAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id: studentAssessmentId } = req.params;
      const { score, feedback } = req.body;
      const instructorId = req.user!.userId;

      // Get student assessment
      const studentAssessment = await studentAssessmentService.getStudentAssessmentById(
        studentAssessmentId
      );

      if (!studentAssessment) {
        res.status(404).json({
          error: {
            code: 'STUDENT_ASSESSMENT_NOT_FOUND',
            message: 'Student assessment not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Get course ID from assessment
      const courseId = await assessmentService.getCourseIdByAssessmentId(
        studentAssessment.assessment_id
      );

      if (!courseId) {
        res.status(404).json({
          error: {
            code: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Check if instructor owns the course
      const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to grade this assessment',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const gradedAssessment = await studentAssessmentService.gradeAssessment(
        studentAssessmentId,
        score,
        feedback,
        instructorId
      );

      res.status(200).json({
        message: 'Assessment graded successfully',
        data: { assessment: gradedAssessment },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'STUDENT_ASSESSMENT_NOT_FOUND') {
        res.status(404).json({
          error: {
            code: 'STUDENT_ASSESSMENT_NOT_FOUND',
            message: 'Student assessment not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      logger.error('Failed to grade assessment', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to grade assessment',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }
}

export const instructorAssessmentController = new InstructorAssessmentController();
