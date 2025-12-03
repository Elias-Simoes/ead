# Correção: Bug ao Salvar Resposta Correta com Índice 0

## Problema Identificado

Quando uma questão de múltipla escolha tinha a primeira opção (índice 0) como resposta correta, o sistema não salvava corretamente no banco de dados. O campo `correct_answer` ficava como `null` ao invés de `0`.

## Causa Raiz

O bug estava no service de assessments (`assessment.service.ts`), onde usava-se a expressão:

```typescript
data.correct_answer || null
```

Em JavaScript, o valor `0` é considerado "falsy", então a expressão `0 || null` resulta em `null`. Isso fazia com que a primeira opção nunca fosse salva corretamente.

## Locais Afetados

O bug estava presente em dois métodos:

1. **`createQuestion`** (linha 201)
2. **`createQuestionWithRecalculation`** (linha 532)

## Correção Aplicada

### Arquivo: `src/modules/assessments/services/assessment.service.ts`

**Método `createQuestion` - Linha 201:**

```typescript
// ANTES (bug)
data.correct_answer || null

// DEPOIS (corrigido)
data.correct_answer !== undefined ? data.correct_answer : null
```

**Método `createQuestionWithRecalculation` - Linha 532:**

```typescript
// ANTES (bug)
data.correct_answer || null

// DEPOIS (corrigido)
data.correct_answer !== undefined ? data.correct_answer : null
```

## Correção de Dados Existentes

Foi criado um script (`fix-first-question-correct-answer.js`) para corrigir a questão existente no banco de dados que estava com `correct_answer: null`.

### Resultado da Correção

```
Questão ID: 0350eaed-a2e6-4c7e-8a71-c3872b4284ef
Texto: "Teste de criação de questão."
correct_answer: null → 0 ✅
```

## Comportamento Esperado

Agora:
- ✅ A primeira opção (índice 0) pode ser salva corretamente como resposta correta
- ✅ Todas as opções (0, 1, 2, 3, etc.) funcionam corretamente
- ✅ O indicador "✓ Correta" aparece na interface para todas as opções
- ✅ O valor `0` é tratado corretamente como um valor válido, não como falsy

## Teste

Para testar a correção:

1. Crie uma nova questão de múltipla escolha
2. Selecione a primeira opção como resposta correta
3. Salve a questão
4. Verifique que o indicador "✓ Correta" aparece na primeira opção
5. Verifique no banco de dados que `correct_answer = 0`

## Lição Aprendida

Ao trabalhar com valores numéricos que podem ser `0`, sempre use verificações explícitas:

```typescript
// ❌ ERRADO - trata 0 como falsy
value || defaultValue

// ✅ CORRETO - verifica explicitamente undefined/null
value !== undefined ? value : defaultValue
// ou
value ?? defaultValue  // nullish coalescing operator
```

## Data da Correção

25 de novembro de 2025
