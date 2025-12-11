# Guia de Teste - Renovação de Assinatura

## ✅ Serviços Iniciados

- **Backend**: http://localhost:3000 ✅ Rodando
- **Frontend**: http://localhost:5173 ✅ Rodando
- **PostgreSQL**: ✅ Conectado
- **Redis**: ✅ Conectado

## 👤 Usuário de Teste Criado

### Credenciais
```
Email: expired.student@test.com
Senha: Test123!@#
```

### Status da Assinatura
- **Status**: Cancelada/Expirada
- **Período**: 09/10/2025 - 08/11/2025
- **Cancelada em**: 08/11/2025 (há 30 dias)
- **Acesso aos cursos**: ❌ BLOQUEADO

## 🧪 Fluxo de Teste Completo

### 1. Login e Verificação de Bloqueio

```bash
# Acesse o frontend
http://localhost:5173/login
```

**Passos:**
1. Faça login com `expired.student@test.com` / `Test123!@#`
2. **Verifique o aviso amarelo** no topo da página sobre assinatura expirada
3. Navegue até a página de cursos: http://localhost:5173/courses
4. Tente clicar em um curso para acessar o conteúdo
5. **Resultado esperado**: Deve ser bloqueado e ver mensagem de assinatura expirada

### 2. Acessar Página de Renovação

**Opção A - Via Perfil:**
1. Clique no seu nome no canto superior direito
2. Vá para "Perfil"
3. Clique no botão "Renovar Assinatura"

**Opção B - Via URL Direta:**
```
http://localhost:5173/subscription/renew
```

**Resultado esperado:**
- ✅ Página carrega com lista de planos disponíveis
- ✅ Mostra aviso sobre assinatura expirada
- ✅ Exibe cards dos planos com preços

### 3. Escolher Plano e Ir para Checkout

**Passos:**
1. Na página de renovação, escolha qualquer plano
2. Clique em "Renovar com este Plano"
3. **Resultado esperado**: Redireciona para `/checkout/:planId`

### 4. Página de Checkout

**Resultado esperado:**
- ✅ Página carrega corretamente
- ✅ Mostra dados do plano selecionado no resumo lateral
- ✅ Exibe opções de pagamento: Cartão e PIX
- ✅ Mostra comparação de preços
- ✅ Exibe desconto PIX (5%)

### 5. Selecionar Método de Pagamento

**Opção A - Cartão:**
1. Clique em "Cartão de Crédito"
2. Escolha número de parcelas
3. Veja o valor por parcela
4. Clique em "Pagar com Cartão"
5. **Resultado**: Redireciona para Stripe Checkout (em teste)

**Opção B - PIX:**
1. Clique em "PIX"
2. Veja o valor com desconto de 5%
3. Clique em "Gerar QR Code PIX"
4. **Resultado**: Gera QR Code e código copia-e-cola

## 📋 Checklist de Validação

### Bloqueio de Acesso
- [ ] Usuário vê aviso de assinatura expirada
- [ ] Usuário não consegue acessar conteúdo dos cursos
- [ ] Mensagem de erro é clara e informativa

### Página de Renovação
- [ ] Lista de planos carrega corretamente
- [ ] Preços são exibidos formatados (R$ XX,XX)
- [ ] Botões "Renovar com este Plano" funcionam
- [ ] Aviso sobre status da assinatura é exibido

### Página de Checkout
- [ ] Dados do plano são carregados corretamente
- [ ] Resumo lateral mostra informações corretas
- [ ] Opções de pagamento aparecem
- [ ] Comparação de preços funciona
- [ ] Desconto PIX é calculado corretamente (5%)

### Pagamento com Cartão
- [ ] Seletor de parcelas funciona
- [ ] Valor por parcela é calculado corretamente
- [ ] Parcelas sem juros são indicadas (até 3x)
- [ ] Botão "Pagar com Cartão" funciona
- [ ] Redireciona para gateway de pagamento

### Pagamento com PIX
- [ ] Valor com desconto é exibido
- [ ] QR Code é gerado
- [ ] Código copia-e-cola é exibido
- [ ] Timer de expiração funciona (30 minutos)
- [ ] Instruções de pagamento são claras

## 🔍 Verificações Técnicas

### Backend - Rotas Funcionando
```bash
# Testar busca de planos
curl http://localhost:3000/api/subscriptions/plans \
  -H "Authorization: Bearer <token>"

# Testar busca de plano específico
curl http://localhost:3000/api/subscriptions/plans/<planId> \
  -H "Authorization: Bearer <token>"

# Testar configuração de pagamento
curl http://localhost:3000/api/payments/config \
  -H "Authorization: Bearer <token>"
```

### Frontend - Console do Navegador
Abra o console (F12) e verifique:
- [ ] Sem erros de JavaScript
- [ ] Requisições API retornam 200
- [ ] Dados são carregados corretamente

## 🐛 Problemas Conhecidos e Soluções

### Problema: Página de checkout retorna 404
**Solução**: ✅ Corrigido! Rota `/api/subscriptions/plans/:planId` foi implementada

### Problema: Token inválido
**Solução**: Limpar rate limit com `node clear-rate-limit.js`

### Problema: Planos não carregam
**Solução**: Verificar se há planos ativos no banco de dados

## 📊 Dados de Teste no Banco

### Planos Disponíveis
```sql
SELECT id, name, price, currency, interval 
FROM plans 
WHERE is_active = true;
```

**Resultado esperado**: 6 planos mensais de R$ 49,90

### Assinatura do Usuário de Teste
```sql
SELECT s.*, p.name as plan_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.student_id = (
  SELECT id FROM users WHERE email = 'expired.student@test.com'
);
```

**Resultado esperado**: 1 assinatura com status 'cancelled'

## 🎯 Objetivos do Teste

1. ✅ Verificar que usuário com assinatura expirada é bloqueado
2. ✅ Verificar que página de renovação funciona
3. ✅ Verificar que checkout carrega dados do plano
4. ✅ Verificar que opções de pagamento funcionam
5. ✅ Verificar que fluxo completo está integrado

## 📝 Notas Importantes

- Este é um ambiente de **TESTE**
- Pagamentos não são processados de verdade
- Use o Stripe em modo de teste para simular pagamentos
- PIX gerado é apenas para demonstração

## 🚀 Próximos Passos Após Teste

Se tudo funcionar:
1. Testar com pagamento real no Stripe (modo teste)
2. Verificar webhook de confirmação de pagamento
3. Confirmar que assinatura é ativada após pagamento
4. Verificar que acesso aos cursos é liberado

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do backend no terminal
2. Verificar console do navegador (F12)
3. Verificar se todos os serviços estão rodando
4. Limpar cache do navegador (Ctrl+Shift+Delete)
