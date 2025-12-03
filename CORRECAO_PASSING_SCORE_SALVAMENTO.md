# Correção: Passing Score não estava sendo salvo

## Problema
Quando o instrutor criava uma avaliação com nota mínima de 90%, o sistema salvava 70% (valor padrão do banco).

## Causa Raiz
O campo `passing_score` estava sendo enviado corretamente pelo frontend, mas o backend **não estava recebendo nem salvando** esse valor:

### Frontend (✅ Correto)
```typescript
// AssessmentFormPage.tsx - linha 119
await api.post(`/modules/${selectedModuleId}/assessments`, {
  title,
  type: 'multiple_choice',
  passing_score: passingScore,  // ✅ Enviando corretamente
});
```

### Backend (❌ Problema)

**1. Interface não incluía passing_score:**
```typescript
// assessment.service.ts - ANTES
export interface CreateAssessmentData {
  module_id: string;
  title: string;
  type: 'multiple_choice' | 'essay' | 'mixed';
  // passing_score estava faltando!
}
```

**2. Controller não extraía passing_score do body:**
```typescript
// assessment.controller.ts - ANTES
const { title, type } = req.body;  // ❌ Não pegava passing_score
```

**3. INSERT não incluía passing_score:**
```typescript
// assessment.service.ts - ANTES
const result = await pool.query(
  `INSERT INTO assessments (module_id, title, type)
   VALUES ($1, $2, $3)
   RETURNING *`,
  [data.module_id, data.title, data.type]
);
// ❌ passing_score não era inserido, então usava o default (70)
```

## Solução Implementada

### 1. Atualizar Interface
```typescript
// assessment.service.ts
export interface CreateAssessmentData {
  module_id: string;
  title: string;
  type: 'multiple_choice' | 'essay' | 'mixed';
  passing_score?: number;  // ✅ Adicionado
}
```

### 2. Extrair passing_score no Controller
```typescript
// assessment.controller.ts
const { title, type, passing_score } = req.body;  // ✅ Agora extrai passing_score
```

### 3. Passar para o Service
```typescript
// assessment.controller.ts
const assessment = await assessmentService.createAssessment({
  module_id: moduleId,
  title,
  type,
  passing_score,  // ✅ Passa para o service
});
```

### 4. Incluir no INSERT
```typescript
// assessment.service.ts
const result = await pool.query(
  `INSERT INTO assessments (module_id, title, type, passing_score)
   VALUES ($1, $2, $3, $4)
   RETURNING *`,
  [data.module_id, data.title, data.type, data.passing_score || 70]
);
// ✅ Agora salva o passing_score ou usa 70 como fallback
```

## Arquivos Modificados
1. `src/modules/assessments/services/assessment.service.ts`
   - Adicionado `passing_score?: number` na interface `CreateAssessmentData`
   - Atualizado INSERT para incluir `passing_score`
   - Adicionado log do passing_score

2. `src/modules/assessments/controllers/assessment.controller.ts`
   - Extraído `passing_score` do `req.body`
   - Passado `passing_score` para o service

3. `src/modules/assessments/services/student-assessment.service.ts`
   - Corrigido erro de TypeScript não relacionado (verificação de undefined)

## Como Testar

### 1. Reiniciar o Backend
```bash
npm run dev
```

### 2. Criar Nova Avaliação
1. Acesse o painel do instrutor
2. Vá em "Gerenciar Avaliações"
3. Clique em "Nova Avaliação"
4. Defina a nota mínima como **90%**
5. Salve a avaliação

### 3. Verificar no Banco
```bash
node test-passing-score-fix.js
```

Ou diretamente no PostgreSQL:
```sql
SELECT a.id, a.title, a.passing_score, m.title as module_title
FROM assessments a
JOIN modules m ON a.module_id = m.id
ORDER BY a.created_at DESC
LIMIT 1;
```

## Resultado Esperado
- ✅ Avaliação criada com `passing_score = 90`
- ✅ Valor exibido corretamente no card da avaliação
- ✅ Valor salvo corretamente no banco de dados

## Observações
- O valor padrão de 70% continua sendo usado se `passing_score` não for fornecido
- Avaliações antigas continuam com 70% (não foram atualizadas automaticamente)
- Para atualizar avaliações antigas, seria necessário um script de migração

## Status
✅ **CORRIGIDO** - Backend agora salva corretamente o passing_score enviado pelo frontend
