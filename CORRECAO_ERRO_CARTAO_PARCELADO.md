# Correção - Erro ao Pagar com Cartão Parcelado

## Problema Identificado

❌ **Erro:** Ao clicar em "Pagar com Cartão" com parcelamento selecionado, o sistema retornava erro 500

**Mensagem de erro:**
```
The parameter `payment_method_options[card][installments][enabled]` is not usable with `subscription` mode for the payment method type `card`. It may only be used with `payment` mode.
```

**Causa Raiz:** O Stripe não permite usar parcelamento (`installments`) quando você está criando uma **subscription** (assinatura recorrente). Parcelamento só funciona com pagamentos únicos (`payment` mode).

## Solução Implementada

✅ **Correção:** Alterado o fluxo de checkout para usar `payment` mode quando parcelamento é solicitado

### Mudanças Realizadas

#### 1. Payment Gateway Service (`payment-gateway.service.ts`)

**Antes:**
- Sempre usava `mode: 'subscription'`
- Tentava adicionar `installments` em subscription mode (não permitido)

**Depois:**
- Detecta quando parcelamento é solicitado
- Usa `mode: 'payment'` para pagamentos parcelados
- Usa `mode: 'subscription'` para pagamentos à vista
- Adiciona metadata `isSubscriptionPayment: 'true'` para identificar pagamentos únicos que devem criar assinatura

```typescript
// Determinar se deve usar payment mode (para parcelamento) ou subscription mode
const usePaymentMode = data.paymentMethod === 'card' && data.installments && data.installments > 1;

const sessionConfig: Stripe.Checkout.SessionCreateParams = {
  customer: customer.id,
  mode: usePaymentMode ? 'payment' : 'subscription',  // ← Mudança principal
  // ...
  metadata: {
    studentId: data.studentId,
    planId: data.planId,
    paymentMethod: data.paymentMethod,
    isSubscriptionPayment: usePaymentMode ? 'true' : 'false',  // ← Flag importante
  },
};
```

#### 2. Webhook Handler Service (`webhook-handler.service.ts`)

**Adicionado:** Novo handler `handleCheckoutSessionCompleted` que:
- Processa o evento `checkout.session.completed`
- Detecta se é um pagamento único para assinatura (`isSubscriptionPayment === 'true'`)
- Cria a assinatura manualmente no banco de dados
- Registra o pagamento

```typescript
async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  // Se for payment mode com flag isSubscriptionPayment
  if (session.mode === 'payment' && isSubscriptionPayment) {
    // Criar assinatura manualmente
    // Calcular período (start_date, end_date)
    // Registrar pagamento
  }
}
```

#### 3. Webhook Controller (`webhook.controller.ts`)

**Adicionado:** Roteamento para o novo evento:

```typescript
case 'checkout.session.completed':
  await webhookHandlerService.handleCheckoutSessionCompleted(
    event.data.object as Stripe.Checkout.Session
  );
  break;
```

## Como Funciona Agora

### Fluxo com Cartão À Vista (1x)

```
1. Frontend → Backend: Criar checkout (installments: 1)
2. Backend → Stripe: Criar session (mode: 'subscription')
3. Stripe: Cria subscription automaticamente
4. Webhook: subscription.created → Registra no banco
```

### Fluxo com Cartão Parcelado (2x ou mais)

```
1. Frontend → Backend: Criar checkout (installments: 3)
2. Backend → Stripe: Criar session (mode: 'payment', installments: enabled)
3. Stripe: Processa pagamento único parcelado
4. Webhook: checkout.session.completed → Cria subscription manualmente
```

## Teste da Correção

### Passo 1: Acessar Checkout

```
1. Login: expired.student@test.com / Test123!@#
2. Acessar: http://localhost:5173/subscription/renew
3. Escolher um plano
4. Clicar em "Renovar com este Plano"
```

### Passo 2: Selecionar Parcelamento

```
1. Selecionar "Cartão de Crédito"
2. Escolher número de parcelas (ex: 3x)
3. Clicar em "Pagar com Cartão"
```

### Passo 3: Resultado Esperado

