import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

export interface CreateAssessmentData {
  course_id: string;
  title: string;
  type: 'multiple_choice' | 'essay' | 'mixed';
  passing_score: number;
}

export interface CreateQuestionData {
  assessment_id: string;
  text: string;
  type: 'multiple_choice' | 'essay';
  options?: string[];
  correct_answer?: number;
  points: number;
  order_index: number;
}

export interface UpdateQuestionData {
  text?: string;
  options?: string[];
  correct_answer?: number;
  points?: number;
  order_index?: number;
}

export interface Assessment {
  id: string;
  course_id: string;
  title: string;
  type: string;
  passing_score: number;
  created_at: Date;
}

export interface Question {
  id: string;
  assessment_id: string;
  text: string;
  type: string;
  options?: string[];
  correct_answer?: number;
  points: number;
  order_index: number;
  created_at: Date;
}

// Helper function to map database fields to camelCase
function mapQuestionToResponse(question: any) {
  return {
    id: question.id,
    assessmentId: question.assessment_id,
    text: question.text,
    type: question.type,
    options: question.options,
    correctAnswer: question.correct_answer,
    points: question.points,
    orderIndex: question.order_index,
    createdAt: question.created_at,
  };
}

function mapAssessmentToResponse(assessment: any, questions?: any[]) {
  return {
    id: assessment.id,
    courseId: assessment.course_id,
    title: assessment.title,
    type: assessment.type,
    passingScore: assessment.passing_score,
    createdAt: assessment.created_at,
    questions: questions || [],
  };
}

export class AssessmentService {
  /**
   * Create a new assessment for a course
   */
  async createAssessment(data: CreateAssessmentData): Promise<Assessment> {
    try {
      const result = await pool.query(
        `INSERT INTO assessments (course_id, title, type, passing_score)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.course_id, data.title, data.type, data.passing_score]
      );

      logger.info('Assessment created', {
        assessmentId: result.rows[0].id,
        courseId: data.course_id,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create assessment', error);
      throw error;
    }
  }

  /**
   * Get assessment by ID
   */
  async getAssessmentById(assessmentId: string): Promise<Assessment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM assessments WHERE id = $1',
        [assessmentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get assessment', error);
      throw error;
    }
  }

  /**
   * Get assessment with questions
   */
  async getAssessmentWithQuestions(assessmentId: string): Promise<any | null> {
    try {
      const assessmentResult = await pool.query(
        'SELECT * FROM assessments WHERE id = $1',
        [assessmentId]
      );

      if (assessmentResult.rows.length === 0) {
        return null;
      }

      const questionsResult = await pool.query(
        'SELECT * FROM questions WHERE assessment_id = $1 ORDER BY order_index ASC',
        [assessmentId]
      );

      const mappedQuestions = questionsResult.rows.map(mapQuestionToResponse);
      return mapAssessmentToResponse(assessmentResult.rows[0], mappedQuestions);
    } catch (error) {
      logger.error('Failed to get assessment with questions', error);
      throw error;
    }
  }

  /**
   * Get assessments by course
   */
  async getAssessmentsByCourse(courseId: string): Promise<Assessment[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM assessments WHERE course_id = $1 ORDER BY created_at ASC',
        [courseId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get assessments by course', error);
      throw error;
    }
  }

  /**
   * Create a question for an assessment
   */
  async createQuestion(data: CreateQuestionData): Promise<any> {
    try {
      const result = await pool.query(
        `INSERT INTO questions (assessment_id, text, type, options, correct_answer, points, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          data.assessment_id,
          data.text,
          data.type,
          data.options ? JSON.stringify(data.options) : null,
          data.correct_answer || null,
          data.points,
          data.order_index,
        ]
      );

      logger.info('Question created', {
        questionId: result.rows[0].id,
        assessmentId: data.assessment_id,
      });

      return mapQuestionToResponse(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create question', error);
      throw error;
    }
  }

  /**
   * Get question by ID
   */
  async getQuestionById(questionId: string): Promise<Question | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM questions WHERE id = $1',
        [questionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get question', error);
      throw error;
    }
  }

