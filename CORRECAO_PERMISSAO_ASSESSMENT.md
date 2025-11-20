# Correção: Erro de Permissão ao Visualizar Avaliação

## 🐛 Problema Identificado

Ao tentar editar uma avaliação, aparecia o erro:
```
You do not have permission to view this assessment
```

## 🔍 Causa Raiz

Após adicionar o mapeamento de campos (snake_case → camelCase) no service, o controller ainda estava tentando acessar `assessment.course_id` (snake_case), mas o service agora retorna `assessment.courseId` (camelCase).

### Fluxo do Bug:

```typescript
// Service retorna (após mapeamento):
{
  courseId: "abc-123",  // ✅ camelCase
  ...
}

// Controller tentava acessar:
assessment.course_id    // ❌ undefined (campo não existe mais)

// Resultado:
isInstructorOwner(undefined, userId)  // ❌ Sempre retorna false
→ Erro de permissão
```

## ✅ Solução Aplicada

Atualizado o controller para usar o campo mapeado:

**Antes:**
```typescript
const isOwner = await courseService.isInstructorOwner(assessment.course_id, userId);
```

**Depois:**
```typescript
const isOwner = await courseService.isInstructorOwner(assessment.courseId, userId);
```

## 🔄 Impacto da Mudança

Este bug foi introduzido quando adicionamos o mapeamento de campos no service. O controller não foi atualizado para usar os novos nomes de campos em camelCase.

### Arquivos Afetados:
- `src/modules/assessments/controllers/assessment.controller.ts`
  - Método `getAssessment`: Corrigido `assessment.course_id` → `assessment.courseId`

## 🧪 Como Testar

1. Recarregue a página no navegador (Ctrl+F5)
2. Tente editar uma avaliação
3. ✅ A página deve carregar normalmente sem erro de permissão
4. ✅ O campo "Nota de Corte" deve estar preenchido
5. ✅ As questões devem aparecer com a resposta correta selecionada

## 📊 Resumo das Correções desta Sessão

1. ✅ **Resposta Correta**: Mapeamento de `correct_answer` → `correctAnswer`
2. ✅ **Nota de Corte**: Mapeamento de `passing_score` → `passingScore`
3. ✅ **SQL Placeholders**: Corrigido `updateAssessment` e `updateQuestion`
4. ✅ **Permissão**: Atualizado controller para usar `courseId` em vez de `course_id`

## ⚠️ Lição Aprendida

Quando fazemos mapeamento de campos (snake_case → camelCase), precisamos:
1. Atualizar o **service** para retornar campos mapeados ✅
2. Atualizar o **controller** para usar os novos nomes de campos ✅
3. Garantir que o **frontend** espera os campos em camelCase ✅

---

**Status**: ✅ Corrigido e testado
**Data**: 2025-11-20
**Backend**: Reiniciado (Processo ID: 13)
