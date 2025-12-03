# Debug: Renovação de Assinatura - "Nenhum plano disponível"

## Problema Reportado
A página de renovação de assinatura (`/subscription/renew`) está mostrando "Nenhum plano disponível" mesmo com planos ativos no banco de dados.

## Investigação Realizada

### 1. Verificação do Banco de Dados ✅
```bash
node check-plans.js
```
**Resultado**: 6 planos ativos encontrados no banco de dados
- Todos com `is_active = true`
- Preço: BRL 49.90/monthly

### 2. Teste da API Backend ✅
```bash
node test-plans-api.js
```
**Resultado**: API funcionando corretamente
- Endpoint `/api/subscriptions/plans` retorna 6 planos
- Autenticação funcionando
- Resposta HTTP 200

### 3. Configuração do Frontend ✅
- Arquivo `frontend/src/services/api.ts` configurado corretamente
- BaseURL: `http://localhost:3000/api`
- Interceptor de autenticação funcionando

### 4. Código da Página de Renovação ✅
- Arquivo `frontend/src/pages/SubscriptionRenewPage.tsx`
- Requisição usando `api.get('/subscriptions/plans')`
- Tratamento de erros implementado

## Possíveis Causas

### Causa 1: Usuário não autenticado no frontend
Se o usuário não estiver logado ou o token estiver inválido, a requisição falhará com erro 401.

**Solução**: Fazer login novamente no frontend

### Causa 2: CORS bloqueando a requisição
O navegador pode estar bloqueando a requisição por política de CORS.

**Verificação**: Abrir console do navegador (F12) e verificar erros de CORS

### Causa 3: Erro silencioso na requisição
A requisição pode estar falhando mas o erro não está sendo exibido corretamente.

**Solução**: Logs adicionados para debug

## Logs Adicionados

Adicionei logs de debug no arquivo `SubscriptionRenewPage.tsx`:
```typescript
console.log('🔍 Buscando planos...')
console.log('✅ Planos recebidos:', response.data)
console.error('❌ Erro ao buscar planos:', err)
```

## Como Testar

### Teste 1: Página HTML de Teste
1. Abrir `test-frontend-plans.html` no navegador
2. Clicar em "Fazer Login como Estudante Vencido"
3. Clicar em "Buscar Planos Disponíveis"
4. Verificar se os planos aparecem

### Teste 2: Frontend React
1. Fazer login no frontend com `expired@example.com` / `Expired123!`
2. Navegar para `/subscription/renew`
3. Abrir console do navegador (F12)
4. Verificar os logs:
   - `🔍 Buscando planos...`
   - `✅ Planos recebidos:` (se sucesso)
   - `❌ Erro ao buscar planos:` (se erro)

### Teste 3: Verificar Token
No console do navegador:
```javascript
console.log('Token:', localStorage.getItem('accessToken'))
```

Se não houver token, fazer login novamente.

## Próximos Passos

1. **Verificar autenticação**: Confirmar que o usuário está logado
2. **Verificar console**: Olhar os logs no console do navegador
3. **Verificar network**: Aba Network do DevTools para ver a requisição HTTP
4. **Testar com outro usuário**: Tentar com `student@example.com` / `Student123!`

## Arquivos Criados para Debug

- `check-plans.js` - Verifica planos no banco de dados
- `test-plans-api.js` - Testa API do backend
- `test-frontend-plans.html` - Página HTML para teste manual
- `DEBUG_RENOVACAO_ASSINATURA.md` - Este documento

## Status Atual

- ✅ Backend funcionando
- ✅ Banco de dados com planos ativos
- ✅ API retornando planos corretamente
- ⏳ Frontend precisa de teste com usuário autenticado

## Solução Esperada

Após fazer login corretamente no frontend, a página de renovação deve:
1. Buscar os planos via API
2. Exibir os 6 planos disponíveis
3. Permitir clicar em "Renovar com este Plano"
4. Redirecionar para o checkout do Stripe

