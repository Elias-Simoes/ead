# Plano: Criação de Avaliações com Questões de Múltipla Escolha

## Objetivo

Permitir que o instrutor crie avaliações com questões de múltipla escolha, marcando a resposta correta, e definindo a nota de corte. O sistema deve calcular automaticamente se o aluno passou ou não.

## Estrutura Atual do Banco de Dados

### Tabela `assessments`
```sql
- id (UUID)
- course_id (UUID) → courses
- title (VARCHAR)
- type ('multiple_choice' | 'essay' | 'mixed')
- passing_score (DECIMAL) → Nota de corte (0-100)
- created_at (TIMESTAMP)
```

### Tabela `questions`
```sql
- id (UUID)
- assessment_id (UUID) → assessments
- text (TEXT) → Texto da questão
- type ('multiple_choice' | 'essay')
- options (JSONB) → Array de opções
- correct_answer (INTEGER) → Índice da resposta correta (0-based)
- points (DECIMAL) → Pontos da questão
- order_index (INTEGER) → Ordem da questão
- created_at (TIMESTAMP)
```

### Tabela `student_assessments`
```sql
- id (UUID)
- student_id (UUID)
- assessment_id (UUID)
- answers (JSONB) → Respostas do aluno
- score (DECIMAL) → Nota calculada
- status ('pending' | 'graded' | 'passed' | 'failed')
- submitted_at (TIMESTAMP)
- graded_at (TIMESTAMP)
- graded_by (UUID)
- feedback (TEXT)
```

## Funcionalidades a Implementar

### 1. Backend - API Endpoints

#### Criar Avaliação
```
POST /api/courses/:courseId/assessments
Body: {
  title: string
  type: 'multiple_choice' | 'essay' | 'mixed'
  passing_score: number (0-100)
}
```

#### Adicionar Questão
```
POST /api/assessments/:assessmentId/questions
Body: {
  text: string
  type: 'multiple_choice'
  options: string[] (array de opções)
  correct_answer: number (índice da resposta correta, 0-based)
  points: number
  order_index: number
}
```

#### Atualizar Questão
```
PATCH /api/questions/:questionId
Body: {
  text?: string
  options?: string[]
  correct_answer?: number
  points?: number
}
```

#### Deletar Questão
```
DELETE /api/questions/:questionId
```

#### Listar Avaliações do Curso
```
GET /api/courses/:courseId/assessments
```

#### Obter Avaliação com Questões
```
GET /api/assessments/:assessmentId
Response: {
  assessment: {...}
  questions: [...]
}
```

### 2. Frontend - Interface do Instrutor

#### Página: AssessmentFormPage
**Rota**: `/instructor/courses/:id/assessments/new` ou `/instructor/courses/:id/assessments/:assessmentId/edit`

**Seções**:

1. **Informações Básicas**
   - Título da Avaliação
   - Tipo (múltipla escolha, dissertativa, mista)
   - Nota de Corte (0-100%)

2. **Questões**
   - Lista de questões criadas
   - Botão "+ Adicionar Questão"
   - Para cada questão:
     - Texto da questão
     - Tipo (múltipla escolha / dissertativa)
     - Opções (A, B, C, D, E)
     - Marcar resposta correta (radio button)
     - Pontos da questão
     - Botões: Editar, Excluir, Mover para cima/baixo

3. **Resumo**
   - Total de questões
   - Total de pontos
   - Nota de corte
   - Botão "Salvar Avaliação"

### 3. Cálculo Automático de Nota

Quando o aluno submeter a avaliação:

```typescript
// Para questões de múltipla escolha
function calculateScore(questions, studentAnswers) {
  let totalPoints = 0;
  let earnedPoints = 0;
  
  questions.forEach((question, index) => {
    totalPoints += question.points;
    
    if (question.type === 'multiple_choice') {
      const studentAnswer = studentAnswers[index];
      if (studentAnswer === question.correct_answer) {
        earnedPoints += question.points;
      }
    }
  });
  
  const score = (earnedPoints / totalPoints) * 100;
  const passed = score >= assessment.passing_score;
  
  return { score, passed, earnedPoints, totalPoints };
}
```

## Fluxo de Criação

1. Instrutor acessa "Gerenciar Avaliações" do curso
2. Clica em "Nova Avaliação"
3. Preenche título, tipo e nota de corte
4. Clica em "+ Adicionar Questão"
5. Preenche:
   - Texto da questão
   - Opções (A, B, C, D, E)
   - Marca a resposta correta
   - Define pontos
6. Repete para cada questão
7. Revisa o resumo
8. Clica em "Salvar Avaliação"

## Validações

- Título obrigatório
- Nota de corte entre 0 e 100
- Pelo menos 1 questão
- Cada questão deve ter:
  - Texto não vazio
  - Pelo menos 2 opções (para múltipla escolha)
  - Uma resposta correta marcada
  - Pontos > 0

## Próximos Passos

1. ✅ Verificar estrutura do banco (já existe)
2. ⏳ Implementar endpoints no backend
3. ⏳ Criar interface no frontend
4. ⏳ Implementar cálculo automático
5. ⏳ Testar fluxo completo

## Arquivos a Criar/Modificar

### Backend
- `src/modules/assessments/controllers/assessment.controller.ts` (já existe, adicionar métodos)
- `src/modules/assessments/services/assessment.service.ts` (já existe, adicionar métodos)
- `src/modules/assessments/routes/assessment.routes.ts` (já existe, adicionar rotas)

### Frontend
- `frontend/src/pages/instructor/AssessmentFormPage.tsx` (criar)
- `frontend/src/components/QuestionEditor.tsx` (criar)
- `frontend/src/types/index.ts` (adicionar tipos)

## Status

📋 Planejamento concluído
⏳ Aguardando implementação
