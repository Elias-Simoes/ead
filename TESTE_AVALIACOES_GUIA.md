# 🧪 Guia de Testes - Módulo de Avaliações

## ⚠️ Importante: Rate Limit

O sistema possui rate limit no endpoint de login. Se você receber erro de "RATE_LIMIT_EXCEEDED", aguarde 15 minutos antes de tentar novamente.

## 📋 Pré-requisitos

1. Servidor rodando: `npm run dev`
2. Banco de dados configurado e migrations executadas
3. Usuários criados (admin, instrutor, aluno)

## 🔧 Setup Inicial

Execute o script de setup para criar os dados necessários:

```bash
node setup-test-assessments.js
```

Este script irá:
- ✅ Criar instrutor de teste
- ✅ Registrar aluno de teste
- ✅ Criar curso de teste
- ✅ Publicar o curso

### Credenciais Criadas

**Instrutor:**
- Email: `instructor@test.com`
- Senha: (será exibida no console - senha temporária)

**Aluno:**
- Email: `student@test.com`
- Senha: `Student@123`

## 🧪 Executar Testes Automatizados

Após aguardar o rate limit (se necessário), execute:

```bash
node test-assessments-with-setup.js
```

## 📝 Testes Manuais (Alternativa)

Se preferir testar manualmente, siga os passos abaixo:

### 1. Login como Instrutor

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "instructor@test.com",
  "password": "SENHA_TEMPORARIA_AQUI"
}
```

Guarde o `accessToken` retornado.

### 2. Criar Avaliação

```http
POST http://localhost:3000/api/courses/{COURSE_ID}/assessments
Authorization: Bearer {INSTRUCTOR_TOKEN}
Content-Type: application/json

{
  "title": "Avaliação Final",
  "type": "mixed",
  "passing_score": 70
}
```

Guarde o `assessment_id` retornado.

### 3. Adicionar Questão de Múltipla Escolha

```http
POST http://localhost:3000/api/assessments/{ASSESSMENT_ID}/questions
Authorization: Bearer {INSTRUCTOR_TOKEN}
Content-Type: application/json

{
  "text": "Qual é a capital do Brasil?",
  "type": "multiple_choice",
  "options": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
  "correct_answer": 2,
  "points": 10,
  "order_index": 1
}
```

### 4. Adicionar Questão Dissertativa

```http
POST http://localhost:3000/api/assessments/{ASSESSMENT_ID}/questions
Authorization: Bearer {INSTRUCTOR_TOKEN}
Content-Type: application/json

{
  "text": "Explique a importância da educação a distância.",
  "type": "essay",
  "points": 10,
  "order_index": 2
}
```

### 5. Login como Aluno

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "student@test.com",
  "password": "Student@123"
}
```

### 6. Visualizar Avaliação (Aluno)

```http
GET http://localhost:3000/api/assessments/{ASSESSMENT_ID}
Authorization: Bearer {STUDENT_TOKEN}
```

**Resultado esperado:**
- ✅ Retorna a avaliação com as questões
- ✅ NÃO mostra as respostas corretas
- ✅ Indica se o aluno já submeteu (`hasSubmitted`)

### 7. Submeter Respostas (Aluno)

```http
POST http://localhost:3000/api/assessments/{ASSESSMENT_ID}/submit
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{
  "answers": [
    {
      "question_id": "{QUESTION_1_ID}",
      "answer": 2
    },
    {
      "question_id": "{QUESTION_2_ID}",
      "answer": "A educação a distância é importante porque..."
    }
  ]
}
```

**Resultado esperado:**
- ✅ Submissão aceita
- ✅ Nota calculada automaticamente para múltipla escolha
- ✅ Status "pending" porque tem questão dissertativa

### 8. Tentar Resubmeter (Deve Falhar)

```http
POST http://localhost:3000/api/assessments/{ASSESSMENT_ID}/submit
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{
  "answers": [...]
}
```

