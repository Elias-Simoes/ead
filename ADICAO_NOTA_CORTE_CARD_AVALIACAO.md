# Adição da Nota de Corte no Card de Avaliação

## 🎯 Objetivo

Adicionar a exibição da nota de corte (passing score) no card de avaliação, mesmo que ela seja imutável, para que o instrutor possa visualizar essa informação importante.

## 📍 Problema Identificado

A coluna `passing_score` não existia na tabela `assessments` do banco de dados, impedindo que essa informação fosse armazenada e exibida.

## 🔧 Modificações Implementadas

### 1. Migração do Banco de Dados

**Arquivo**: `scripts/migrations/026_add_passing_score_to_assessments.sql`

**Mudanças**:
- Adicionada coluna `passing_score` do tipo INTEGER
- Valor padrão: 70 (70%)
- Constraint para garantir valores entre 0 e 100
- Comentário descritivo na coluna

```sql
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS passing_score INTEGER NOT NULL DEFAULT 70;

ALTER TABLE assessments 
ADD CONSTRAINT passing_score_range CHECK (passing_score >= 0 AND passing_score <= 100);

COMMENT ON COLUMN assessments.passing_score IS 'Minimum score (percentage) required to pass the assessment';
```

### 2. Backend - Service de Avaliações

**Arquivo**: `src/modules/assessments/services/assessment.service.ts`

**Método**: `mapAssessmentToResponse()`

**Mudança**: Adicionado campo `passingScore` no mapeamento

```typescript
// ANTES
function mapAssessmentToResponse(assessment: any, questions?: any[]) {
  return {
    id: assessment.id,
    moduleId: assessment.module_id,
    title: assessment.title,
    type: assessment.type,
    createdAt: assessment.created_at,
    questions: questions || [],
  };
}

// DEPOIS
function mapAssessmentToResponse(assessment: any, questions?: any[]) {
  return {
    id: assessment.id,
    moduleId: assessment.module_id,
    title: assessment.title,
    type: assessment.type,
    passingScore: assessment.passing_score,  // ← NOVO CAMPO
    createdAt: assessment.created_at,
    questions: questions || [],
  };
}
```

### 3. Frontend - Interface TypeScript

**Arquivo**: `frontend/src/types/index.ts`

A interface `Assessment` já tinha o campo `passingScore`:

```typescript
export interface Assessment {
  id: string
  courseId: string
  title: string
  type: 'multiple_choice' | 'essay'
  passingScore: number  // ← JÁ EXISTIA
  questions: Question[]
  createdAt: Date
}
```

### 4. Frontend - Card de Avaliação

**Localização**: Onde quer que o card de avaliação seja renderizado (ex: `AssessmentsManagementPage.tsx` ou `CourseDetailPage.tsx`)

**Exemplo de como adicionar**:

```tsx
<div className="space-y-2 text-sm text-gray-600">
  <div className="flex justify-between">
    <span>Módulo:</span>
    <span className="font-medium">{assessment.moduleTitle}</span>
  </div>
  <div className="flex justify-between">
    <span>Nota de Corte:</span>
    <span className="font-medium">{assessment.passingScore}%</span>
  </div>
  <div className="flex justify-between">
    <span>Questões:</span>
    <span className="font-medium">{assessment.questions?.length || 0}</span>
  </div>
</div>
```

## 📊 Resultado Visual

### Antes
```
┌─────────────────────────────────────┐
│ Avaliação de Teste           [tipo] │
│ Módulo: Module 1 - Introduction     │
│                                     │
│ Questões: 5                         │
│                                     │
│ [Editar] [Excluir]                  │
└─────────────────────────────────────┘
```

### Depois
```
┌─────────────────────────────────────┐
│ Avaliação de Teste           [tipo] │
│ Módulo: Module 1 - Introduction     │
│ Nota de Corte: 70%                  │  ← NOVO!
│                                     │
│ Questões: 5                         │
│                                     │
│ [Editar] [Excluir]                  │
└─────────────────────────────────────┘
```

## 🧪 Teste

### Script de Teste
**Arquivo**: `test-passing-score-display.js`

### Resultado do Teste
```
✅ 2 avaliações encontradas

📋 Detalhes das avaliações:

   1. tESTE
      Módulo: Module 1 - Introduction
      Nota de Corte: 70%
      ✅ Nota de corte disponível

   2. Avaliação de Teste - Corrigida
      Módulo: Module 2 - Advanced Topics
      Nota de Corte: 70%
      ✅ Nota de corte disponível
```

### Como Executar o Teste
```bash
node test-passing-score-display.js
```

## 📝 Observações

### Valor Padrão
- Todas as avaliações existentes receberam automaticamente o valor padrão de 70%
- Novas avaliações também terão 70% como padrão

### Imutabilidade
- A nota de corte é definida na criação da avaliação
- Não há interface para editar esse valor (conforme requisito)
- O valor é apenas exibido para informação do instrutor

### Validação
- Constraint no banco garante valores entre 0 e 100
- Validação adicional pode ser adicionada no backend se necessário

## 🎯 Benefícios

1. **Transparência**: Instrutor vê claramente qual é a nota mínima para aprovação
2. **Consistência**: Informação sempre visível junto com outros dados da avaliação
3. **Rastreabilidade**: Valor armazenado no banco de dados para auditoria
4. **Padrão Sensato**: Valor padrão de 70% é adequado para a maioria dos casos

## 📅 Informações

- **Data**: 01 de dezembro de 2025
- **Migração**: 026_add_passing_score_to_assessments.sql
- **Arquivos Modificados**: 2
  - `src/modules/assessments/services/assessment.service.ts`
  - Frontend (a ser implementado no card específico)
- **Teste Criado**: `test-passing-score-display.js`
- **Status**: ✅ Backend implementado e testado | ⏳ Frontend pendente

## 🚀 Próximos Passos

1. ✅ Migração do banco de dados executada
2. ✅ Backend atualizado para retornar `passingScore`
3. ✅ Teste do backend realizado com sucesso
4. ⏭️ Atualizar o card de avaliação no frontend para exibir a nota de corte
5. ⏭️ Testar no navegador
6. ⏭️ Commit das mudanças
