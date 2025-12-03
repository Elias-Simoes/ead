import re

# Read the file
with open('src/modules/assessments/services/assessment.service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the passing_score lines (lines 430-433)
lines = content.split('\n')
new_lines = []
skip_next = 0

for i, line in enumerate(lines):
    if skip_next > 0:
        skip_next -= 1
        continue
    
    # Check if this is the passing_score if statement
    if 'if (data.passing_score !== undefined)' in line:
        # Skip this line and the next 3 lines (the entire if block)
        skip_next = 3
        continue
    
    new_lines.append(line)

# Join the lines back
content = '\n'.join(new_lines)

# Write back
with open('src/modules/assessments/services/assessment.service.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Backend corrigido - passing_score removido')
