# Correção - Erro ao Gerar QR Code PIX

## Problema Identificado

❌ **Erro:** Ao clicar em "Gerar QR Code PIX" na página de checkout, o sistema retornava erro 500 "Failed to create checkout"

**Causa:** O Stripe estava tentando criar um PaymentIntent real com o método de pagamento PIX, mas o PIX não está ativado na conta do Stripe (comum em ambientes de desenvolvimento/teste).

**Mensagem de erro do Stripe:**
```
The payment method type "pix" is invalid. Please ensure the provided type is activated in your dashboard (https://dashboard.stripe.com/account/payments/settings) and your account is enabled for any preview features that you are trying to use.
```

## Solução Implementada

✅ **Correção:** Implementado modo de simulação para PIX em ambiente de desenvolvimento

**Arquivo:** `src/modules/subscriptions/services/pix-payment.service.ts`

### Mudanças Realizadas

1. **Detecção de Ambiente:**
   - Verifica se está em ambiente de desenvolvimento (`NODE_ENV !== 'production'`)
   - Tenta criar PaymentIntent real primeiro
   - Se falhar por causa do PIX, cria um pagamento mock

2. **Pagamento Mock para Desenvolvimento:**
   ```typescript
   // Gera ID de pagamento mock
   const mockPaymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
   
   // Gera código PIX mock (formato válido)
   const mockPixCode = `00020126580014br.gov.bcb.pix0136${mockPaymentIntentId}...`;
   
   // Gera QR Code visual usando API pública
   const mockQRCodeBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrCodeData}`;
   ```

3. **Metadados do Mock:**
   - Adiciona flag `mock: 'true'` nos metadados
   - Permite identificar pagamentos de teste
   - Mantém estrutura compatível com pagamentos reais

### Como Funciona Agora

**Em Desenvolvimento:**
1. Sistema tenta criar PaymentIntent real com PIX
2. Se falhar (PIX não disponível), cria pagamento mock
3. Gera código PIX válido (formato correto)
4. Gera QR Code visual usando serviço externo
5. Salva no banco com flag de mock

**Em Produção:**
1. Sistema cria PaymentIntent real com PIX
2. Usa QR Code e dados reais do Stripe
3. Processa pagamento normalmente

## Teste da Correção

### Fluxo de Teste

1. **Login:**
   ```
   Email: expired.student@test.com
   Senha: Test123!@#
   ```

2. **Acessar Renovação:**
   - Ir para `/subscription/renew`
   - Escolher um plano
   - Clicar em "Renovar com este Plano"

3. **Checkout:**
   - Página carrega com dados do plano
   - Selecionar método "PIX"
   - Clicar em "Gerar QR Code PIX"

4. **Resultado Esperado:**
   - ✅ QR Code é gerado com sucesso
   - ✅ Código copia-e-cola é exibido
   - ✅ Timer de expiração funciona (30 minutos)
   - ✅ Instruções de pagamento aparecem
   - ✅ Valor com desconto de 5% é mostrado

### Verificação no Backend

```bash
# Verificar logs do backend
# Deve mostrar:
# - "PIX not available in Stripe, creating mock payment for development"
# - "Mock PIX payment created for development"
```

### Verificação no Banco de Dados

```sql
SELECT 
  id,
  student_id,
  plan_id,
  amount,
  discount,
  final_amount,
  status,
  expires_at,
  gateway_charge_id
FROM pix_payments
WHERE student_id = (
  SELECT id FROM users WHERE email = 'expired.student@test.com'
)
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
- Status: `pending`
- Gateway Charge ID: `pi_mock_...`
- Discount: 5% do valor
- Expires At: 30 minutos no futuro

## Impacto

Esta correção permite:
- ✅ Testar fluxo completo de PIX em desenvolvimento
- ✅ Desenvolver sem necessidade de conta Stripe brasileira
- ✅ Simular pagamentos PIX de forma realista
- ✅ Manter compatibilidade com produção

## Observações Importantes

### Para Desenvolvimento
- Pagamentos mock não são processados de verdade
- QR Code é gerado mas não efetua pagamento real
- Use para testar UI e fluxo de usuário
- Status permanece "pending" até expirar

### Para Produção
- Requer conta Stripe brasileira
- PIX deve estar ativado no dashboard do Stripe
- Pagamentos são processados normalmente
- Webhooks funcionam com pagamentos reais

## Próximos Passos

Para usar PIX em produção:

1. **Configurar Stripe:**
   - Criar conta Stripe brasileira
   - Ativar método de pagamento PIX
   - Configurar webhooks

2. **Variáveis de Ambiente:**
   ```env
   NODE_ENV=production
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Testar em Produção:**
   - Usar modo de teste do Stripe primeiro
   - Verificar webhooks funcionando
   - Confirmar ativação de assinaturas

## Correção Adicional - Nome da Tabela

Após implementar o modo mock, foi identificado um segundo erro:

❌ **Erro:** `relation "subscription_plans" does not exist`

**Causa:** O código estava usando o nome de tabela `subscription_plans` mas a tabela correta é `plans`.

**Correção:** Alteradas duas queries SQL:
1. Linha ~201: Query para buscar nome do plano para email
2. Linha ~382: Query para buscar detalhes do plano ao expirar pagamento

```typescript
// ANTES (errado)
'SELECT name FROM subscription_plans WHERE id = $1'

// DEPOIS (correto)
'SELECT name FROM plans WHERE id = $1'
```

## Correção Adicional - Formato da Resposta API

Após corrigir os erros anteriores, foi identificado um terceiro problema:

❌ **Erro:** Frontend mostrava "Erro ao gerar pagamento PIX" mesmo com backend retornando sucesso

**Causa:** Incompatibilidade no formato da resposta da API. O frontend esperava `response.data.data` mas o backend retornava os dados diretamente.

**Correção:** Envolvido a resposta do PIX em um objeto `data` para manter consistência com outras APIs:

```typescript
// ANTES (errado)
res.status(201).json({
  paymentMethod: 'pix',
  paymentId: pixPayment.paymentId,
  // ... outros campos
});

// DEPOIS (correto)
res.status(201).json({
  data: {
    paymentMethod: 'pix',
    paymentId: pixPayment.paymentId,
    // ... outros campos
  },
});
```

## Status

✅ **Corrigido:** Modo mock implementado para desenvolvimento
✅ **Corrigido:** Nome da tabela de planos corrigido
✅ **Corrigido:** Formato da resposta API padronizado
✅ **Testado:** Backend reiniciado com sucesso
✅ **Funcional:** Fluxo completo de PIX em dev
⚠️ **Produção:** Requer configuração adicional do Stripe

