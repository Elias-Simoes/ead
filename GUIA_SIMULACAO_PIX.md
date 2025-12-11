# Guia - Como Simular Pagamento PIX em Desenvolvimento

## 📋 Visão Geral

Em ambiente de desenvolvimento, os pagamentos PIX são criados em modo **mock** (simulação), pois o PIX não está ativado no Stripe. Para testar o fluxo completo de renovação de assinatura, você precisa simular manualmente a confirmação do pagamento.

## 🎯 Fluxo Completo de Teste

### Passo 1: Gerar um Pagamento PIX

1. **Acesse o frontend**: http://localhost:5173/login

2. **Faça login com o usuário de teste**:
   ```
   Email: expired.student@test.com
   Senha: Test123!@#
   ```

3. **Navegue para renovação**:
   - Clique em "Renovar Assinatura" no aviso amarelo, OU
   - Acesse diretamente: http://localhost:5173/subscription/renew

4. **Escolha um plano**:
   - Clique em "Renovar com este Plano" em qualquer plano

5. **Gere o QR Code PIX**:
   - Na página de checkout, selecione "PIX"
   - Clique em "Gerar QR Code PIX"
   - ✅ QR Code e código copia-e-cola são gerados
   - ⏰ Timer de 30 minutos começa a contar

6. **Verifique no backend**:
   - O pagamento foi salvo no banco com status `pending`
   - Logs mostram: "Mock PIX payment created for development"

### Passo 2: Simular Confirmação do Pagamento

Agora você precisa simular que o pagamento foi confirmado:

```bash
# Executar o script de simulação
node simulate-pix-payment.js
```

**O que o script faz:**

1. ✅ Lista todos os pagamentos PIX pendentes
2. 🎯 Seleciona automaticamente o mais recente
3. 💰 Marca o pagamento como `paid`
4. 📝 Cria ou estende a assinatura do estudante
5. ✨ Registra o pagamento na tabela `payments`
6. 📧 Simula envio de email de confirmação

**Saída esperada:**

```
🔍 Buscando pagamentos PIX pendentes...

📋 Encontrados 1 pagamento(s) pendente(s):

1. ID: 18384ff7-710f-448d-85c1-df2391dd617a
   Estudante: Expired Student (expired.student@test.com)
   Plano: Plano Mensal
   Valor: R$ 47.41
   Criado em: 08/12/2025 14:20:51
   Expira em: 08/12/2025 14:50:51 ✅

🎯 Confirmando pagamento #1...

📋 Dados do Pagamento:
  ID: 18384ff7-710f-448d-85c1-df2391dd617a
  Estudante: Expired Student
  Email: expired.student@test.com
  Plano: Plano Mensal
  Valor Original: R$ 49.90
  Desconto: R$ 2.49
  Valor Final: R$ 47.41
  Duração: 30 dias

✅ Pagamento marcado como PAGO

✨ Nova assinatura CRIADA
  ID da Assinatura: abc123...
  Data de início: 2025-12-08
  Data de término: 2026-01-07

💰 Pagamento registrado na tabela payments

✅ SIMULAÇÃO CONCLUÍDA COM SUCESSO!

📧 Em produção, um email seria enviado para: expired.student@test.com

🎉 O estudante agora pode acessar os cursos!
```

### Passo 3: Verificar que Funcionou

1. **Recarregue a página no navegador** (F5)

2. **Verifique o aviso de assinatura**:
   - ❌ O aviso amarelo de "assinatura expirada" deve DESAPARECER
   - ✅ Agora você tem acesso completo

3. **Teste o acesso aos cursos**:
   - Vá para: http://localhost:5173/courses
   - Clique em qualquer curso
   - Clique em uma aula
   - ✅ O conteúdo deve carregar normalmente!

4. **Verifique seu perfil**:
   - Vá para: http://localhost:5173/profile
   - ✅ Status da assinatura deve mostrar "Ativa"
   - ✅ Data de término deve estar no futuro

## 🔧 Opções Avançadas

### Confirmar um Pagamento Específico

Se houver múltiplos pagamentos pendentes, você pode escolher qual confirmar:

```bash
# Confirmar o pagamento #2 da lista
node simulate-pix-payment.js 2

# Confirmar o pagamento #3 da lista
node simulate-pix-payment.js 3
```

