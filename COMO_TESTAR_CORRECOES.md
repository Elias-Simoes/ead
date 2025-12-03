# Como Testar as Correções de Avaliações

## 🧪 Testes Automatizados

### 1. Teste de Criação de Avaliação

**Script**: `test-create-assessment-fixed.js`

**O que testa**:
- Login como instrutor
- Listagem de módulos disponíveis (sem avaliação)
- Criação de avaliação para um módulo
- Adição de questões à avaliação
- Verificação da avaliação completa

**Como executar**:
```bash
node test-create-assessment-fixed.js
```

**Resultado esperado**:
```
✅ Login realizado com sucesso
✅ Módulos disponíveis: X
✅ Avaliação criada com sucesso!
✅ Questão 1 criada
✅ Questão 2 criada
📊 Avaliação completa com 2 questões
```

---

### 2. Teste de Segurança

**Script**: `test-assessment-security.js`

**O que testa**:
- Criação de avaliação pelo dono do curso (deve funcionar)
- Tentativa de criação por instrutor não autorizado (deve falhar com 403)

**Como executar**:
```bash
node test-assessment-security.js
```

**Resultado esperado**:
```
✅ Avaliação criada com sucesso pelo dono
✅ SEGURANÇA OK! Acesso negado corretamente (403)
```

---

## 🖥️ Teste Manual no Frontend

### Pré-requisitos
1. Backend rodando: `npm run dev`
2. Frontend rodando: `cd frontend && npm run dev`
3. Usuário instrutor criado

### Passo a Passo

#### 1. Login como Instrutor
```
URL: http://localhost:5173/login
Email: instructor@example.com
Senha: Senha123!
```

#### 2. Acessar Dashboard do Instrutor
```
URL: http://localhost:5173/instructor/dashboard
```

#### 3. Selecionar um Curso
- Clique em um dos seus cursos
- Vá para a aba "Avaliações"

#### 4. Criar Nova Avaliação
- Clique em "Nova Avaliação"
- Selecione um módulo (apenas módulos sem avaliação aparecerão)
- Preencha:
  - Título: "Avaliação de Teste"
  - Tipo: "Múltipla Escolha"
- Clique em "Salvar"

**Resultado esperado**: ✅ Avaliação criada com sucesso

#### 5. Adicionar Questões
- Clique em "Adicionar Questão"
- Preencha:
  - Texto: "Qual é a capital do Brasil?"
  - Tipo: "Múltipla Escolha"
  - Opções:
    - São Paulo
    - Rio de Janeiro
    - Brasília ← Marcar como correta
    - Belo Horizonte
- Clique em "Salvar Questão"

**Resultado esperado**: ✅ Questão adicionada com sucesso

#### 6. Verificar Avaliação
- A avaliação deve aparecer na lista
- Deve mostrar o módulo associado
- Deve mostrar o número de questões

---

## 🔍 Verificações de Segurança

### Teste 1: Módulo de Outro Curso
**Objetivo**: Verificar que não é possível criar avaliação para módulo de outro curso

**Como testar**:
1. Obter ID de um módulo de outro instrutor
2. Tentar fazer requisição direta:
```bash
curl -X POST http://localhost:3000/api/modules/{moduleId}/assessments \
  -H "Authorization: Bearer {seu_token}" \
  -H "Content-Type: application/json" \
  -d '{"title": "Teste", "type": "multiple_choice"}'
```

**Resultado esperado**: 
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to create assessments for this module"
  }
}
```

### Teste 2: Módulo Inexistente
**Objetivo**: Verificar tratamento de módulo inexistente

**Como testar**:
```bash
curl -X POST http://localhost:3000/api/modules/00000000-0000-0000-0000-000000000000/assessments \
  -H "Authorization: Bearer {seu_token}" \
  -H "Content-Type: application/json" \
  -d '{"title": "Teste", "type": "multiple_choice"}'
```

**Resultado esperado**:
```json
{
  "error": {
    "code": "MODULE_NOT_FOUND",
    "message": "Module not found"
  }
}
```

### Teste 3: Módulo Já Tem Avaliação
**Objetivo**: Verificar que não é possível criar segunda avaliação

**Como testar**:
1. Criar avaliação para um módulo
2. Tentar criar outra avaliação para o mesmo módulo

**Resultado esperado**:
```json
{
  "error": {
    "code": "MODULE_ALREADY_HAS_ASSESSMENT",
    "message": "This module already has an assessment"
  }
}
```

---

## 📊 Verificação no Banco de Dados

### Verificar Constraint
```sql
-- Verificar que avaliações têm OU course_id OU module_id
SELECT 
  id,
  course_id,
  module_id,
  title,
  CASE 
    WHEN course_id IS NOT NULL AND module_id IS NULL THEN 'OK - Por Curso'
    WHEN course_id IS NULL AND module_id IS NOT NULL THEN 'OK - Por Módulo'
    ELSE 'ERRO - Ambos ou Nenhum'
  END as status
FROM assessments;
```

**Resultado esperado**: Todas as linhas devem ter status "OK"

### Verificar Integridade
```sql
-- Verificar que módulos pertencem aos cursos corretos
SELECT 
  a.id as assessment_id,
  a.title as assessment_title,
  m.id as module_id,
  m.title as module_title,
  m.course_id,
  c.title as course_title,
  c.instructor_id
FROM assessments a
JOIN modules m ON a.module_id = m.id
JOIN courses c ON m.course_id = c.id
ORDER BY c.title, m.order_index;
```

**Resultado esperado**: Todos os módulos devem pertencer aos cursos corretos

---

## ✅ Checklist de Validação

### Funcionalidade
- [ ] Avaliação é criada com sucesso
- [ ] Questões são adicionadas corretamente
- [ ] Avaliação aparece na lista
- [ ] Módulo fica marcado como "tem avaliação"

### Segurança
- [ ] Apenas dono do curso pode criar avaliação
- [ ] Erro 403 para instrutor não autorizado
- [ ] Erro 404 para módulo inexistente
- [ ] Erro 400 para módulo que já tem avaliação

### Integridade
- [ ] Constraint do banco respeitada
- [ ] Apenas module_id é inserido (não course_id)
- [ ] Relação módulo → curso mantida
- [ ] Dados consistentes no banco

### Cálculo de Certificado
- [ ] Apenas avaliações do curso correto são consideradas
- [ ] Nota de corte calculada corretamente
- [ ] Certificado gerado apenas com avaliações válidas

---

## 🐛 Problemas Conhecidos

### Rate Limit
Se receber erro de rate limit ao testar:
```bash
node clear-rate-limit.js
```

### Módulos Sem Avaliação
Se todos os módulos já tiverem avaliação, você pode:
1. Deletar uma avaliação existente
2. Criar um novo módulo
3. Criar um novo curso com módulos

---

## 📞 Suporte

Se encontrar algum problema:
1. Verificar logs do backend
2. Verificar console do navegador
3. Executar scripts de teste
4. Consultar documentação criada:
   - `CORRECAO_BUG_CRIACAO_AVALIACAO.md`
   - `CORRECAO_COMPLETA_SEGURANCA_AVALIACOES.md`
   - `RESUMO_FINAL_CORRECOES_AVALIACOES.md`
