# 🧪 Teste Automatizado Completo - Módulo de Assinaturas

## 📋 Visão Geral

Este teste automatizado valida todo o fluxo do módulo de assinaturas, desde a criação de usuários até o processamento de webhooks do Stripe.

## ✅ O Que Este Teste Cobre

### 1. **Criação de Usuários** 
- Cria um estudante de teste
- Cria um admin de teste
- Valida o registro bem-sucedido

### 2. **Autenticação**
- Login do estudante
- Login do admin
- Validação de tokens JWT

### 3. **Planos de Assinatura**
- Lista planos disponíveis
- Valida estrutura dos dados

### 4. **Criação de Assinatura**
- Cria sessão de checkout no Stripe
- Valida URL de checkout
- Valida session ID

### 5. **Webhooks do Stripe**
- Simula webhook `customer.subscription.created`
- Simula webhook `invoice.payment_succeeded`
- Valida assinatura de segurança dos webhooks
- Verifica processamento correto

### 6. **Status da Assinatura**
- Consulta assinatura atual do usuário
- Valida dados retornados
- Verifica período de validade

### 7. **Endpoints Administrativos**
- Lista todas as assinaturas
- Obtém estatísticas (MRR, churn rate, etc.)
- Valida permissões de admin

### 8. **Gerenciamento de Assinatura**
- Testa cancelamento de assinatura
- Testa reativação de assinatura
- Valida fluxos de mudança de status

### 9. **Tratamento de Erros**
- Valida erros de validação (dados faltando)
- Valida controle de acesso (403 Forbidden)
- Verifica mensagens de erro apropriadas

## 🚀 Como Executar

### Pré-requisitos

1. **Servidor rodando:**
```bash
npm run dev
```

2. **Banco de dados configurado:**
```bash
npm run migrate
```

3. **Variáveis de ambiente configuradas** (`.env`):
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

### Executar o Teste

```bash
node test-subscriptions-complete.js
```

## 📊 Interpretando os Resultados

### Saída de Sucesso

```
╔══════════════════════════════════════════════════════════════╗
║                TESTE COMPLETO DE ASSINATURAS                 ║
╚══════════════════════════════════════════════════════════════╝

=== TESTE 1 ===
Criando usuários de teste
✅ Estudante criado: test-1234567890@example.com
✅ Admin criado: admin-1234567890@example.com

=== TESTE 2 ===
Fazendo login dos usuários
✅ Login do estudante realizado
✅ Login do admin realizado

...

╔══════════════════════════════════════════════════════════════╗
║                    RESUMO DOS TESTES                         ║
╚══════════════════════════════════════════════════════════════╝

📊 Estatísticas:
   Total de testes: 9
   ✅ Passou: 9
   ❌ Falhou: 0
   ⏱️  Duração: 5.23s

🎉 TODOS OS TESTES PASSARAM! 🎉
O módulo de assinaturas está funcionando perfeitamente!
```

### Saída de Falha

Se algum teste falhar, você verá:

```
❌ Falha ao criar estudante: {"error": "Email já existe"}
```

O teste para imediatamente e mostra qual teste falhou e por quê.

## 🔍 Detalhes Técnicos

### Simulação de Webhooks

O teste simula webhooks do Stripe criando:

1. **Payload autêntico** com estrutura idêntica ao Stripe
2. **Assinatura HMAC** usando o webhook secret
3. **Headers corretos** incluindo `Stripe-Signature`

```javascript
// Exemplo de webhook simulado
{
  id: "evt_test_abc123",
  type: "customer.subscription.created",
  data: {
    object: {
      id: "sub_test_xyz789",
      status: "active",
      metadata: {
        studentId: "123",
        planId: "456"
      }
    }
  }
}
```

### Estado do Teste

O teste mantém estado entre as etapas:

```javascript
testState = {
  studentToken: 'eyJhbGc...',
  adminToken: 'eyJhbGc...',
  planId: 'plan_123',
  subscriptionId: 'sub_xyz',
  studentId: '1',
  adminId: '2',
  testEmail: 'test-1234@example.com',
  adminEmail: 'admin-1234@example.com'
}
```

## 🐛 Troubleshooting

### Erro: "Este teste requer Node.js 18+"

**Solução:** Atualize o Node.js ou instale node-fetch:
```bash
npm install node-fetch
```

### Erro: "Connection refused"

**Solução:** Certifique-se de que o servidor está rodando:
```bash
npm run dev
```

### Erro: "Webhook signature verification failed"

**Solução:** Verifique se `STRIPE_WEBHOOK_SECRET` está correto no `.env`

### Erro: "Database connection failed"

**Solução:** Verifique se o PostgreSQL está rodando e as migrations foram executadas:
```bash
docker-compose up -d
npm run migrate
```

### Erro: "Plan not found"

**Solução:** Certifique-se de que existem planos cadastrados no banco:
```sql
SELECT * FROM subscription_plans;
```

Se não houver planos, execute a migration que cria os planos padrão.

## 🔄 Limpeza de Dados de Teste

Os usuários de teste são criados com emails únicos baseados em timestamp, então não há conflito entre execuções.

Para limpar dados de teste antigos:

```sql
-- Deletar usuários de teste
DELETE FROM users WHERE email LIKE 'test-%@example.com';
DELETE FROM users WHERE email LIKE 'admin-%@example.com';

-- Deletar assinaturas de teste
DELETE FROM subscriptions WHERE stripe_subscription_id LIKE 'sub_test_%';

-- Deletar pagamentos de teste
DELETE FROM payments WHERE stripe_payment_intent_id LIKE 'pi_test_%';
```

## 📝 Personalizando o Teste

### Adicionar Novos Testes

```javascript
async function test10_MyNewTest() {
  logStep('TESTE 10', 'Descrição do meu teste');

  const result = await apiRequest('/my-endpoint', {
    headers: {
      Authorization: `Bearer ${testState.studentToken}`
    }
  });

  if (result.success) {
    logSuccess('Teste passou!');
    return true;
  } else {
    logError('Teste falhou!');
    return false;
  }
}

// Adicionar ao array de testes
const tests = [
  // ... testes existentes
  { name: 'Meu novo teste', fn: test10_MyNewTest }
];
```

### Modificar Dados de Teste

```javascript
// Alterar dados do estudante
const studentData = {
  name: 'Meu Nome',
  email: `custom-${Date.now()}@example.com`,
  password: 'mypassword',
  role: 'student'
};
```

## 🎯 Próximos Passos

Após executar este teste com sucesso:

1. ✅ Módulo de assinaturas está funcionando
2. ✅ Webhooks estão sendo processados corretamente
3. ✅ Autenticação e autorização funcionando
4. ✅ Endpoints administrativos operacionais

Você pode:
- Testar manualmente no Postman/Insomnia
- Integrar com frontend
- Configurar Stripe CLI para webhooks reais
- Deploy em ambiente de staging

## 📚 Recursos Adicionais

- [Documentação do Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks Locally](https://stripe.com/docs/webhooks/test)
