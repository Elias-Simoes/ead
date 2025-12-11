# 🎯 Guia Rápido - Simulação de Pagamento PIX

## ✅ Resumo Executivo

Este guia mostra como testar o fluxo completo de pagamento PIX em desenvolvimento. Como o PIX não está ativado no Stripe em modo de teste, usamos pagamentos **mock** que simulam o comportamento real.

## 🚀 Passo a Passo Rápido

### 1. Gerar Pagamento PIX (Frontend)

```bash
# 1. Acesse o frontend
http://localhost:5173/login

# 2. Faça login com usuário de teste
Email: expired.student@test.com
Senha: Test123!@#

# 3. Acesse a página de renovação
http://localhost:5173/subscription/renew

# 4. Escolha um plano e clique em "Renovar com este Plano"

# 5. Na página de checkout:
   - Selecione "PIX"
   - Clique em "Gerar QR Code PIX"
   - ✅ QR Code é gerado (mock em desenvolvimento)
```

**O que acontece no backend:**
- Pagamento PIX é criado com status `pending`
- Registro salvo na tabela `pix_payments`
- Timer de 30 minutos inicia
- Logs mostram: "Mock PIX payment created for development"

### 2. Simular Confirmação do Pagamento (Terminal)

```bash
# Execute o script de simulação
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

✅ Pagamento marcado como PAGO
✨ Nova assinatura CRIADA
💰 Pagamento registrado na tabela payments
✅ SIMULAÇÃO CONCLUÍDA COM SUCESSO!
```

### 3. Verificar que Funcionou (Frontend)

```bash
# 1. Recarregue a página no navegador (F5)
# 2. Faça logout e login novamente (para atualizar o token JWT)

# Verificações:
✅ Aviso amarelo de "assinatura expirada" desapareceu
✅ Acesso aos cursos está liberado
✅ Perfil mostra "Assinatura Ativa"
✅ Pode acessar conteúdo das aulas
```

## 🔧 Scripts Disponíveis

### 1. Simular Pagamento PIX
```bash
# Confirmar o pagamento mais recente
node simulate-pix-payment.js

# Confirmar um pagamento específico (número da lista)
node simulate-pix-payment.js 2
```

### 2. Verificar Status dos Pagamentos
```bash
# Ver todos os pagamentos PIX e suas assinaturas
node check-pix-payments.js
```

### 3. Verificar Assinatura Após Renovação
```bash
# Ver status da assinatura no banco
node check-subscription-after-renew.js
```

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE PAGAMENTO PIX                   │
└─────────────────────────────────────────────────────────────┘

1. FRONTEND: Usuário gera QR Code PIX
   └─> Backend cria registro com status 'pending'
   
2. SCRIPT: Simula confirmação do pagamento
   └─> Marca pagamento como 'paid'
   └─> Cria/estende assinatura
   └─> Registra na tabela payments
   
3. FRONTEND: Usuário recarrega página
   └─> Token JWT atualizado
   └─> Aviso de expiração desaparece
   └─> Acesso liberado aos cursos
```

## 🎭 Cenários de Teste

### Cenário 1: Primeira Assinatura
```bash
# Usuário sem assinatura ativa
1. Gera PIX → Confirma pagamento
2. ✅ Nova assinatura é criada
```

### Cenário 2: Renovação de Assinatura Expirada
```bash
# Usuário com assinatura cancelada/expirada
1. Gera PIX → Confirma pagamento
2. ✅ Nova assinatura é criada
```

### Cenário 3: Extensão de Assinatura Ativa
```bash
# Usuário com assinatura ativa
1. Gera PIX → Confirma pagamento
2. ✅ Data de término é estendida
```

## 🐛 Troubleshooting

### Problema: "Nenhum pagamento PIX pendente encontrado"
**Solução**: Gere um novo pagamento PIX no frontend primeiro.

### Problema: Aviso de assinatura expirada ainda aparece
**Solução**: 
1. Recarregue a página (F5)
2. Faça logout e login novamente
3. Limpe o cache do navegador se necessário

### Problema: "Pagamento já está com status: paid"
**Solução**: Este pagamento já foi confirmado. Gere um novo.

## ✅ Checklist de Verificação

Após simular o pagamento, verifique:

- [ ] Script executou sem erros
- [ ] Mensagem "SIMULAÇÃO CONCLUÍDA COM SUCESSO!" apareceu
- [ ] Pagamento marcado como `paid` no banco
- [ ] Assinatura criada/estendida com status `active`
- [ ] Data de término está no futuro
- [ ] Aviso de assinatura expirada desapareceu
- [ ] Acesso aos cursos está liberado
- [ ] Perfil mostra assinatura ativa

## 📝 Notas Importantes

⚠️ **Este processo é APENAS para desenvolvimento/teste**
- Em produção, o Stripe processa pagamentos PIX reais
- Webhooks automáticos ativam assinaturas
- Não é necessário script manual

✅ **Vantagens do Mock em Desenvolvimento**
- Testa todo o fluxo sem processar dinheiro real
- Simula comportamento real do webhook do Stripe
- Permite testar cenários de erro e sucesso

## 🔗 Arquivos Relacionados

- `simulate-pix-payment.js` - Script de simulação
- `check-pix-payments.js` - Verificar status dos pagamentos
- `check-subscription-after-renew.js` - Verificar assinatura
- `GUIA_SIMULACAO_PIX.md` - Guia detalhado
- `EXEMPLO_SIMULACAO_PIX.md` - Exemplos visuais

## 🚀 Produção vs Desenvolvimento

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| Pagamento PIX | Mock (simulado) | Real (Stripe) |
| Confirmação | Script manual | Webhook automático |
| Email | Apenas log | Enviado de verdade |
| Dinheiro | Não processa | Processa real |
| Webhook | Não necessário | Obrigatório |

---

**Pronto para testar?** Execute os passos acima e veja o sistema funcionando! 🎉
