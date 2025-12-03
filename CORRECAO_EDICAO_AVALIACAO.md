# Correção: Erro ao Editar Avaliação

## Problema

Ao tentar editar uma avaliação, aparece o erro "Failed to update assessment".

## Causa Raiz

O frontend estava tentando atualizar o campo `passing_score` na tabela `assessments`, mas essa coluna **não existe** nessa tabela.

A nota de corte (`passing_score`) está armazenada na tabela `courses`, não em `assessments`. O sistema atual não permite configurar nota de corte por avaliação individual.

## Correções Implementadas

### 1. Frontend (`frontend/src/pages/instructor/AssessmentFormPage.tsx`)

**Correção 1: Remover passing_score do PATCH**
```typescript
// ❌ ANTES
await api.patch(`/assessments/${assessmentId}`, {
  title,
  passing_score: passingScore,
});

// ✅ DEPOIS
await api.patch(`/assessments/${assessmentId}`, {
  title,
});
```

**Correção 2: Ocultar campo de nota de corte na edição**
```typescript
// Nota de corte só aparece ao CRIAR nova avaliação
{!assessmentId && (
  <div>
    <label>Nota de Corte (%)</label>
    <input type="number" value={passingScore} ... />
  </div>
)}
```

### 2. Backend (`src/modules/assessments/services/assessment.service.ts`)

**Método `updateAssessment` precisa ser corrigido:**

```typescript
// ❌ ANTES
async updateAssessment(assessmentId: string, data: { title?: string; passing_score?: number })

// ✅ DEPOIS
async updateAssessment(assessmentId: string, data: { title?: string })
```

E remover a lógica de atualização do `passing_score`:

```typescript
async updateAssessment(assessmentId: string, data: { title?: string }): Promise<Assessment> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(data.title);
    }

    if (updates.length === 0) {
      throw new Error('NO_UPDATES_PROVIDED');
    }

    values.push(assessmentId);

    const result = await pool.query(
      `UPDATE assessments 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('ASSESSMENT_NOT_FOUND');
    }

    logger.info('Assessment updated', { assessmentId });

    return result.rows[0];
  } catch (error) {
    logger.error('Failed to update assessment', error);
    throw error;
  }
}
```

## Estrutura do Banco de Dados

```
assessments
├── id (uuid)
├── course_id (uuid) - NULL para avaliações de módulo
├── module_id (uuid) - ID do módulo
├── title (varchar)
├── type (varchar)
└── created_at (timestamp)

courses
├── id (uuid)
├── title (varchar)
├── passing_score (integer) ← Nota de corte está AQUI
└── ...
```

## Como Funciona Agora

1. **Criar Avaliação**: Permite definir nota de corte (que é salva no curso)
2. **Editar Avaliação**: Permite apenas editar o título (nota de corte não é editável por avaliação)
3. **Adicionar Questões**: Funciona normalmente
4. **Editar Questões**: Funciona normalmente

## Teste

Após as correções:
1. Acesse a página de edição de uma avaliação
2. Altere o título
3. Clique em "Atualizar Avaliação"
4. Deve salvar com sucesso

## Status

- ✅ Frontend corrigido
- ⚠️  Backend precisa ser corrigido manualmente (arquivo foi modificado pelo autofix)

## Próximos Passos

1. Aplicar a correção no backend manualmente
2. Reiniciar o servidor backend
3. Testar a edição de avaliação
4. Remover os logs temporários do controller

## Data da Correção

25 de novembro de 2025 - 20:30
