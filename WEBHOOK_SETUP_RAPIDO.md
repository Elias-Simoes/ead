# Setup Rápido do Webhook com Stripe CLI

## Por que usar Stripe CLI em vez de ngrok?

- ✅ Mais confiável (não desconecta)
- ✅ Não precisa atualizar URL toda vez
- ✅ Mostra eventos em tempo real
- ✅ Permite simular eventos facilmente
- ✅ Gera o webhook secret automaticamente

## Instalação

### Windows (Recomendado: Scoop)

```powershell
# Instalar Scoop (se não tiver)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Instalar Stripe CLI
scoop install stripe
```

### Windows (Alternativa: Download direto)

1. Baixe em: https://github.com/stripe/stripe-cli/releases/latest
2. Procure por `stripe_X.X.X_windows_x86_64.zip`
3. Extraia o arquivo `stripe.exe`
4. Adicione ao PATH ou execute direto da pasta

## Uso

### 1. Login no Stripe

```bash
stripe login
```

Isso vai abrir o navegador para você autorizar.

### 2. Iniciar o Listener

```bash
stripe listen --forward-to localhost:3000/api/webhooks/payment
```

Você verá algo assim:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### 3. Copiar o Webhook Secret

Copie o `whsec_xxxxxxxxxxxxx` e adicione no `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 4. Reiniciar o Servidor

O servidor vai recarregar automaticamente (modo watch).

### 5. Testar!

Em outro terminal, simule eventos:

```bash
# Simular assinatura criada
stripe trigger customer.subscription.created

# Simular pagamento bem-sucedido
stripe trigger invoice.payment_succeeded

# Simular pagamento falho
stripe trigger invoice.payment_failed
```

## Vantagens

Você verá os eventos em tempo real no terminal do Stripe CLI:

```
2025-11-12 13:45:00   --> customer.subscription.created [evt_xxx]
2025-11-12 13:45:00   <-- [200] POST http://localhost:3000/api/webhooks/payment [evt_xxx]
```

E no terminal do servidor:

```
[INFO] POST /api/webhooks/payment
[INFO] Webhook event received
[INFO] Processing customer.subscription.created event
[INFO] Subscription created successfully
```

## Troubleshooting

### Erro: "stripe: command not found"

Reinicie o terminal após instalar.

### Erro: "Failed to connect to localhost:3000"

Certifique-se de que o servidor está rodando (`npm run dev`).

### Webhook secret não funciona

1. Copie o secret exatamente como mostrado
2. Reinicie o servidor após adicionar no `.env`
3. Verifique se não tem espaços extras

## Próximos Passos

Depois de testar com o Stripe CLI, você pode:

1. Criar uma assinatura real via API
2. Testar o fluxo completo de checkout
3. Ver os webhooks sendo processados em tempo real

---

**Recomendação:** Use o Stripe CLI para desenvolvimento. É muito mais fácil e confiável que ngrok!
