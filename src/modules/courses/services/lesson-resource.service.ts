import { pool } from '../../../config/database';

class AppError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'AppError';
  }
}

export interface LessonResource {
  id?: string;
  lesson_id: string;
  type: 'image' | 'pdf' | 'video' | 'link';
  title: string;
  description?: string;
  file_key?: string;
  url?: string;
  file_size?: number;
  mime_type?: string;
  order_index?: number;
}

export class LessonResourceService {
  async createResources(lessonId: string, resources: LessonResource[]): Promise<LessonResource[]> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const createdResources: LessonResource[] = [];

      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        
        const result = await client.query(
          `INSERT INTO lesson_resources 
           (lesson_id, type, title, description, file_key, url, file_size, mime_type, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            lessonId,
            resource.type,
            resource.title,
            resource.description || null,
            resource.file_key || null,
            resource.url || null,
            resource.file_size || null,
            resource.mime_type || null,
            resource.order_index !== undefined ? resource.order_index : i,
          ]
        );

        createdResources.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return createdResources;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getResourcesByLessonId(lessonId: string): Promise<LessonResource[]> {
    const result = await pool.query(
      `SELECT * FROM lesson_resources 
       WHERE lesson_id = $1 
       ORDER BY order_index ASC`,
      [lessonId]
    );

    return result.rows;
  }

  async getResourceById(resourceId: string): Promise<LessonResource> {
    const result = await pool.query(
      'SELECT * FROM lesson_resources WHERE id = $1',
      [resourceId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Recurso não encontrado', 404);
    }

    return result.rows[0];
  }

  async updateResource(resourceId: string, data: Partial<LessonResource>): Promise<LessonResource> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.url !== undefined) {
      fields.push(`url = $${paramCount++}`);
      values.push(data.url);
    }
    if (data.order_index !== undefined) {
      fields.push(`order_index = $${paramCount++}`);
      values.push(data.order_index);
    }

    if (fields.length === 0) {
      throw new AppError('Nenhum campo para atualizar', 400);
    }

    values.push(resourceId);

    const result = await pool.query(
      `UPDATE lesson_resources 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Recurso não encontrado', 404);
    }

    return result.rows[0];
  }

  async deleteResource(resourceId: string): Promise<void> {
    const result = await pool.query(
      'DELETE FROM lesson_resources WHERE id = $1 RETURNING *',
      [resourceId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Recurso não encontrado', 404);
    }
  }

  async deleteResourcesByLessonId(lessonId: string): Promise<void> {
    await pool.query(
      'DELETE FROM lesson_resources WHERE lesson_id = $1',
      [lessonId]
    );
  }
}