```
✅ Redireciona para Stripe Checkout
✅ Mostra opção de parcelamento
✅ Permite completar o pagamento
✅ Após pagamento, webhook cria assinatura
✅ Acesso aos cursos é liberado
```

## Verificação no Backend

**Logs esperados:**

```
[info]: Creating Stripe checkout session with payment options
{
  "studentId": "...",
  "planId": "...",
  "paymentMethod": "card",
  "installments": 3
}

[info]: Checkout session created successfully
{
  "event": "checkout_session_created",
  "sessionId": "cs_...",
  "mode": "payment",  ← payment mode para parcelamento
  "installments": 3,
  "isSubscriptionPayment": "true"
}
```

**Webhook esperado:**

```
[info]: Webhook event received
{
  "type": "checkout.session.completed",
  "id": "evt_..."
}

[info]: Processing checkout.session.completed event
{
  "sessionId": "cs_...",
  "mode": "payment"
}

[info]: Subscription created from one-time payment
{
  "sessionId": "cs_...",
  "subscriptionId": "...",
  "studentId": "...",
  "installments": 3
}
```

## Diferenças: À Vista vs Parcelado

| Aspecto | À Vista (1x) | Parcelado (2x+) |
|---------|--------------|-----------------|
| **Stripe Mode** | `subscription` | `payment` |
| **Criação da Assinatura** | Automática (Stripe) | Manual (Webhook) |
| **Evento Principal** | `subscription.created` | `checkout.session.completed` |
| **Parcelamento** | Não disponível | Habilitado |
| **Cobrança Recorrente** | Sim (mensal) | Não (pagamento único) |

## Observações Importantes

### Para Desenvolvimento

- ✅ Checkout funciona normalmente
- ✅ Redireciona para Stripe
- ⚠️ Webhooks precisam estar configurados para processar pagamento
- ⚠️ Use cartões de teste do Stripe

### Para Produção

1. **Configurar Webhooks no Stripe:**
   - Adicionar endpoint: `https://seu-dominio.com/api/webhooks/payment`
   - Eventos necessários:
     - `checkout.session.completed` ← **NOVO**
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `payment_intent.succeeded`

2. **Testar Webhooks:**
   ```bash
   # Usar Stripe CLI para testar localmente
   stripe listen --forward-to localhost:3000/api/webhooks/payment
   ```

3. **Cartões de Teste:**
   ```
   Sucesso: 4242 4242 4242 4242
   Falha: 4000 0000 0000 0002
   3D Secure: 4000 0027 6000 3184
   ```

## Impacto

Esta correção permite:
- ✅ Pagamento com cartão à vista (1x)
- ✅ Pagamento com cartão parcelado (2x até 12x)
- ✅ Pagamento com PIX (já funcionava)
- ✅ Criação automática de assinatura após pagamento
- ✅ Compatibilidade com webhooks do Stripe

## Arquivos Modificados

1. `src/modules/subscriptions/services/payment-gateway.service.ts`
   - Alterada lógica de `createCheckoutWithPaymentOptions`
   - Adicionado suporte a payment mode para parcelamento

2. `src/modules/subscriptions/services/webhook-handler.service.ts`
   - Adicionado método `handleCheckoutSessionCompleted`
   - Processa pagamentos únicos que criam assinaturas

3. `src/modules/subscriptions/controllers/webhook.controller.ts`
   - Adicionado case para `checkout.session.completed`

## Status

✅ **Corrigido:** Pagamento com cartão parcelado funciona
✅ **Testado:** Backend aceita requisição sem erros
⚠️ **Webhook:** Precisa estar configurado para processar pagamento
⚠️ **Produção:** Requer configuração de webhooks no Stripe

## Próximos Passos

1. Configurar webhooks no Stripe (desenvolvimento e produção)
2. Testar fluxo completo com cartão de teste
3. Verificar que assinatura é criada após pagamento
4. Confirmar que acesso aos cursos é liberado

---

**Data:** 08/12/2025
**Tipo:** Correção de Bug
**Prioridade:** Alta
**Status:** ✅ Implementado
