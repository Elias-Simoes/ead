const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/modules/assessments/services/assessment.service.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the entire updateAssessment method
const oldMethod = `  async updateAssessment(assessmentId: string, data: { title?: string }): Promise<Assessment> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.title !== undefined) {
        updates.push(\`title = \${paramCount++}\`);
        values.push(data.title);
      }
      if (data.passing_score !== undefined) {
        updates.push(\`passing_score = \${paramCount++}\`);
        values.push(data.passing_score);
      }

      if (updates.length === 0) {
        throw new Error('NO_UPDATES_PROVIDED');
      }

      values.push(assessmentId);

      const result = await pool.query(
        \`UPDATE assessments 
         SET \${updates.join(', ')}
         WHERE id = \${paramCount}
         RETURNING *\`,
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
  }`;

const newMethod = `  async updateAssessment(assessmentId: string, data: { title?: string }): Promise<Assessment> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.title !== undefined) {
        updates.push(\`title = $\${paramCount++}\`);
        values.push(data.title);
      }

      if (updates.length === 0) {
        throw new Error('NO_UPDATES_PROVIDED');
      }

      values.push(assessmentId);

      const result = await pool.query(
        \`UPDATE assessments 
         SET \${updates.join(', ')}
         WHERE id = $\${paramCount}
         RETURNING *\`,
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
  }`;

content = content.replace(oldMethod, newMethod);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Backend corrigido - passing_score removido e placeholders SQL corrigidos');
