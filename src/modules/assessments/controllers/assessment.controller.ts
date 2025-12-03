import { Request, Response } from 'express';
import { assessmentService } from '../services/assessment.service';
import { courseService } from '@modules/courses/services/course.service';
import { logger } from '@shared/utils/logger';

export class AssessmentController {
  /**
   * Create a new assessment for a course (instructor only)
   * POST /api/courses/:id/assessments
   * 
   * @deprecated This method is obsolete. Assessments are now created per module.
   * Use createAssessmentForModule instead (POST /api/modules/:moduleId/assessments)
   */
  async createAssessment(req: Request, res: Response): Promise<void> {
    res.status(400).json({
      error: {
        code: 'DEPRECATED_ENDPOINT',
        message: 'This endpoint is deprecated. Assessments must be created per module. Use POST /api/modules/:moduleId/assessments instead.',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }

  /**
   * Create a new assessment for a module (instructor only)
   * POST /api/modules/:moduleId/assessments
   */
  async createAssessmentForModule(req: Request, res: Response): Promise<void> {
    try {
      const { moduleId } = req.params;
      const { title, type, passing_score } = req.body;
      const instructorId = req.user!.userId;

      logger.info('createAssessmentForModule called', { 
        moduleId, 
        title, 
        type,
        passing_score, 
        instructorId,
        body: req.body 
      });

      // Get course ID from module and verify ownership
      const courseId = await assessmentService.getCourseIdByModuleId(moduleId);
      if (!courseId) {
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
      const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to create assessments for this module',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Create assessment
      const assessment = await assessmentService.createAssessment({
        module_id: moduleId,
        title,
        type,
        passing_score,
      });

      logger.info('Assessment created successfully', { assessmentId: assessment.id });

      res.status(201).json({
        message: 'Assessment created successfully',
        data: { assessment },
      });
    } catch (error: any) {
      logger.error('Failed to create assessment for module', { 
        error: error.message,
        stack: error.stack,
        moduleId: req.params.moduleId,
        body: req.body
      });
      
      if (error.message === 'MODULE_ALREADY_HAS_ASSESSMENT') {
        res.status(400).json({
          error: {
            code: 'MODULE_ALREADY_HAS_ASSESSMENT',
            message: 'This module already has an assessment',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      if (error.message === 'MODULE_NOT_FOUND') {
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
      
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create assessment for module',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Add a question to an assessment (instructor only)
   * POST /api/assessments/:id/questions
   */
  async createQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id: assessmentId } = req.params;
      const { text, type, options, correct_answer, points, order_index } = req.body;
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
            message: 'You do not have permission to add questions to this assessment',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Validate question data based on type
      if (type === 'multiple_choice') {
        if (!options || !Array.isArray(options) || options.length < 2) {
          res.status(400).json({
            error: {
              code: 'INVALID_OPTIONS',
              message: 'Multiple choice questions must have at least 2 options',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
        if (correct_answer === undefined || correct_answer < 0 || correct_answer >= options.length) {
          res.status(400).json({
            error: {
              code: 'INVALID_CORRECT_ANSWER',
              message: 'Correct answer must be a valid option index',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      const question = await assessmentService.createQuestionWithRecalculation({
        assessment_id: assessmentId,
        text,
        type,
        options,
        correct_answer,
        points,
        order_index,
      });

      res.status(201).json({
        message: 'Question created successfully',
        data: question,
      });
    } catch (error) {
      logger.error('Failed to create question', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create question',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Update a question (instructor only)
   * PATCH /api/questions/:id
   */
  async updateQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id: questionId } = req.params;
      const { text, options, correct_answer, points, order_index } = req.body;
      const instructorId = req.user!.userId;

      // Get assessment ID from question
      const assessmentId = await assessmentService.getAssessmentIdByQuestionId(questionId);
      if (!assessmentId) {
        res.status(404).json({
          error: {
            code: 'QUESTION_NOT_FOUND',
            message: 'Question not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

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
            message: 'You do not have permission to update this question',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const question = await assessmentService.updateQuestion(questionId, {
        text,
        options,
        correct_answer,
        points,
        order_index,
      });

      res.status(200).json({
        message: 'Question updated successfully',
        data: { question },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'QUESTION_NOT_FOUND') {
          res.status(404).json({
            error: {
              code: 'QUESTION_NOT_FOUND',
              message: 'Question not found',
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

      logger.error('Failed to update question', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update question',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get all assessments for a course (instructor only)
   * GET /api/courses/:id/assessments
   */
  async getCourseAssessments(req: Request, res: Response): Promise<void> {
    try {
      const { id: courseId } = req.params;
      const instructorId = req.user!.userId;

      logger.info('getCourseAssessments called', { courseId, instructorId });

      // Check if instructor owns the course
      const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
      logger.info('Ownership check result', { isOwner });
      
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view assessments for this course',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const assessments = await assessmentService.getCourseAssessments(courseId);
      logger.info('Assessments retrieved', { count: assessments.length, assessments });

      res.status(200).json({
        data: assessments,
      });
    } catch (error) {
      logger.error('Failed to get course assessments', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get course assessments',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get a specific assessment with questions
   * GET /api/assessments/:id
   */
  async getAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id: assessmentId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const assessment = await assessmentService.getAssessmentWithQuestions(assessmentId);

      if (!assessment) {
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

      // If instructor, check ownership
      if (userRole === 'instructor') {
        // Get course ID from assessment
        const courseId = await assessmentService.getCourseIdByAssessmentId(assessmentId);
        if (!courseId) {
          res.status(404).json({
            error: {
              code: 'COURSE_NOT_FOUND',
              message: 'Course not found for this assessment',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
        
        const isOwner = await courseService.isInstructorOwner(courseId, userId);
        if (!isOwner) {
          res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to view this assessment',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }

      res.status(200).json({
        data: assessment,
      });
    } catch (error) {
      logger.error('Failed to get assessment', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get assessment',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Update an assessment (instructor only)
   * PATCH /api/assessments/:id
   */
  async updateAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id: assessmentId } = req.params;
      const { title } = req.body;
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
            message: 'You do not have permission to update this assessment',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const assessment = await assessmentService.updateAssessment(assessmentId, {
        title,
      });

      res.status(200).json({
        message: 'Assessment updated successfully',
        data: assessment,
      });
    } catch (error) {
      logger.error('Failed to update assessment', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update assessment',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Delete an assessment (instructor only)
   * DELETE /api/assessments/:id
   */
  async deleteAssessment(req: Request, res: Response): Promise<void> {
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
            message: 'You do not have permission to delete this assessment',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      await assessmentService.deleteAssessment(assessmentId);

      res.status(200).json({
        message: 'Assessment deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete assessment', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete assessment',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Delete a question (instructor only)
   * DELETE /api/questions/:id
   */
  async deleteQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id: questionId } = req.params;
      const instructorId = req.user!.userId;

      // Get assessment ID from question
      const assessmentId = await assessmentService.getAssessmentIdByQuestionId(questionId);
      if (!assessmentId) {
        res.status(404).json({
          error: {
            code: 'QUESTION_NOT_FOUND',
            message: 'Question not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

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
            message: 'You do not have permission to delete this question',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      await assessmentService.deleteQuestionWithRecalculation(questionId);

      res.status(200).json({
        message: 'Question deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'QUESTION_NOT_FOUND') {
        res.status(404).json({
          error: {
            code: 'QUESTION_NOT_FOUND',
            message: 'Question not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      logger.error('Failed to delete question', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete question',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get modules without assessments for a course
   * GET /api/courses/:id/modules-without-assessments
   */
  async getModulesWithoutAssessments(req: Request, res: Response): Promise<void> {
    try {
      const { id: courseId } = req.params;
      const instructorId = req.user!.userId;

      // Check if instructor owns the course
      const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
      if (!isOwner) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this course',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const modules = await assessmentService.getModulesWithoutAssessments(courseId);

      res.status(200).json({
        message: 'Modules without assessments retrieved successfully',
        data: { modules },
      });
    } catch (error) {
      logger.error('Failed to get modules without assessments', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get modules without assessments',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }
}

export const assessmentController = new AssessmentController();
