# Correção: Usuário Mostrando "Assinatura Cancelada" com Acesso aos Cursos

## Problema Identificado

O usuário `test.student.1765282617668@test.com` estava mostrando "Status: Cancelada" no perfil, mas ainda tinha acesso aos cursos normalmente.

## Causa Raiz

O script `create-new-test-student.js` estava criando apenas o registro na tabela `users` com `role='student'`, mas **não estava criando** o registro correspondente na tabela `students`.

### Estrutura do Banco de Dados

```
users (tabela principal)
  ├── id
  ├── name
  ├── email
  ├── password_hash
  └── role

students (tabela de dados específicos do estudante)
  ├── id (FK para users.id)
  ├── subscription_status
  ├── subscription_expires_at
  ├── total_study_time
  ├── gdpr_consent
  └── gdpr_consent_at
```

### O que estava acontecendo

1. Script criava usuário na tabela `users` ✅
2. Script **NÃO** criava registro na tabela `students` ❌
3. Endpoint `/auth/me` fazia LEFT JOIN com `students` e retornava `null` para subscription_status
4. Frontend interpretava isso de forma inconsistente

## Solução Implementada

### 1. Corrigido o script `create-new-test-student.js`

Agora o script:
- Usa transação (BEGIN/COMMIT/ROLLBACK)
- Cria registro na tabela `users`
- Cria registro correspondente na tabela `students` com:
  - `subscription_status = 'inactive'`
  - `subscription_expires_at = null`
  - `total_study_time = 0`
  - `gdpr_consent = true`
  - `gdpr_consent_at = NOW()`

### 2. Criado script de correção `fix-old-test-student.js`

Para corrigir usuários que já foram criados sem o registro na tabela `students`.

## Como Usar

### Criar Novo Usuário de Teste (Correto)

```bash
node create-new-test-student.js
```

Isso vai criar:
- ✅ Registro na tabela `users`
- ✅ Registro na tabela `students`
- ✅ Status correto: `inactive` (sem assinatura)

### Corrigir Usuário Antigo

```bash
node fix-old-test-student.js
```

## Verificação

Para verificar se um usuário tem o registro correto:

```bash
node check-student-record.js
```

## Resultado Esperado

Agora os usuários criados terão:

1. ✅ Status correto no perfil: "Inativa" (não "Cancelada")
2. ✅ Sem acesso aos cursos (porque subscription_status = 'inactive')
3. ✅ Podem fazer o fluxo completo de pagamento PIX
4. ✅ Após pagamento, status muda para 'active' e ganham acesso

## Novos Usuários de Teste Criados

### Usuário 1 (Antigo - Corrigido)
- Email: `test.student.1765282617668@test.com`
- Senha: `Test123!@#`
- ID: `282a0a3f-9729-4dea-aa25-84ecc1a5bee9`
- Status: `inactive` ✅

### Usuário 2 (Novo - Criado Corretamente)
- Email: `test.student.1765284983885@test.com`
- Senha: `Test123!@#`
- ID: `52e59a2e-83a2-4ce3-832b-d9a67e1af4b2`
- Status: `inactive` ✅

## Scripts Criados

1. `create-new-test-student.js` - Criar novo usuário de teste (CORRIGIDO)
2. `fix-old-test-student.js` - Corrigir usuário antigo
3. `check-student-record.js` - Verificar registro na tabela students
4. `debug-user-subscription.js` - Debug completo de usuário e assinatura

## Lições Aprendidas

1. Sempre criar registros em tabelas relacionadas quando criar um usuário
2. Usar transações para garantir consistência
3. Validar que todos os registros necessários foram criados
4. LEFT JOIN pode retornar NULL e causar comportamentos inesperados no frontend
