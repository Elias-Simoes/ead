# Comandos Rápidos - Simulação PIX

## 🚀 Comandos Essenciais

### Simular Pagamento PIX
```bash
# Confirmar o pagamento mais recente
node simulate-pix-payment.js

# Confirmar um pagamento específico
node simulate-pix-payment.js 2
```

### Verificar Status
```bash
# Ver todos os pagamentos PIX
node check-pix-payments.js
```

### Limpar Rate Limit (se necessário)
```bash
node clear-rate-limit.js
```

## 📊 Queries SQL Úteis

### Ver Pagamentos PIX do Usuário de Teste
```sql
SELECT 
  pp.id,
  pp.status,
  pp.final_amount,
  pp.created_at,
  pp.paid_at,
  pp.expires_at,
  p.name as plan_name
FROM pix_payments pp
INNER JOIN users u ON pp.student_id = u.id
INNER JOIN plans p ON pp.plan_id = p.id
WHERE u.email = 'expired.student@test.com'
ORDER BY pp.created_at DESC;
```

### Ver Assinatura Atual
```sql
SELECT 
  s.id,
  s.status,
  s.start_date,
  s.end_date,
  s.payment_method,
  s.amount_paid,
  p.name as plan_name
FROM subscriptions s
INNER JOIN users u ON s.student_id = u.id
INNER JOIN plans p ON s.plan_id = p.id
WHERE u.email = 'expired.student@test.com'
ORDER BY s.created_at DESC
LIMIT 1;
```

### Ver Todos os Pagamentos Pendentes
```sql
SELECT 
  pp.id,
  pp.status,
  pp.final_amount,
  pp.expires_at,
  u.email,
  p.name as plan_name
FROM pix_payments pp
INNER JOIN users u ON pp.student_id = u.id
INNER JOIN plans p ON pp.plan_id = p.id
WHERE pp.status = 'pending'
ORDER BY pp.created_at DESC;
```

### Limpar Pagamentos de Teste (CUIDADO!)
```sql
-- APENAS EM DESENVOLVIMENTO!
-- Deletar pagamentos PIX de teste
DELETE FROM pix_payments 
WHERE gateway_charge_id LIKE 'pi_mock_%';

-- Deletar assinaturas de teste
DELETE FROM subscriptions 
WHERE student_id = (
  SELECT id FROM users WHERE email = 'expired.student@test.com'
);
```

## 🌐 URLs Importantes

### Frontend
```
Login:           http://localhost:5173/login
Renovação:       http://localhost:5173/subscription/renew
Cursos:          http://localhost:5173/courses
Perfil:          http://localhost:5173/profile
```

### Backend (API)
```
Health Check:    http://localhost:3000/health
Payment Config:  http://localhost:3000/api/payments/config
Plans:           http://localhost:3000/api/subscriptions/plans
```

## 🔑 Credenciais de Teste

```
Email:    expired.student@test.com
Senha:    Test123!@#
Status:   Assinatura expirada (para testar renovação)
```

## 📝 Fluxo Rápido

```bash
# 1. Gerar QR Code no navegador
# → http://localhost:5173/subscription/renew
# → Escolher plano → Gerar QR Code PIX

# 2. Simular confirmação
node simulate-pix-payment.js

# 3. Verificar resultado
node check-pix-payments.js

# 4. Recarregar navegador (F5)
# → Acesso liberado!
```

## 🐛 Troubleshooting Rápido

### Erro: "Nenhum pagamento PIX pendente"
```bash
# Solução: Gerar um novo pagamento no frontend primeiro
```

### Erro: "Pagamento já está com status: paid"
```bash
# Solução: Gerar um novo pagamento PIX
```

### Erro: "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
# Verificar variáveis de ambiente no .env
```

### Aviso ainda aparece após simulação
```bash
# 1. Recarregar página (F5)
# 2. Fazer logout e login novamente
# 3. Limpar cache do navegador
```

### Acesso ainda bloqueado
```sql
-- Verificar se assinatura foi criada
SELECT * FROM subscriptions 
WHERE student_id = (
  SELECT id FROM users WHERE email = 'expired.student@test.com'
)
ORDER BY created_at DESC;

-- Verificar se está ativa e não expirada
SELECT 
  status,
  end_date,
  end_date > CURRENT_TIMESTAMP as is_valid
FROM subscriptions 
WHERE student_id = (
  SELECT id FROM users WHERE email = 'expired.student@test.com'
)
ORDER BY created_at DESC
LIMIT 1;
```

## 🔄 Reset Completo (Começar do Zero)

```sql
-- APENAS EM DESENVOLVIMENTO!
-- Deletar todos os dados de teste

-- 1. Deletar pagamentos
DELETE FROM payments 
WHERE subscription_id IN (
  SELECT id FROM subscriptions 
  WHERE student_id = (
    SELECT id FROM users WHERE email = 'expired.student@test.com'
  )
);

-- 2. Deletar assinaturas
DELETE FROM subscriptions 
WHERE student_id = (
  SELECT id FROM users WHERE email = 'expired.student@test.com'
);

-- 3. Deletar pagamentos PIX
DELETE FROM pix_payments 
WHERE student_id = (
  SELECT id FROM users WHERE email = 'expired.student@test.com'
);

-- 4. Criar assinatura expirada novamente
node create-expired-subscription-user.js
```

## 📚 Documentação Completa

```
GUIA_SIMULACAO_PIX.md          - Guia completo passo a passo
EXEMPLO_SIMULACAO_PIX.md       - Exemplos visuais
RESUMO_SIMULACAO_PIX.md        - Resumo técnico
CORRECAO_ERRO_PIX_CHECKOUT.md  - Correções implementadas
TESTE_RENOVACAO_ASSINATURA.md  - Guia de teste geral
```

## 🎯 Atalhos do Teclado (Navegador)

```
F5              - Recarregar página
Ctrl+Shift+R    - Recarregar sem cache
Ctrl+Shift+Del  - Limpar cache
F12             - Abrir DevTools
Ctrl+Shift+I    - Abrir DevTools (alternativo)
```

## 💡 Dicas Rápidas

1. **Sempre recarregue a página (F5)** após simular o pagamento
2. **Use o script de verificação** para confirmar que funcionou
3. **Verifique os logs do backend** para debug
4. **Limpe o cache** se algo não atualizar
5. **Faça logout/login** se o token não atualizar

## ⚡ One-Liner para Teste Completo

```bash
# Gerar pagamento no navegador, depois executar:
node simulate-pix-payment.js && node check-pix-payments.js && echo "✅ Pronto! Recarregue o navegador (F5)"
```

---

**Salve este arquivo para referência rápida!** 📌
