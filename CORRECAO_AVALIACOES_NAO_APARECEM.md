# Correção: Avaliações Não Aparecem na Lista

## Problema Identificado

As avaliações criadas não estavam aparecendo na página de gerenciamento de avaliações do instrutor.

## Causa Raiz

O sistema foi projetado para que avaliações sejam associadas a **módulos**, não diretamente a cursos. Existe uma constraint no banco de dados que garante isso:

```sql
CHECK ((
  (course_id IS NOT NULL AND module_id IS NULL) OR 
  (course_id IS NULL AND module_id IS NOT NULL)
))
```

Isso significa que uma avaliação deve ter:
- **OU** `course_id` (avaliação de curso inteiro)
- **OU** `module_id` (avaliação de módulo específico)
- Mas **NUNCA** ambos ao mesmo tempo

O sistema atual usa avaliações **por módulo**, então todas as avaliações têm `module_id` preenchido e `course_id` NULL.

## Problema no Código

O método `getAssessmentsByCourse` estava buscando avaliações diretamente por `course_id`:

```typescript
// ❌ CÓDIGO ANTIGO (não funcionava)
async getAssessmentsByCourse(courseId: string): Promise<Assessment[]> {
  const result = await pool.query(
    'SELECT * FROM assessments WHERE course_id = $1 ORDER BY created_at ASC',
    [courseId]
  );
  return result.rows;
}
```

Como todas as avaliações têm `course_id = NULL`, essa query sempre retornava vazio.

## Solução Implementada

### 1. Correção no Service (assessment.service.ts)

Modificado o método `getAssessmentsByCourse` para buscar avaliações através dos módulos do curso:

```typescript
// ✅ CÓDIGO NOVO (funciona)
async getAssessmentsByCourse(courseId: string): Promise<Assessment[]> {
  const result = await pool.query(
    `SELECT a.*, m.title as module_title
     FROM assessments a
     JOIN modules m ON a.module_id = m.id
     WHERE m.course_id = $1
     ORDER BY m.order_index ASC, a.created_at ASC`,
    [courseId]
  );
  return result.rows;
}
```

### 2. Correção no Método de Criação

Também foi corrigido o método `createAssessment` para garantir que o `course_id` seja preenchido corretamente ao criar avaliações (mesmo que não seja usado na constraint, é útil para referência):

```typescript
async createAssessment(data: CreateAssessmentData): Promise<Assessment> {
  // Buscar course_id do módulo
  const moduleResult = await pool.query(
    'SELECT course_id FROM modules WHERE id = $1',
    [data.module_id]
  );

  if (moduleResult.rows.length === 0) {
    throw new Error('MODULE_NOT_FOUND');
  }

  const courseId = moduleResult.rows[0].course_id;

  // Inserir com course_id
  const result = await pool.query(
    `INSERT INTO assessments (course_id, module_id, title, type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [courseId, data.module_id, data.title, data.type]
  );

  return result.rows[0];
}
```

**NOTA:** Após análise, descobrimos que a constraint impede ter ambos `course_id` e `module_id`. Portanto, a correção acima foi revertida e mantemos apenas `module_id`.

## Arquivos Modificados

- `src/modules/assessments/services/assessment.service.ts`
  - Método `getAssessmentsByCourse` corrigido para buscar através dos módulos

## Teste de Validação

Criado script `test-get-assessments.js` que valida:
- Query antiga retorna 0 avaliações
- Query nova retorna todas as avaliações do curso através dos módulos
- Confirmação de que a correção funciona

## Resultado

✅ As avaliações agora aparecem corretamente na página de gerenciamento
✅ A listagem respeita a ordem dos módulos
✅ Cada avaliação mostra o título do módulo associado

## Data da Correção

25 de novembro de 2025
