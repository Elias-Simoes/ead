import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

export interface CreateModuleData {
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
}

export interface UpdateModuleData {
  title?: string;
  description?: string;
  order_index?: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: Date;
}

export class ModuleService {
  /**
   * Create a new module
   */
  async createModule(data: CreateModuleData): Promise<Module> {
    try {
      const result = await pool.query(
        `INSERT INTO modules (course_id, title, description, order_index)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.course_id, data.title, data.description || null, data.order_index]
      );

      logger.info('Module created', {
        moduleId: result.rows[0].id,
        courseId: data.course_id,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create module', error);
      throw error;
    }
  }

  /**
   * Get module by ID
   */
  async getModuleById(moduleId: string): Promise<Module | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM modules WHERE id = $1',
        [moduleId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get module', error);
      throw error;
    }
  }

  /**
   * Get modules by course
   */
  async getModulesByCourse(courseId: string): Promise<any[]> {
    try {
      // Get modules
      const modulesResult = await pool.query(
        'SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index ASC',
        [courseId]
      );

      const modules = modulesResult.rows;

      // Get lessons for each module
      for (const module of modules) {
        const lessonsResult = await pool.query(
          'SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index ASC',
          [module.id]
        );
        module.lessons = lessonsResult.rows;
      }

      return modules;
    } catch (error) {
      logger.error('Failed to get modules', error);
      throw error;
    }
  }

  /**
   * Update module
   */
  async updateModule(moduleId: string, data: UpdateModuleData): Promise<Module> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(data.title);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.order_index !== undefined) {
        updates.push(`order_index = $${paramCount++}`);
        values.push(data.order_index);
      }

      if (updates.length === 0) {
        throw new Error('NO_UPDATES_PROVIDED');
      }

      values.push(moduleId);

      const result = await pool.query(
        `UPDATE modules 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('MODULE_NOT_FOUND');
      }

      logger.info('Module updated', { moduleId });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update module', error);
      throw error;
    }
  }

  /**
   * Delete module
   */
  async deleteModule(moduleId: string): Promise<void> {
    try {
      // Check if module has an assessment
      const assessmentCheck = await pool.query(
        'SELECT id FROM assessments WHERE module_id = $1',
        [moduleId]
      );

      if (assessmentCheck.rows.length > 0) {
        throw new Error('MODULE_HAS_ASSESSMENT');
      }

      const result = await pool.query(
        'DELETE FROM modules WHERE id = $1 RETURNING id',
        [moduleId]
      );

      if (result.rows.length === 0) {
        throw new Error('MODULE_NOT_FOUND');
      }

      logger.info('Module deleted', { moduleId });
    } catch (error) {
      logger.error('Failed to delete module', error);
      throw error;
    }
  }

  /**
   * Get next order index for a course
   */
  async getNextOrderIndex(courseId: string): Promise<number> {
    try {
      const result = await pool.query(
        'SELECT COALESCE(MAX(order_index), 0) + 1 as next_index FROM modules WHERE course_id = $1',
        [courseId]
      );

      return result.rows[0].next_index;
    } catch (error) {
      logger.error('Failed to get next order index', error);
      throw error;
    }
  }

  /**
   * Count modules in a course
   */
  async countModulesInCourse(courseId: string): Promise<number> {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM modules WHERE course_id = $1',
        [courseId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to count modules', error);
      throw error;
    }
  }
}

export const moduleService = new ModuleService();
