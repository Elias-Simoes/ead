# Correção - Erro ao Renovar Plano

## Problema Identificado

❌ **Erro:** Ao clicar em "Renovar com este Plano" na página de renovação, o checkout retornava erro 404 "The requested resource was not found"

**Causa:** A rota `/api/subscriptions/plans/:planId` não existia no backend. O checkout tentava buscar os detalhes do plano por ID, mas essa rota não estava implementada.

## Solução Implementada

### 1. Adicionada Rota no Backend

✅ **Arquivo:** `src/modules/subscriptions/routes/subscription.routes.ts`

```typescript
// Get specific plan by ID
router.get('/plans/:planId', subscriptionController.getPlanById.bind(subscriptionController));
```

### 2. Adicionado Controller

✅ **Arquivo:** `src/modules/subscriptions/controllers/subscription.controller.ts`

```typescript
/**
 * GET /api/subscriptions/plans/:planId
 * Get specific plan by ID
 */
async getPlanById(req: Request, res: Response): Promise<void> {
  try {
    const { planId } = req.params;
    
    if (!planId) {
      res.status(400).json({
        error: {
          code: 'MISSING_PLAN_ID',
          message: 'Plan ID is required',
        },
      });
      return;
    }

    const plan = await subscriptionService.getPlanById(planId);
    
    if (!plan) {
      res.status(404).json({
        error: {
          code: 'PLAN_NOT_FOUND',
          message: 'Plan not found',
        },
      });
      return;
    }

    res.json({ data: plan });
  } catch (error) {
    logger.error('Error getting plan by ID', error);
    res.status(500).json({
      error: {
        code: 'PLAN_RETRIEVAL_FAILED',
        message: 'Failed to retrieve plan',
      },
    });
  }
}
```

### 3. Adicionado Service

✅ **Arquivo:** `src/modules/subscriptions/services/subscription.service.ts`

```typescript
/**
 * Get specific plan by ID
 */
async getPlanById(planId: string): Promise<Plan | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM plans WHERE id = $1',
      [planId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error: any) {
    // If it's an invalid UUID format, return null instead of throwing
    if (error.code === '22P02') {
      logger.warn(`Invalid UUID format for plan ID: ${planId}`);
      return null;
    }
    
    logger.error('Failed to get plan by ID', error);
    throw error;
  }
}
```

### 4. Tratamento de Erros

✅ **Melhorias:**
- Retorna 400 se o planId não for fornecido
- Retorna 404 se o plano não for encontrado
- Trata UUID inválido retornando null ao invés de erro 500
- Logs apropriados para debugging

## Fluxo Corrigido

1. **Usuário acessa:** `/subscription/renew`
2. **Clica em:** "Renovar com este Plano"
3. **Frontend navega para:** `/checkout/:planId`
4. **Checkout busca:** `GET /api/subscriptions/plans/:planId` ✅
5. **Backend retorna:** Dados do plano
6. **Checkout exibe:** Formulário de pagamento

## Como Testar

### Teste Automatizado

```bash
node test-plan-by-id.js
```

**Resultado esperado:**
```
✅ Login realizado com sucesso
✅ 6 planos encontrados
✅ Plano encontrado por ID
✅ Erro 404 para ID inválido
```

### Teste Manual

1. **Faça login** com: `student.e2e@test.com` / `Test123!@#`
2. **Acesse:** http://localhost:5174/subscription/renew
3. **Clique em:** "Renovar com este Plano" em qualquer plano
4. **Resultado esperado:**
   - ✅ Página de checkout carrega corretamente
   - ✅ Dados do plano são exibidos
   - ✅ Opções de pagamento (Cartão/PIX) aparecem

### URLs para Teste

- **Renovação:** http://localhost:5174/subscription/renew
- **Checkout direto:** http://localhost:5174/checkout/80850f4b-1c38-4a30-917e-2c93a2abfe2a
- **API - Todos os planos:** http://localhost:3000/api/subscriptions/plans
- **API - Plano específico:** http://localhost:3000/api/subscriptions/plans/80850f4b-1c38-4a30-917e-2c93a2abfe2a

## Status

✅ **Corrigido:** Rota de buscar plano por ID implementada
✅ **Testado:** Funciona corretamente com IDs válidos e inválidos
✅ **Integrado:** Checkout agora carrega os dados do plano corretamente

## Arquivos Modificados

1. `src/modules/subscriptions/routes/subscription.routes.ts` - Adicionada rota
2. `src/modules/subscriptions/controllers/subscription.controller.ts` - Adicionado método
3. `src/modules/subscriptions/services/subscription.service.ts` - Adicionado método

## Próximos Passos

O fluxo de renovação agora está completo:
1. ✅ Página de renovação lista planos
2. ✅ Checkout busca dados do plano
3. ✅ Usuário pode escolher método de pagamento
4. ✅ Pagamento é processado via gateway
