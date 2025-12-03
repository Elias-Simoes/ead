# Correção Final: Avaliações Não Aparecem

## Problema

Avaliações criadas não apareciam na página de gerenciamento de avaliações, mesmo estando salvas no banco de dados.

## Causa Raiz

O sistema foi projetado para que avaliações sejam associadas a **módulos** (não diretamente a cursos). Porém, o método `getCourseAssessments` estava buscando avaliações usando `course_id` diretamente, que sempre é NULL para avaliações de módulo.

## Arquivos Corrigidos

### 1. `src/modules/assessments/services/assessment.service.ts`

**Método corrigido: `getCourseAssessments`**

```typescript
// ❌ ANTES (não funcionava)
async getCourseAssessments(courseId: string): Promise<any[]> {
  const assessmentsResult = await pool.query(
    'SELECT * FROM assessments WHERE course_id = $1 ORDER BY created_at DESC',
    [courseId]
  );
  // ...
}

// ✅ DEPOIS (funciona)
async getCourseAssessments(courseId: string): Promise<any[]> {
  const assessmentsResult = await pool.query(
    `SELECT a.*, m.title as module_title
     FROM assessments a
     JOIN modules m ON a.module_id = m.id
     WHERE m.course_id = $1
     ORDER BY m.order_index ASC, a.created_at ASC`,
    [courseId]
  );
  // ...
}
```

**Método corrigido: `getAssessmentsByCourse`**

```typescript
// ❌ ANTES
async getAssessmentsByCourse(courseId: string): Promise<Assessment[]> {
  const result = await pool.query(
    'SELECT * FROM assessments WHERE course_id = $1 ORDER BY created_at ASC',
    [courseId]
  );
  return result.rows;
}

// ✅ DEPOIS
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

### 2. `src/modules/assessments/controllers/assessment.controller.ts`

Adicionados logs temporários para debug no método `getCourseAssessments`:

```typescript
async getCourseAssessments(req: Request, res: Response): Promise<void> {
  try {
    const { id: courseId } = req.params;
    const instructorId = req.user!.userId;

    logger.info('getCourseAssessments called', { courseId, instructorId });

    const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
    logger.info('Ownership check result', { isOwner });
    
    if (!isOwner) {
      // ... erro 403
    }

    const assessments = await assessmentService.getCourseAssessments(courseId);
    logger.info('Assessments retrieved', { count: assessments.length, assessments });

    res.status(200).json({
      data: assessments,
    });
  } catch (error) {
    // ... erro 500
  }
}
```

## Como Funciona Agora

1. Frontend chama `GET /api/courses/:id/assessments`
2. Controller verifica se o instrutor é dono do curso
3. Service busca avaliações através dos módulos do curso usando JOIN
4. Retorna todas as avaliações ordenadas por ordem do módulo
5. Frontend exibe as avaliações na lista

## Estrutura do Banco de Dados

```
courses
  └── modules (course_id)
        └── assessments (module_id)
              └── questions (assessment_id)
```

**Constraint importante:**
```sql
CHECK ((
  (course_id IS NOT NULL AND module_id IS NULL) OR 
  (course_id IS NULL AND module_id IS NOT NULL)
))
```

Isso garante que uma avaliação tenha OU `course_id` OU `module_id`, mas nunca ambos.

## Teste de Validação

Criado script `test-get-assessments.js` que confirma:
- ✅ Query antiga retorna 0 avaliações
- ✅ Query nova retorna todas as avaliações através dos módulos
- ✅ Avaliações são ordenadas pela ordem dos módulos

## Resultado

✅ Avaliações agora aparecem corretamente na página de gerenciamento
✅ Listagem ordenada pela ordem dos módulos
✅ Cada avaliação mostra o título do módulo associado
✅ Sistema funciona conforme o design (avaliações por módulo)

## Próximos Passos

Após confirmar que tudo funciona:
1. Remover os logs temporários do controller
2. Testar criação de novas avaliações
3. Testar edição e exclusão de avaliações

## Data da Correção

25 de novembro de 2025 - 20:20
