# Guia de Teste - Módulo de Assinaturas

## Pré-requisitos

1. Servidor rodando: `npm run dev`
2. Banco de dados configurado com migrations
3. Conta Stripe em modo de teste
4. Usuário estudante e admin criados

## Configuração do Stripe

### 1. Criar conta de teste no Stripe
- Acesse: https://dashboard.stripe.com/register
- Ative o modo de teste (toggle no canto superior direito)

### 2. Obter as chaves de API
- Vá em: https://dashboard.stripe.com/test/apikeys
- Copie a "Secret key" (começa com `sk_test_`)
- Copie a "Publishable key" (começa com `pk_test_`)

### 3. Configurar webhook (opcional para testes locais)
- Instale o Stripe CLI: https://stripe.com/docs/stripe-cli
- Execute: `stripe login`
- Execute: `stripe listen --forward-to localhost:3000/api/webhooks/payment`
- Copie o webhook secret (começa com `whsec_`)

### 4. Adicionar no arquivo .env
```env
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_aqui
```

## Testes Passo a Passo

### 1. Login como Estudante

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "student@test.com",
  "password": "password123"
}
```

**Resposta esperada:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "student@test.com",
    "role": "student"
  }
}
```

Guarde o `accessToken` para usar nos próximos testes.

---

### 2. Listar Planos Disponíveis

```bash
GET http://localhost:3000/api/subscriptions/plans
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta esperada:**
```json
[
  {
    "id": "uuid",
    "name": "Plano Mensal",
    "price": 49.90,
    "currency": "BRL",
    "interval": "monthly",
    "is_active": true
  }
]
```

Guarde o `id` do plano para o próximo passo.

---

### 3. Criar Assinatura (Checkout)

```bash
POST http://localhost:3000/api/subscriptions
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "planId": "uuid-do-plano"
}
```

**Resposta esperada:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

**Ação:** Abra o `checkoutUrl` no navegador para completar o pagamento de teste.

**Cartões de teste do Stripe:**
- Sucesso: `4242 4242 4242 4242`
- Falha: `4000 0000 0000 0002`
- Data: qualquer data futura
- CVC: qualquer 3 dígitos
- CEP: qualquer

---

### 4. Ver Assinatura Atual

```bash
GET http://localhost:3000/api/subscriptions/current
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta esperada:**
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "plan_id": "uuid",
  "status": "active",
  "current_period_start": "2024-01-01T00:00:00.000Z",
  "current_period_end": "2024-02-01T00:00:00.000Z",
  "plan": {
    "name": "Plano Mensal",
    "price": 49.90,
    "currency": "BRL"
  }
}
```

---

### 5. Cancelar Assinatura

```bash
POST http://localhost:3000/api/subscriptions/cancel
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta esperada:**
```json
{
  "message": "Subscription cancelled successfully",
  "subscription": {
    "id": "uuid",
    "status": "cancelled",
    "cancelled_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 6. Reativar Assinatura

```bash
POST http://localhost:3000/api/subscriptions/reactivate
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta esperada:**
```json
{
  "message": "Subscription reactivated successfully",
  "subscription": {
    "id": "uuid",
    "status": "active",
    "cancelled_at": null
  }
}
```

---

## Testes Admin

