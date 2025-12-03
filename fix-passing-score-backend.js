const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/modules/assessments/services/assessment.service.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove the passing_score parameter from the method signature
content = content.replace(
  /async updateAssessment\(assessmentId: string, data: \{ title\?: string; passing_score\?: number \}\): Promise<Assessment>/,
  'async updateAssessment(assessmentId: string, data: { title?: string }): Promise<Assessment>'
);

// Remove the passing_score logic from the method body
content = content.replace(
  /      if \(data\.passing_score !== undefined\) \{\s+updates\.push\(`passing_score = \$\{paramCount\+\+\}`\);\s+values\.push\(data\.passing_score\);\s+\}\s+/,
  ''
);

// Also fix the placeholder to use $ instead of just paramCount
content = content.replace(
  /updates\.push\(`title = \$\{paramCount\+\+\}`\);/,
  'updates.push(`title = $${paramCount++}`);'
);

content = content.replace(
  /WHERE id = \$\{paramCount\}/,
  'WHERE id = $${paramCount}'
);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Backend corrigido - passing_score removido do método updateAssessment');
