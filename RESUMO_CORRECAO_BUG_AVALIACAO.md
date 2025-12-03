# Resumo: Correção do Bug de Criação de Avaliação

## 📋 Contexto
O usuário reportou erro ao tentar criar uma avaliação através do frontend. O sistema retornava erro 400/500.

## 🔍 Investigação

### 1. Primeiro Diagnóstico
- Script de teste inicial (`debug-create-assessment-error.js`) estava usando endpoint errado
- Estava enviando para `/api/assessments` (deprecated)
- Estava enviando `moduleId` no body e `questions` junto

### 2. Segundo Diagnóstico  
- Corrigido para usar endpoint correto: `/api/modules/:moduleId/assessments`
- Separado criação de avaliação e questões
- Descoberto erro real: **Constraint violation**

### 3. Causa Raiz Identificada
```
"new row for relation \"assessments\" violates check constraint \"assessments_course_or_module_check\""
```

O service estava inserindo **AMBOS** `course_id` e `module_id`, violando a constraint que exige **OU** um **OU** outro.

## ✅ Solução Implementada

### Arquivo Modificado
`src/modules/assessments/services/assessment.service.ts`

### Mudança no Método `createAssessment()`

**ANTES:**
```typescript
const result = await pool.query(
  `INSERT INTO assessments (course_id, module_id, title, type)
   VALUES ($1, $2, $3, $4)
   RETURNING *`,
  [courseId, data.module_id, data.title, data.type]
);
```

**DEPOIS:**
```typescript
const result = await pool.query(
  `INSERT INTO assessments (module_id, title, type)
   VALUES ($1, $2, $3)
   RETURNING *`,
  [data.module_id, data.title, data.type]
);
```

### Justificativa
- A constraint `assessments_course_or_module_check` exige: `(course_id IS NOT NULL AND module_id IS NULL) OR (course_id IS NULL AND module_id IS NOT NULL)`
- No novo modelo, avaliações são criadas **por módulo**, não por curso
- O `course_id` pode ser obtido via JOIN quando necessário
- Mantém integridade referencial e modelo de dados consistente

## 🧪 Validação

### Script de Teste Criado
`test-create-assessment-fixed.js`

### Fluxo Testado
1. ✅ Login como instrutor
2. ✅ Listar módulos disponíveis (sem avaliação)
3. ✅ Criar avaliação para módulo específico
4. ✅ Adicionar questões à avaliação
5. ✅ Verificar avaliação completa

### Resultado
```json
{
  "message": "Assessment created successfully",
  "data": {
    "assessment": {
      "id": "60a396e5-3d48-41ea-8bed-f5162ebc17f3",
      "course_id": null,
      "title": "Avaliação de Teste - Corrigida",
      "type": "multiple_choice",
      "created_at": "2025-11-26T16:49:11.931Z",
      "module_id": "30bfe64d-fd4e-488c-9de9-6a3bca1ca471"
    }
  }
}
```

## 📝 Observações Adicionais

### Frontend
O frontend (`AssessmentFormPage.tsx`) já estava correto:
- Usa endpoint correto: `/modules/${selectedModuleId}/assessments`
- Envia apenas `title`, `type` e `passing_score` no body
- `passing_score` é ignorado pelo backend (não está no validador), mas não causa erro

### Endpoints

**✅ CORRETO - Criar avaliação por módulo:**
```
POST /api/modules/:moduleId/assessments
Body: { title, type }
```

**❌ DEPRECATED - Criar avaliação por curso:**
```
POST /api/courses/:id/assessments
```
(Retorna erro 400 informando que está deprecated)

### Constraint do Banco
```sql
ALTER TABLE assessments 
ADD CONSTRAINT assessments_course_or_module_check 
CHECK (
  (course_id IS NOT NULL AND module_id IS NULL) OR 
  (course_id IS NULL AND module_id IS NOT NULL)
);
```

Esta constraint garante que:
- Avaliações antigas (por curso) continuam funcionando
- Avaliações novas (por módulo) funcionam corretamente
- Não é possível ter avaliação com ambos ou nenhum

## 🎯 Impacto

### Antes da Correção
- ❌ Impossível criar avaliações através do frontend
- ❌ Erro 500 ao tentar criar avaliação
- ❌ Constraint violation no banco de dados

### Depois da Correção
- ✅ Avaliações podem ser criadas normalmente
- ✅ Constraint respeitada
- ✅ Modelo de dados consistente
- ✅ Frontend funcionando corretamente

## 📅 Informações
- **Data:** 26 de novembro de 2025
- **Arquivos Modificados:** 1
- **Arquivos de Teste Criados:** 2
- **Documentação Criada:** 2

## 🚀 Próximos Passos
1. ✅ Bug corrigido e testado
2. ✅ Documentação criada
3. ⏭️ Usuário pode testar no frontend
4. ⏭️ Commit das mudanças se aprovado