### 1. Login como Admin

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123"
}
```

Guarde o token do admin.

---

### 2. Listar Todas as Assinaturas

```bash
GET http://localhost:3000/api/admin/subscriptions?page=1&limit=10
Authorization: Bearer TOKEN_ADMIN
```

**Parâmetros opcionais:**
- `status`: active, suspended, cancelled, pending
- `planId`: filtrar por plano específico
- `startDate`: data inicial (ISO 8601)
- `endDate`: data final (ISO 8601)
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)

**Resposta esperada:**
```json
{
  "subscriptions": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "student_name": "João Silva",
      "student_email": "student@test.com",
      "plan": {
        "name": "Plano Mensal",
        "price": 49.90
      },
      "status": "active",
      "current_period_end": "2024-02-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 3. Ver Estatísticas de Assinaturas

```bash
GET http://localhost:3000/api/admin/subscriptions/stats
Authorization: Bearer TOKEN_ADMIN
```

**Resposta esperada:**
```json
{
  "totalActive": 5,
  "totalSuspended": 2,
  "totalCancelled": 3,
  "totalPending": 1,
  "monthlyRecurringRevenue": 249.50,
  "churnRate": 15.5,
  "newSubscriptionsThisMonth": 3,
  "cancelledThisMonth": 1
}
```

---

## Teste de Webhooks (Opcional)

Se você configurou o Stripe CLI:

### 1. Iniciar o listener
```bash
stripe listen --forward-to localhost:3000/api/webhooks/payment
```

### 2. Simular eventos
```bash
# Simular pagamento bem-sucedido
stripe trigger invoice.payment_succeeded

# Simular pagamento falho
stripe trigger invoice.payment_failed

# Simular assinatura criada
stripe trigger customer.subscription.created

# Simular assinatura cancelada
stripe trigger customer.subscription.deleted
```

### 3. Verificar logs
Os eventos devem aparecer nos logs do servidor e atualizar o banco de dados.

---

## Teste do Cron Job

O job de verificação de assinaturas expiradas roda automaticamente à meia-noite. Para testar manualmente:

### 1. Criar uma assinatura expirada no banco
```sql
-- Conecte ao banco e execute:
UPDATE subscriptions 
SET current_period_end = CURRENT_TIMESTAMP - INTERVAL '1 day',
    status = 'active'
WHERE id = 'uuid-da-assinatura';
```

### 2. Aguardar o cron job ou reiniciar o servidor
O job verificará e suspenderá automaticamente.

---

## Verificação no Banco de Dados

Para verificar os dados diretamente:

```sql
-- Ver todos os planos
SELECT * FROM plans;

-- Ver todas as assinaturas
SELECT s.*, u.email, p.name as plan_name 
FROM subscriptions s
JOIN students st ON s.student_id = st.id
JOIN users u ON st.id = u.id
JOIN plans p ON s.plan_id = p.id;

-- Ver todos os pagamentos
SELECT p.*, s.student_id 
FROM payments p
JOIN subscriptions s ON p.subscription_id = s.id;

-- Ver estatísticas
SELECT 
  status,
  COUNT(*) as total
FROM subscriptions
GROUP BY status;
```

---

## Troubleshooting

### Erro: "STRIPE_SECRET_KEY is not configured"
- Verifique se o arquivo `.env` tem a chave do Stripe
- Reinicie o servidor após adicionar a chave

### Erro: "PLAN_NOT_FOUND_OR_INACTIVE"
- Execute as migrations: `npm run migrate`
- Verifique se o plano padrão foi criado na tabela `plans`

### Erro: "STUDENT_ALREADY_HAS_ACTIVE_SUBSCRIPTION"
- Cancele a assinatura existente primeiro
- Ou use outro estudante para testar

### Webhook não funciona
- Certifique-se de que o Stripe CLI está rodando
- Verifique se o webhook secret está correto no `.env`
- O endpoint de webhook precisa receber o body raw (já configurado)

### Checkout não abre
- Verifique se a URL do checkout está correta
- Use o modo de teste do Stripe
- Verifique os logs do servidor para erros

---

## Próximos Passos

Após testar o módulo de assinaturas:

1. ✅ Módulo de autenticação funcionando
2. ✅ Módulo de usuários funcionando
3. ✅ Módulo de cursos funcionando
4. ✅ Módulo de assinaturas funcionando
5. ⏭️ Próximo: Módulo de progresso e acesso a cursos (Task 6)

---

## Recursos Úteis

- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Cartões de Teste](https://stripe.com/docs/testing#cards)