### Verificar Pagamentos no Banco

```bash
# Criar script de verificação
node check-pix-payments.js
```

Ou via SQL direto:

```sql
-- Ver todos os pagamentos PIX
SELECT 
  pp.id,
  pp.status,
  pp.final_amount,
  pp.created_at,
  pp.paid_at,
  u.email as student_email,
  p.name as plan_name
FROM pix_payments pp
INNER JOIN users u ON pp.student_id = u.id
INNER JOIN plans p ON pp.plan_id = p.id
ORDER BY pp.created_at DESC
LIMIT 10;

-- Ver assinaturas ativas
SELECT 
  s.id,
  s.status,
  s.start_date,
  s.end_date,
  u.email as student_email,
  p.name as plan_name
FROM subscriptions s
INNER JOIN users u ON s.student_id = u.id
INNER JOIN plans p ON s.plan_id = p.id
WHERE u.email = 'expired.student@test.com'
ORDER BY s.created_at DESC;
```

## 🎭 Cenários de Teste

### Cenário 1: Primeira Assinatura
- Usuário sem assinatura ativa
- Gera PIX → Confirma pagamento
- ✅ Nova assinatura é criada

### Cenário 2: Renovação de Assinatura Expirada
- Usuário com assinatura cancelada/expirada
- Gera PIX → Confirma pagamento
- ✅ Nova assinatura é criada

### Cenário 3: Extensão de Assinatura Ativa
- Usuário com assinatura ativa
- Gera PIX → Confirma pagamento
- ✅ Data de término é estendida

### Cenário 4: Pagamento Expirado
- Gera PIX e espera 30 minutos
- Job automático marca como `expired`
- ❌ Não pode mais ser confirmado
- 📧 Email de expiração é enviado

## 🐛 Troubleshooting

### Problema: "Nenhum pagamento PIX pendente encontrado"

**Solução**: Você precisa gerar um pagamento primeiro:
1. Faça login no frontend
2. Acesse a página de renovação
3. Gere um QR Code PIX
4. Execute o script novamente

### Problema: "Pagamento já está com status: paid"

**Solução**: Este pagamento já foi confirmado. Gere um novo pagamento PIX.

### Problema: Assinatura não aparece como ativa

**Solução**: 
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça logout e login novamente
3. Verifique no banco se a assinatura foi criada

### Problema: Ainda vejo aviso de assinatura expirada

**Solução**:
1. Recarregue a página (F5)
2. Faça logout e login novamente
3. Verifique se o token JWT foi atualizado

## 📊 Verificação Completa

Execute este checklist após simular o pagamento:

- [ ] Pagamento marcado como `paid` no banco
- [ ] Assinatura criada/estendida com status `active`
- [ ] Data de término está no futuro
- [ ] Registro criado na tabela `payments`
- [ ] Aviso de assinatura expirada desapareceu
- [ ] Acesso aos cursos está liberado
- [ ] Perfil mostra assinatura ativa

## 🚀 Produção

Em produção, este processo é automático:

1. **Usuário gera QR Code PIX** → Stripe cria PaymentIntent real
2. **Usuário paga via PIX** → Banco processa pagamento
3. **Stripe recebe confirmação** → Envia webhook para backend
4. **Backend processa webhook** → Ativa assinatura automaticamente
5. **Email enviado** → Usuário recebe confirmação

Não é necessário script manual!

## 📝 Notas Importantes

- ⚠️ Este script é APENAS para desenvolvimento/teste
- ⚠️ NÃO use em produção
- ⚠️ Pagamentos mock não processam dinheiro real
- ✅ Simula o comportamento real do webhook do Stripe
- ✅ Permite testar todo o fluxo de renovação

## 🔗 Arquivos Relacionados

- `simulate-pix-payment.js` - Script de simulação
- `src/modules/subscriptions/services/pix-payment.service.ts` - Serviço PIX
- `src/modules/subscriptions/controllers/webhook.controller.ts` - Webhook handler
- `CORRECAO_ERRO_PIX_CHECKOUT.md` - Documentação das correções
- `TESTE_RENOVACAO_ASSINATURA.md` - Guia de teste completo
