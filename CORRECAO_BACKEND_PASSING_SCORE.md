# Correção Backend - Remoção Completa do passing_score

## Problema
Múltiplos arquivos no backend ainda tinham referências ao campo `passing_score`, que não existe mais na tabela `assessments` do banco de dados após a migração para avaliações por módulo.

## Solução Aplicada

### 1. Arquivo: `src/modules/assessments/services/assessment.service.ts`

#### Assinatura do Método Corrigida
```typescript
// ANTES
async updateAssessment(assessmentId: string, data: { title?: string; passing_score?: number }): Promise<Assessment>

// DEPOIS
async updateAssessment(assessmentId: string, data: { title?: string }): Promise<Assessment>
```

#### Lógica do passing_score Removida
Removidas as linhas que tentavam atualizar o campo inexistente:
```typescript
// REMOVIDO:
if (data.passing_score !== undefined) {
  updates.push(`passing_score = $${paramCount++}`);
  values.push(data.passing_score);
}
```

#### Placeholders SQL Corrigidos
```typescript
// ANTES
updates.push(`title = ${paramCount++}`);
WHERE id = ${paramCount}

// DEPOIS  
updates.push(`title = $${paramCount++}`);
WHERE id = $${paramCount}
```

### 2. Arquivo: `src/modules/assessments/controllers/assessment.controller.ts`

#### Método `createAssessment` Corrigido
```typescript
// ANTES
const { title, type, passing_score } = req.body;
const assessment = await assessmentService.createAssessment({
  course_id: courseId,
  title,
  type,
  passing_score,
});

// DEPOIS
const { title, type } = req.body;
const assessment = await assessmentService.createAssessment({
  course_id: courseId,
  title,
  type,
});
```

#### Método `createAssessmentForModule` Corrigido
```typescript
// ANTES
const assessment = await assessmentService.createAssessment({
  module_id: moduleId,
  title,
  type,
  passing_score: 7, // Default passing score
  total_points: 10, // Fixed 10 points
});

// DEPOIS
const assessment = await assessmentService.createAssessment({
  module_id: moduleId,
  title,
  type,
});
```

#### Método `updateAssessment` Corrigido
```typescript
// ANTES
const { title, passing_score } = req.body;
const assessment = await assessmentService.updateAssessment(assessmentId, {
  title,
  passing_score,
});

// DEPOIS
const { title } = req.body;
const assessment = await assessmentService.updateAssessment(assessmentId, {
  title,
});
```

### 3. Arquivo: `src/modules/assessments/validators/assessment.validator.ts`

#### Schema de Validação Corrigido
```typescript
// ANTES
export const createAssessmentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
    type: z.enum(['multiple_choice', 'essay', 'mixed'], {
      errorMap: () => ({ message: 'Type must be multiple_choice, essay, or mixed' }),
    }),
    passing_score: z
      .number()
      .min(0, 'Passing score must be at least 0')
      .max(100, 'Passing score must be at most 100'),
  }),
});

// DEPOIS
export const createAssessmentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
    type: z.enum(['multiple_choice', 'essay', 'mixed'], {
      errorMap: () => ({ message: 'Type must be multiple_choice, essay, or mixed' }),
    }),
  }),
});
```

## Resultado

✅ **Backend totalmente corrigido**
- Service: Método `updateAssessment` não aceita mais `passing_score`
- Controller: Todos os métodos removeram referências ao `passing_score`
- Validator: Schema de validação não exige mais `passing_score`
- Placeholders SQL corrigidos
- Compatível com o frontend já corrigido
- Não tenta mais atualizar campo inexistente no banco

## Teste
Para testar, tente editar uma avaliação:
```bash
node test-assessment-api-direct.js
```

O erro "column 'passing_score' does not exist" não deve mais aparecer.