**Resultado esperado:**
- ❌ Erro 400: ASSESSMENT_ALREADY_SUBMITTED

### 9. Listar Avaliações Pendentes (Instrutor)

```http
GET http://localhost:3000/api/instructor/assessments/pending
Authorization: Bearer {INSTRUCTOR_TOKEN}
```

**Resultado esperado:**
- ✅ Lista de avaliações pendentes de correção
- ✅ Inclui informações do aluno

### 10. Ver Submissões de uma Avaliação (Instrutor)

```http
GET http://localhost:3000/api/assessments/{ASSESSMENT_ID}/submissions
Authorization: Bearer {INSTRUCTOR_TOKEN}
```

**Resultado esperado:**
- ✅ Lista todas as submissões dos alunos
- ✅ Mostra respostas e status

### 11. Corrigir Avaliação (Instrutor)

```http
PATCH http://localhost:3000/api/student-assessments/{STUDENT_ASSESSMENT_ID}/grade
Authorization: Bearer {INSTRUCTOR_TOKEN}
Content-Type: application/json

{
  "score": 90,
  "feedback": "Excelente trabalho!"
}
```

**Resultado esperado:**
- ✅ Avaliação corrigida
- ✅ Status atualizado para "graded"
- ✅ Nota final do curso recalculada automaticamente

## ✅ Funcionalidades Testadas

### Criação de Avaliações (Instrutor)
- [x] Criar avaliação para um curso
- [x] Adicionar questões de múltipla escolha
- [x] Adicionar questões dissertativas
- [x] Editar questões
- [x] Remover questões
- [x] Validação de ownership (só o instrutor do curso pode criar)

### Submissão de Avaliações (Aluno)
- [x] Visualizar avaliação (sem ver respostas corretas)
- [x] Submeter respostas
- [x] Cálculo automático de nota (múltipla escolha)
- [x] Status "pending" para dissertativas
- [x] Bloqueio de resubmissão

### Correção de Avaliações (Instrutor)
- [x] Listar avaliações pendentes
- [x] Ver submissões dos alunos
- [x] Atribuir nota e feedback
- [x] Atualização de status para "graded"
- [x] Registro de quem corrigiu e quando

### Cálculo de Nota Final
- [x] Cálculo de média ponderada
- [x] Peso baseado nos pontos das questões
- [x] Atualização automática após correção
- [x] Armazenamento em student_progress

## 🔐 Segurança Testada

- [x] Instrutor só acessa avaliações de seus cursos
- [x] Aluno não vê respostas corretas
- [x] Bloqueio de resubmissão no banco (UNIQUE constraint)
- [x] Validação de ownership em todas as operações
- [x] Transações para consistência de dados

## 📊 Resultados Esperados

Quando todos os testes passarem, você verá:

```
╔════════════════════════════════════════╗
║           RESUMO DOS TESTES            ║
╚════════════════════════════════════════╝
Total de testes: 11
Passou: 11
Falhou: 0
Taxa de sucesso: 100.0%
```

## 🐛 Troubleshooting

### Erro: RATE_LIMIT_EXCEEDED
**Solução:** Aguarde 15 minutos antes de tentar novamente.

### Erro: COURSE_NOT_FOUND
**Solução:** Execute o setup novamente para criar o curso.

### Erro: INVALID_TOKEN
**Solução:** Faça login novamente para obter um novo token.

### Erro: ASSESSMENT_NOT_FOUND
**Solução:** Verifique se o ID da avaliação está correto.

## 📝 Notas

- Os testes criam dados reais no banco de dados
- Você pode executar os testes múltiplas vezes
- Cada execução cria novos registros
- Para limpar os dados, você pode resetar o banco de dados

## 🎯 Próximos Passos

Após confirmar que todos os testes passam:
1. Testar integração com o módulo de certificados
2. Testar cálculo de nota final em cenários complexos
3. Testar performance com múltiplas submissões
4. Adicionar testes de carga
