const fs = require('fs');

const filePath = 'src/modules/assessments/services/assessment.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix SQL placeholders in updateAssessment method
content = content.replace(
  /updates\.push\(`title = \$\{paramCount\+\+\}`\);/g,
  'updates.push(`title = $${paramCount++}`);'
);

content = content.replace(
  /WHERE id = \$\{paramCount\}/g,
  'WHERE id = $${paramCount}'
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Placeholders SQL corrigidos no método updateAssessment');
