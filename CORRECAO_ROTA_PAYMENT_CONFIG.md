# Correção - Rota de Configuração de Pagamento

## Problema Identificado

❌ **Erro:** Ao acessar a página de checkout, a rota `/api/payments/config` retornava 404

**Causa:** Conflito na montagem das rotas. A rota estava sendo montada duas vezes:
- No `server.ts`: `app.use('/api/payments/config', paymentConfigRoutes)`
- No arquivo de rotas: `router.get('/config', ...)`
- **Resultado**: Rota final ficava `/api/payments/config/config` ❌

## Solução Implementada

✅ **Correção:** Alterada a rota interna de `/config` para `/`

**Arquivo:** `src/modules/subscriptions/routes/payment-config.routes.ts`

```typescript
// ANTES (errado)
router.get(
  '/config',  // ❌ Duplicava o /config
  cacheMiddleware(300),
  (req, res) => paymentConfigController.getConfig(req, res)
);

// DEPOIS (correto)
router.get(
  '/',  // ✅ Rota raiz, pois já está montada em /api/payments/config
  cacheMiddleware(300),
  (req, res) => paymentConfigController.getConfig(req, res)
);
```

## Como Funciona Agora

1. **Montagem no server.ts**: `/api/payments/config`
2. **Rota interna**: `/`
3. **Rota final**: `/api/payments/config` ✅

## Teste da Correção

```bash
# Testar a rota
curl http://localhost:3000/api/payments/config

# Resultado esperado:
{
  "data": {
    "maxInstallments": 12,
    "pixDiscountPercent": 5,
    "installmentsWithoutInterest": 3,
    "pixExpirationMinutes": 30
  }
}
```

## Impacto

Esta rota é essencial para o checkout funcionar, pois fornece:
- Número máximo de parcelas
- Percentual de desconto PIX
- Parcelas sem juros
- Tempo de expiração do PIX

Sem essa rota, a página de checkout não consegue carregar as configurações de pagamento.

## Status

✅ **Corrigido:** Rota agora responde corretamente em `/api/payments/config`
✅ **Testado:** Backend reiniciado e funcionando
✅ **Checkout:** Deve carregar normalmente agora

## Próximos Passos

1. Recarregue a página de checkout no navegador
2. Verifique se a configuração de pagamento carrega
3. Teste o fluxo completo de renovação
