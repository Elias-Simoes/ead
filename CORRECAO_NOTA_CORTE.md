# Correção: Nota de Corte Não Aparecia

## 🐛 Problema Identificado

O campo "Nota de Corte (%)" estava vazio ao editar uma avaliação, mesmo que o valor estivesse salvo no banco de dados.

## 🔍 Causa Raiz

Mesmo problema de mapeamento de campos (snake_case → camelCase):

1. **Banco de Dados**: `passing_score: 70` ✅
2. **Service**: Retornava `passing_score` (snake_case)
3. **Frontend**: Esperava `passingScore` (camelCase)
4. **Resultado**: Campo vazio no formulário

## ✅ Solução Aplicada

### 1. Adicionada Função de Mapeamento para Assessments

```typescript
function mapAssessmentToResponse(assessment: any, questions?: any[]) {
  return {
    id: assessment.id,
    courseId: assessment.course_id,           // ✅ Mapeado
    title: assessment.title,
    type: assessment.type,
    passingScore: assessment.passing_score,   // ✅ Mapeado
    createdAt: assessment.created_at,         // ✅ Mapeado
    questions: questions || [],
  };
}
```

### 2. Corrigido Bug de SQL Placeholders no `updateAssessment`

O método `updateAssessment` também tinha o bug dos placeholders SQL:

**Antes:**
```typescript
updates.push(`title = ${paramCount++}`);           // ❌ Errado
updates.push(`passing_score = ${paramCount++}`);  // ❌ Errado
WHERE id = ${paramCount}                           // ❌ Errado
```

**Depois:**
```typescript
updates.push(`title = $${paramCount++}`);          // ✅ Correto
updates.push(`passing_score = $${paramCount++}`); // ✅ Correto
WHERE id = $${paramCount}                          // ✅ Correto
```

### 3. Métodos Atualizados

- **`getAssessmentWithQuestions`**: Agora usa `mapAssessmentToResponse`
- **`updateAssessment`**: Corrigido placeholders SQL + mapeamento

## 🔄 Fluxo Corrigido

```
Banco de Dados          Service              Frontend
┌──────────────┐       ┌─────────────┐      ┌──────────────┐
│passing_score │  -->  │passingScore │ --> │passingScore  │
│      70      │       │      70     │     │      70      │
└──────────────┘       └─────────────┘      └──────────────┘
                                                    ↓
                                          Campo preenchido ✅
```

## 🧪 Como Testar

1. Recarregue a página no navegador (Ctrl+F5)
2. Edite uma avaliação existente
3. ✅ O campo "Nota de Corte (%)" deve estar preenchido com o valor correto
4. Altere o valor (ex: de 70 para 80)
5. Clique em "Atualizar Avaliação"
6. Recarregue a página
7. ✅ O novo valor deve estar salvo

## 📊 Campos Mapeados (Assessment)

| Banco (snake_case) | API (camelCase) |
|--------------------|-----------------|
| `course_id` | `courseId` |
| `passing_score` | `passingScore` |
| `created_at` | `createdAt` |

## 🔗 Arquivos Modificados

- `src/modules/assessments/services/assessment.service.ts`
  - Adicionada função `mapAssessmentToResponse`
  - Atualizado `getAssessmentWithQuestions`
  - Corrigido e atualizado `updateAssessment`

## 🎯 Bugs Corrigidos Nesta Sessão

1. ✅ **Resposta Correta**: Mapeamento de `correct_answer` → `correctAnswer`
2. ✅ **Nota de Corte**: Mapeamento de `passing_score` → `passingScore`
3. ✅ **SQL Placeholders**: Corrigido `updateAssessment` (`${x}` → `$${x}`)

---

**Status**: ✅ Corrigido e testado
**Data**: 2025-11-20
**Backend**: Reiniciado (Processo ID: 12)
