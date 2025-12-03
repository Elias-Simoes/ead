# Regra: Módulo com Avaliação Obrigatória

## 📋 Resumo

**Regra implementada:** Todo módulo de um curso DEVE ter uma avaliação antes que o curso possa ser submetido para aprovação.

## ✅ Validações Implementadas

### 1. Validação na Submissão do Curso

Quando um instrutor tenta submeter um curso para aprovação, o sistema valida:

- ✓ Todos os módulos têm avaliação associada
- ✓ Todas as avaliações têm pelo menos uma questão
- ✓ Cada avaliação tem 10 pontos totais distribuídos entre as questões

**Arquivo:** `src/modules/courses/services/course.service.ts`

```typescript
// Check if all modules have assessments
const modulesWithoutAssessment = await client.query(
  `SELECT m.id, m.title
   FROM modules m
   LEFT JOIN assessments a ON m.id = a.module_id
   WHERE m.course_id = $1 AND a.id IS NULL`,
  [courseId]
);

if (modulesWithoutAssessment.rows.length > 0) {
  const moduleNames = modulesWithoutAssessment.rows.map((m: any) => m.title).join(', ');
  throw new Error(`MODULES_WITHOUT_ASSESSMENT: ${moduleNames}`);
}
```

### 2. Proteção Contra Deleção de Módulo com Avaliação

Não é possível deletar um módulo que possui uma avaliação associada.

**Arquivo:** `src/modules/courses/services/module.service.ts`

```typescript
// Check if module has an assessment
const assessmentCheck = await pool.query(
  'SELECT id FROM assessments WHERE module_id = $1',
  [moduleId]
);

if (assessmentCheck.rows.length > 0) {
  throw new Error('MODULE_HAS_ASSESSMENT');
}
```

**Mensagem de erro retornada:**
```json
{
  "error": {
    "code": "MODULE_HAS_ASSESSMENT",
    "message": "Cannot delete module that has an assessment. Delete the assessment first."
  }
}
```

### 3. Uma Avaliação Por Módulo

Cada módulo pode ter apenas UMA avaliação.

**Arquivo:** `src/modules/assessments/services/assessment.service.ts`

```typescript
// Check if module already has an assessment
const existing = await this.getAssessmentByModuleId(data.module_id);
if (existing) {
  throw new Error('MODULE_ALREADY_HAS_ASSESSMENT');
}
```

## 🔄 Fluxo de Trabalho

### Criação de Curso Completo

1. **Criar curso** (status: `draft`)
2. **Criar módulos** (quantos forem necessários)
3. **Criar aulas** em cada módulo
4. **Criar avaliação** para CADA módulo
5. **Adicionar questões** em cada avaliação (mínimo 1)
6. **Submeter para aprovação** ✓

### Tentativa de Submissão Sem Avaliações

```
Curso
├── Módulo 1 ✓ (tem avaliação)
├── Módulo 2 ✗ (SEM avaliação)
└── Módulo 3 ✓ (tem avaliação)

❌ ERRO: MODULES_WITHOUT_ASSESSMENT: Módulo 2
```

## 🧪 Como Testar

Execute o teste de validação:

```bash
node test-module-assessment-validation.js
```

### Cenários Testados

1. ✓ Submeter curso sem nenhuma avaliação → **BLOQUEADO**
2. ✓ Submeter curso com avaliações parciais → **BLOQUEADO**
3. ✓ Submeter curso com todas as avaliações → **PERMITIDO**
4. ✓ Deletar módulo com avaliação → **BLOQUEADO**

## 📊 Estrutura do Banco de Dados

```sql
-- Tabela modules
CREATE TABLE modules (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL
);

-- Tabela assessments (vinculada a módulos)
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Constraint: Um módulo pode ter apenas uma avaliação
-- Implementado via lógica de aplicação
```

## 🎯 Benefícios da Regra

1. **Consistência:** Todos os cursos têm estrutura padronizada
2. **Qualidade:** Garante que cada módulo tem forma de avaliação
3. **Certificação:** Permite calcular nota final baseada em todas as avaliações
4. **Integridade:** Previne submissão de cursos incompletos

## 🚨 Mensagens de Erro

### Módulos sem avaliação
```json
{
  "error": {
    "code": "MODULES_WITHOUT_ASSESSMENT",
    "message": "MODULES_WITHOUT_ASSESSMENT: Módulo 2, Módulo 5"
  }
}
```

### Avaliações sem questões
```json
{
  "error": {
    "code": "ASSESSMENTS_WITHOUT_QUESTIONS",
    "message": "ASSESSMENTS_WITHOUT_QUESTIONS: Módulo 1 - Avaliação Final"
  }
}
```

### Tentativa de deletar módulo com avaliação
```json
{
  "error": {
    "code": "MODULE_HAS_ASSESSMENT",
    "message": "Cannot delete module that has an assessment. Delete the assessment first."
  }
}
```

## 📝 Notas Importantes

- A validação ocorre no momento da **submissão para aprovação**
- Cursos em status `draft` podem ter módulos sem avaliação temporariamente
- Para deletar um módulo, primeiro delete sua avaliação
- Cada avaliação sempre tem 10 pontos totais (distribuídos entre questões)
- A nota final do curso é a média de todas as avaliações dos módulos

## ✅ Status da Implementação

- [x] Validação na submissão do curso
- [x] Proteção contra deleção de módulo com avaliação
- [x] Uma avaliação por módulo
- [x] Validação de questões nas avaliações
- [x] Testes automatizados
- [x] Documentação completa

**Data de implementação:** 2024
**Última atualização:** 2024
