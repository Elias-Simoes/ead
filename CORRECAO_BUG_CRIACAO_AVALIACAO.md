# Correção: Bug ao Criar Avaliação

## 🐛 Problema Identificado

Ao tentar criar uma avaliação para um módulo, o sistema retornava erro 500 com a mensagem:
```
"new row for relation \"assessments\" violates check constraint \"assessments_course_or_module_check\""
```

## 🔍 Diagnóstico

### Causa Raiz
O service `AssessmentService.createAssessment()` estava inserindo **AMBOS** os campos `course_id` e `module_id` na tabela `assessments`:

```typescript
const result = await pool.query(
  `INSERT INTO assessments (course_id, module_id, title, type)
   VALUES ($1, $2, $3, $4)
   RETURNING *`,
  [courseId, data.module_id, data.title, data.type]
);
```

### Constraint Violada
A tabela `assessments` possui uma constraint que exige que a avaliação tenha **OU** `course_id` **OU** `module_id`, mas **NÃO AMBOS**:

```sql
ALTER TABLE assessments 
ADD CONSTRAINT assessments_course_or_module_check 
CHECK (
  (course_id IS NOT NULL AND module_id IS NULL) OR 
  (course_id IS NULL AND module_id IS NOT NULL)
);
```

Esta constraint foi adicionada para suportar o novo modelo onde avaliações são criadas por módulo, não por curso.

## ✅ Solução Implementada

### Arquivo Modificado
`src/modules/assessments/services/assessment.service.ts`

### Mudança
Removido o `course_id` da inserção, mantendo apenas o `module_id`:

```typescript
// ANTES (ERRADO)
const result = await pool.query(
  `INSERT INTO assessments (course_id, module_id, title, type)
   VALUES ($1, $2, $3, $4)
   RETURNING *`,
  [courseId, data.module_id, data.title, data.type]
);

// DEPOIS (CORRETO)
const result = await pool.query(
  `INSERT INTO assessments (module_id, title, type)
   VALUES ($1, $2, $3)
   RETURNING *`,
  [data.module_id, data.title, data.type]
);
```

### Observações
- O `course_id` ainda é consultado para verificar se o módulo existe
- O `course_id` pode ser obtido através do JOIN com a tabela `modules` quando necessário
- A constraint garante a integridade dos dados no novo modelo

## 🧪 Teste

### Script de Teste
Criado `test-create-assessment-fixed.js` que:
1. Faz login como instrutor
2. Lista módulos disponíveis (sem avaliação)
3. Cria uma avaliação para um módulo
4. Adiciona questões à avaliação
5. Verifica a avaliação completa

### Resultado
✅ Avaliação criada com sucesso
✅ Questões adicionadas com sucesso
✅ Sistema funcionando corretamente

## 📝 Endpoint Correto

Para criar uma avaliação, use:

```
POST /api/modules/:moduleId/assessments
```

**Body:**
```json
{
  "title": "Título da Avaliação",
  "type": "multiple_choice"
}
```

**NÃO use:**
```
POST /api/assessments
```
(Este endpoint está deprecated)

## 🎯 Impacto

- ✅ Avaliações agora podem ser criadas corretamente por módulo
- ✅ Constraint de banco de dados respeitada
- ✅ Modelo de dados consistente
- ✅ Frontend pode criar avaliações sem erros

## 📅 Data da Correção
26 de novembro de 2025
