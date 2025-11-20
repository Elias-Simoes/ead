# Correção: Mapeamento de Campos (snake_case → camelCase)

## 🐛 Problema Identificado

Quando você editava uma questão e salvava, a resposta correta estava sendo salva no banco de dados, mas ao recarregar a página, aparecia a opção errada selecionada.

**Exemplo:**
- Você selecionava: **C. Brasília** (índice 2)
- Salvava com sucesso
- Ao recarregar: Aparecia **A. São Paulo** (índice 0) selecionado

## 🔍 Causa Raiz

O problema estava no **mapeamento de campos** entre o banco de dados e a API.

### O que estava acontecendo:

1. **Banco de Dados (PostgreSQL)**: Usa `snake_case`
   ```sql
   correct_answer: 2  ✅ (Salvo corretamente)
   ```

2. **Service (Backend)**: Retornava os dados direto do banco
   ```typescript
   return result.rows[0];  // { correct_answer: 2, ... }
   ```

3. **Frontend**: Esperava `camelCase`
   ```typescript
   question.correctAnswer  // undefined ❌
   ```

4. **Resultado**: O frontend não encontrava `correctAnswer`, então usava o valor padrão `0`

### Fluxo do Bug:

```
Banco de Dados          Service              Frontend
┌──────────────┐       ┌─────────────┐      ┌──────────────┐
│correct_answer│  -->  │correct_answer│ --> │correctAnswer │
│      2       │       │      2       │     │  undefined   │
└──────────────┘       └─────────────┘      └──────────────┘
                                                    ↓
                                             Usa padrão: 0
```

## ✅ Solução Aplicada

Adicionei uma função helper no `assessment.service.ts` para mapear os campos do banco (snake_case) para o formato esperado pelo frontend (camelCase):

```typescript
// Helper function to map database fields to camelCase
function mapQuestionToResponse(question: any) {
  return {
    id: question.id,
    assessmentId: question.assessment_id,        // ✅ Mapeado
    text: question.text,
    type: question.type,
    options: question.options,
    correctAnswer: question.correct_answer,      // ✅ Mapeado
    points: question.points,
    orderIndex: question.order_index,            // ✅ Mapeado
    createdAt: question.created_at,              // ✅ Mapeado
  };
}
```

### Métodos Atualizados:

1. **`createQuestion`**: Agora retorna `mapQuestionToResponse(result.rows[0])`
2. **`updateQuestion`**: Agora retorna `mapQuestionToResponse(result.rows[0])`
3. **`getAssessmentWithQuestions`**: Mapeia todas as questões
4. **`getCourseAssessments`**: Mapeia todas as questões de todas as avaliações

## 🔄 Fluxo Corrigido:

```
Banco de Dados          Service              Frontend
┌──────────────┐       ┌─────────────┐      ┌──────────────┐
│correct_answer│  -->  │correctAnswer│ --> │correctAnswer │
│      2       │       │      2       │     │      2       │
└──────────────┘       └─────────────┘      └──────────────┘
                                                    ↓
                                          Brasília selecionada ✅
```

## 🧪 Como Testar

1. Recarregue a página no navegador (Ctrl+F5)
2. Edite uma questão existente
3. Selecione uma resposta correta diferente (ex: Brasília)
4. Clique em "Salvar"
5. Recarregue a página
6. ✅ A resposta correta deve estar selecionada!

## 📊 Campos Mapeados

| Banco (snake_case) | API (camelCase) |
|--------------------|-----------------|
| `assessment_id` | `assessmentId` |
| `correct_answer` | `correctAnswer` |
| `order_index` | `orderIndex` |
| `created_at` | `createdAt` |

## 🔗 Arquivos Modificados

- `src/modules/assessments/services/assessment.service.ts`
  - Adicionada função `mapQuestionToResponse`
  - Atualizado `createQuestion`
  - Atualizado `updateQuestion`
  - Atualizado `getAssessmentWithQuestions`
  - Atualizado `getCourseAssessments`

## 🎯 Impacto

Este bug afetava:
- ✅ Exibição da resposta correta ao editar questões
- ✅ Exibição da resposta correta ao visualizar questões
- ✅ Todos os endpoints que retornam questões

Agora todos os campos estão sendo mapeados corretamente! ✅

---

**Status**: ✅ Corrigido e testado
**Data**: 2025-11-20
**Backend**: Reiniciado (Processo ID: 11)
