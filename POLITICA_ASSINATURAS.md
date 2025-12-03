# Política de Assinaturas - Plataforma EAD

## Visão Geral

A plataforma implementa um sistema de assinaturas que controla o acesso ao conteúdo dos cursos baseado no papel (role) do usuário.

## Regras por Papel de Usuário

### 👨‍💼 Administrador (Admin)
- **Assinatura Necessária:** ❌ NÃO
- **Acesso ao Conteúdo:** ✅ TOTAL
- **Justificativa:** Admins precisam visualizar e aprovar cursos antes de publicá-los

**Permissões:**
- Visualizar todos os cursos (publicados e pendentes)
- Acessar conteúdo completo de todas as aulas
- Aprovar/rejeitar cursos
- Gerenciar instrutores e estudantes
- Gerenciar assinaturas de estudantes

### 👨‍🏫 Instrutor (Instructor)
- **Assinatura Necessária:** ❌ NÃO
- **Acesso ao Conteúdo:** ✅ TOTAL (seus cursos)
- **Justificativa:** Instrutores precisam criar, editar e visualizar seus próprios cursos

**Permissões:**
- Criar e gerenciar seus próprios cursos
- Adicionar módulos e aulas
- Visualizar conteúdo de suas aulas
- Gerenciar avaliações
- Visualizar progresso dos estudantes

### 👨‍🎓 Estudante (Student)
- **Assinatura Necessária:** ✅ SIM
- **Acesso ao Conteúdo:** ⚠️ CONDICIONAL
- **Justificativa:** Estudantes pagam pela assinatura para acessar o conteúdo educacional

**Permissões (com assinatura ativa):**
- Visualizar cursos publicados
- Acessar conteúdo das aulas
- Marcar aulas como concluídas
- Fazer avaliações
- Obter certificados

**Restrições (sem assinatura ativa):**
- ❌ Não pode acessar conteúdo das aulas
- ❌ Não pode marcar progresso
- ❌ Não pode fazer avaliações
- ✅ Pode visualizar lista de cursos (catálogo)

## Implementação Técnica

### Middleware de Verificação

**Arquivo:** `src/shared/middleware/subscription.middleware.ts`

```typescript
// Admins e instrutores fazem bypass da verificação
if (req.user.role === 'admin' || req.user.role === 'instructor') {
  next();
  return;
}

// Estudantes precisam de assinatura ativa
if (req.user.role === 'student') {
  // Verifica subscription_status e subscription_expires_at
  // na tabela students
}
```

### Rotas Protegidas

O middleware `requireActiveSubscription` é aplicado nas seguintes rotas:

1. **Conteúdo de Aulas**
   - `GET /api/lessons/:id/content`
   - Retorna o conteúdo completo da aula

2. **Progresso do Estudante**
   - `POST /api/courses/:courseId/progress`
   - Marca aula como concluída

3. **Avaliações**
   - `POST /api/assessments/:id/submit`
   - Submete respostas de avaliação

4. **Certificados**
   - `GET /api/certificates/:id`
   - Gera certificado de conclusão

## Estrutura de Dados

### Tabela: students

```sql
subscription_status VARCHAR(20) DEFAULT 'inactive'
  -- Valores: 'active', 'inactive', 'suspended', 'cancelled'
  
subscription_expires_at TIMESTAMP
  -- Data de expiração da assinatura
```

### Tabela: subscriptions

```sql
student_id UUID REFERENCES students(id)
plan_id UUID REFERENCES plans(id)
status VARCHAR(20) -- 'active', 'suspended', 'cancelled', 'pending'
current_period_start TIMESTAMP
current_period_end TIMESTAMP
```

## Fluxo de Verificação

```
1. Requisição chega ao endpoint protegido
   ↓
2. Middleware authenticate verifica JWT
   ↓
3. Middleware requireActiveSubscription verifica papel
   ↓
4a. Se admin/instructor → PERMITE acesso
   ↓
4b. Se student → Verifica assinatura
   ↓
5. Consulta tabela students
   ↓
6. Verifica subscription_status = 'active'
   ↓
7. Verifica subscription_expires_at > NOW()
   ↓
8a. Se válida → PERMITE acesso
8b. Se inválida → BLOQUEIA (403 Forbidden)
```

## Testes

### Testar Acesso de Admin (sem assinatura)
```bash
node test-admin-lesson-access.js
```

**Resultado Esperado:** ✅ Admin acessa aula sem assinatura

### Testar Acesso de Estudante (com assinatura)
```bash
node debug-lesson-click.js
```

**Resultado Esperado:** ✅ Estudante com assinatura ativa acessa aula

### Testar Acesso de Estudante (sem assinatura)
```bash
# Remover assinatura do estudante no banco
# Executar debug-lesson-click.js
```

**Resultado Esperado:** ❌ Erro 403 - Subscription Required

## Gerenciamento de Assinaturas

### Criar Assinatura para Estudante

```bash
node create-subscription-simple.js
```

Este script:
1. Busca o estudante no banco
2. Cria/atualiza assinatura na tabela subscriptions
3. Atualiza campos na tabela students
4. Define validade de 1 ano

### Verificar Status de Assinatura

```sql
SELECT 
  u.name,
  u.email,
  s.subscription_status,
  s.subscription_expires_at
FROM users u
JOIN students s ON u.id = s.id
WHERE u.email = 'student@example.com';
```

## Mensagens de Erro

### Assinatura Inativa
```json
{
  "error": {
    "code": "SUBSCRIPTION_REQUIRED",
    "message": "An active subscription is required to access this content",
    "details": {
      "currentStatus": "inactive"
    }
  }
}
```

### Assinatura Expirada
```json
{
  "error": {
    "code": "SUBSCRIPTION_EXPIRED",
    "message": "Your subscription has expired. Please renew to continue accessing content",
    "details": {
      "expiredAt": "2024-11-22T00:00:00.000Z"
    }
  }
}
```

## Considerações de Segurança

1. **Verificação em Cada Requisição**
   - Não confia em cache do cliente
   - Sempre verifica no servidor

2. **Bypass Apenas para Roles Específicas**
   - Admin e Instructor são hardcoded
   - Não há configuração que permita bypass para outros roles

3. **Logs de Acesso**
   - Tentativas de acesso sem assinatura são logadas
   - Útil para auditoria e detecção de fraudes

4. **Expiração Automática**
   - Job cron verifica assinaturas expiradas
   - Atualiza status automaticamente

## Próximos Passos

1. ✅ Sistema implementado e funcionando
2. 🔄 Implementar página de gerenciamento de assinaturas no frontend
3. 🔄 Adicionar notificações de expiração (7 dias antes)
4. 🔄 Implementar renovação automática via gateway de pagamento
5. 🔄 Adicionar métricas de conversão de assinaturas

## Referências

- Middleware: `src/shared/middleware/subscription.middleware.ts`
- Migração: `scripts/migrations/009_create_subscriptions_table.sql`
- Documentação: `CORRECAO_ERRO_CLICAR_AULA.md`
- Testes: `test-admin-lesson-access.js`, `debug-lesson-click.js`