  /**
   * Update a question
   */
  async updateQuestion(questionId: string, data: UpdateQuestionData): Promise<any> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.text !== undefined) {
        updates.push(`text = $${paramCount++}`);
        values.push(data.text);
      }
      if (data.options !== undefined) {
        updates.push(`options = $${paramCount++}`);
        values.push(JSON.stringify(data.options));
      }
      if (data.correct_answer !== undefined) {
        updates.push(`correct_answer = $${paramCount++}`);
        values.push(data.correct_answer);
      }
      if (data.points !== undefined) {
        updates.push(`points = $${paramCount++}`);
        values.push(data.points);
      }
      if (data.order_index !== undefined) {
        updates.push(`order_index = $${paramCount++}`);
        values.push(data.order_index);
      }

      if (updates.length === 0) {
        throw new Error('NO_UPDATES_PROVIDED');
      }

      values.push(questionId);

      const result = await pool.query(
        `UPDATE questions 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('QUESTION_NOT_FOUND');
      }

      logger.info('Question updated', { questionId });

      return mapQuestionToResponse(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update question', error);
      throw error;
    }
  }

  /**
   * Delete a question
   */
  async deleteQuestion(questionId: string): Promise<void> {
    try {
      const result = await pool.query(
        'DELETE FROM questions WHERE id = $1 RETURNING id',
        [questionId]
      );

      if (result.rows.length === 0) {
        throw new Error('QUESTION_NOT_FOUND');
      }

      logger.info('Question deleted', { questionId });
    } catch (error) {
      logger.error('Failed to delete question', error);
      throw error;
    }
  }

  /**
   * Check if assessment has at least one question
   */
  async hasQuestions(assessmentId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM questions WHERE assessment_id = $1',
        [assessmentId]
      );

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error('Failed to check if assessment has questions', error);
      throw error;
    }
  }

  /**
   * Get course ID from assessment ID
   */
  async getCourseIdByAssessmentId(assessmentId: string): Promise<string | null> {
    try {
      const result = await pool.query(
        'SELECT course_id FROM assessments WHERE id = $1',
        [assessmentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].course_id;
    } catch (error) {
      logger.error('Failed to get course ID from assessment', error);
      throw error;
    }
  }

  /**
   * Get assessment ID from question ID
   */
  async getAssessmentIdByQuestionId(questionId: string): Promise<string | null> {
    try {
      const result = await pool.query(
        'SELECT assessment_id FROM questions WHERE id = $1',
        [questionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].assessment_id;
    } catch (error) {
      logger.error('Failed to get assessment ID from question', error);
      throw error;
    }
  }

  /**
   * Get all assessments for a course with questions
   */
  async getCourseAssessments(courseId: string): Promise<any[]> {
    try {
      const assessmentsResult = await pool.query(
        'SELECT * FROM assessments WHERE course_id = $1 ORDER BY created_at DESC',
        [courseId]
      );

      const assessments = await Promise.all(
        assessmentsResult.rows.map(async (assessment) => {
          const questionsResult = await pool.query(
            'SELECT * FROM questions WHERE assessment_id = $1 ORDER BY order_index ASC',
            [assessment.id]
          );

          const mappedQuestions = questionsResult.rows.map(mapQuestionToResponse);
          return mapAssessmentToResponse(assessment, mappedQuestions);
        })
      );

      return assessments;
    } catch (error) {
      logger.error('Failed to get course assessments', error);
      throw error;
    }
  }

  /**
   * Update an assessment
   */
  async updateAssessment(assessmentId: string, data: { title?: string; passing_score?: number }): Promise<Assessment> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(data.title);
      }
      if (data.passing_score !== undefined) {
        updates.push(`passing_score = $${paramCount++}`);
        values.push(data.passing_score);
      }

      if (updates.length === 0) {
        throw new Error('NO_UPDATES_PROVIDED');
      }

      values.push(assessmentId);

      const result = await pool.query(
        `UPDATE assessments 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('ASSESSMENT_NOT_FOUND');
      }

      logger.info('Assessment updated', { assessmentId });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update assessment', error);
      throw error;
    }
  }

  /**
   * Delete an assessment and all its questions
   */
  async deleteAssessment(assessmentId: string): Promise<void> {
    try {
      // Delete all questions first
      await pool.query(
        'DELETE FROM questions WHERE assessment_id = $1',
        [assessmentId]
      );

      // Delete the assessment
      const result = await pool.query(
        'DELETE FROM assessments WHERE id = $1',
        [assessmentId]
      );

      if (result.rowCount === 0) {
        throw new Error('ASSESSMENT_NOT_FOUND');
      }

      logger.info('Assessment deleted', { assessmentId });
    } catch (error) {
      logger.error('Failed to delete assessment', error);
      throw error;
    }
  }
}

export const assessmentService = new AssessmentService();
