# Funcionalidade: Renovação de Assinatura

## 📋 Implementação Atual

### Fluxo de Renovação

1. **Aviso de Assinatura Vencida**
   - Aparece automaticamente nas páginas de cursos
   - Botão "Ver Opções de Renovação" redireciona para `/profile`

2. **Página de Perfil**
   - Mostra status da assinatura
   - Exibe informações de contato para renovação
   - Botão abre cliente de email com assunto pré-preenchido

### Componentes Atualizados

#### `SubscriptionWarning.tsx`
- Botão renomeado para "Ver Opções de Renovação"
- Adicionados ícones visuais aos botões
- Layout responsivo com flex-wrap

#### `ProfilePage.tsx`
- Seção de renovação com informações de contato
- Box amarelo informativo com instruções claras
- Botão que abre email com assunto pré-preenchido

## 📧 Informações de Contato

### Email
- **Endereço:** suporte@eadplatform.com
- **Assunto:** Renovação de Assinatura

### WhatsApp
- **Número:** (11) 99999-9999
- **Link:** https://wa.me/5511999999999

## 🎨 Interface

### Aviso na Página de Cursos
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Assinatura Expirada                                     │
│                                                              │
│ Sua assinatura expirou há 30 dias. Para continuar          │
│ acessando os cursos e avaliações, você precisa renovar     │
│ sua assinatura.                                             │
│                                                              │
│ [🔄 Ver Opções de Renovação]  [📚 Ver Catálogo]           │
└─────────────────────────────────────────────────────────────┘
```

### Seção na Página de Perfil
```
┌─────────────────────────────────────────────────────────────┐
│ Status da Assinatura                                         │
│                                                              │
│ Status: [Cancelada]                                         │
│ Válida até: 02/11/2025                                      │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ℹ️  Renovação de Assinatura                             │ │
│ │                                                          │ │
│ │ Para renovar sua assinatura, entre em contato com o     │ │
│ │ suporte através do email suporte@eadplatform.com ou     │ │
│ │ pelo WhatsApp (11) 99999-9999.                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [✉️ Entrar em Contato para Renovar]                        │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo do Usuário

### Cenário 1: Usuário com Assinatura Vencida

1. Faz login no sistema
2. É redirecionado para `/courses`
3. Vê banner amarelo no topo: "Assinatura Expirada"
4. Clica em "Ver Opções de Renovação"
5. É redirecionado para `/profile`
6. Vê seção "Status da Assinatura" com status "Cancelada"
7. Vê box informativo com instruções de contato
8. Clica em "Entrar em Contato para Renovar"
9. Cliente de email abre com:
   - Para: suporte@eadplatform.com
   - Assunto: Renovação de Assinatura

### Cenário 2: Usuário Navegando Cursos

1. Está na página de cursos
2. Vê banner amarelo no topo
3. Pode clicar em "Ver Catálogo" para continuar navegando
4. Pode clicar em "Ver Opções de Renovação" para ir ao perfil

## 🚀 Próximos Passos (Futuro)

### Integração com Gateway de Pagamento

Para implementar renovação automática no futuro:

1. **Criar Endpoint de Renovação**
   ```typescript
   POST /api/subscriptions/renew
   {
     "planId": "string",
     "paymentMethod": "credit_card" | "pix" | "boleto"
   }
   ```

2. **Página de Checkout**
   - Criar `/subscription/renew`
   - Formulário de pagamento
   - Integração com gateway (Stripe, PagSeguro, etc.)

3. **Webhook de Confirmação**
   - Receber confirmação de pagamento
   - Atualizar status da assinatura
   - Enviar email de confirmação

4. **Atualizar ProfilePage**
   - Adicionar botão "Renovar Agora"
   - Redirecionar para página de checkout
   - Mostrar planos disponíveis

### Exemplo de Implementação Futura

```typescript
// ProfilePage.tsx
const handleRenewSubscription = () => {
  navigate('/subscription/renew', {
    state: {
      currentPlan: profile.subscriptionPlan,
      userId: profile.id
    }
  })
}

// SubscriptionRenewPage.tsx
const handlePayment = async (paymentData) => {
  try {
    const response = await api.post('/subscriptions/renew', paymentData)
    // Redirecionar para página de sucesso
    navigate('/subscription/success')
  } catch (error) {
    // Mostrar erro
  }
}
```

## 📝 Notas Técnicas

### Dados Necessários para Renovação

- ID do usuário
- Plano atual (se houver)
- Método de pagamento preferido
- Histórico de pagamentos

### Validações

- Verificar se usuário é estudante
- Verificar se assinatura está realmente vencida
- Validar dados de pagamento
- Confirmar disponibilidade do plano

### Segurança

- Usar HTTPS para todas as transações
- Tokenizar dados de cartão de crédito
- Implementar 3D Secure para cartões
- Logs de auditoria para todas as transações

## 🎯 Benefícios da Implementação Atual

1. **Transparência**
   - Usuário sabe exatamente como renovar
   - Informações de contato claras e acessíveis

2. **Simplicidade**
   - Não requer integração complexa com gateway
   - Processo manual controlado pela equipe

3. **Flexibilidade**
   - Permite negociação de valores
   - Atendimento personalizado

4. **Baixo Risco**
   - Sem exposição de dados de pagamento
   - Sem custos de gateway de pagamento

## 📞 Suporte

Para alterar as informações de contato, edite:
- `frontend/src/pages/ProfilePage.tsx` (linha ~268)
- Atualize email e WhatsApp conforme necessário

## ✅ Checklist de Teste

- [ ] Banner aparece para assinatura vencida
- [ ] Botão "Ver Opções de Renovação" redireciona para `/profile`
- [ ] Página de perfil mostra status correto
- [ ] Box informativo aparece quando assinatura não está ativa
- [ ] Links de email e WhatsApp funcionam
- [ ] Botão abre cliente de email com assunto correto
- [ ] Layout responsivo em mobile
- [ ] Ícones aparecem corretamente
