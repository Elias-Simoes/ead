# Design Document

## Overview

Este documento descreve o design técnico para implementação de múltiplas opções de pagamento no checkout de assinaturas, incluindo parcelamento no cartão de crédito via Stripe e pagamento à vista via PIX com integração a um provedor brasileiro.

A solução permitirá que estudantes escolham entre:
- Pagamento parcelado no cartão (1x a 12x)
- Pagamento à vista via PIX com desconto

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/TS)     │
│                 │
│ - CheckoutPage  │
│ - PaymentForm   │
│ - PixPayment    │
└────────┬────────┘
         │
         │ REST API
         │
┌────────▼────────────────────────────────┐
│         Backend (Node.js/Express)       │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Payment Controller              │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│  ┌──────────▼───────────────────────┐  │
│  │  Payment Service                 │  │
│  │  - createCheckout()              │  │
│  │  - createPixPayment()            │  │
│  │  - checkPaymentStatus()          │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│  ┌──────────▼───────────────────────┐  │
│  │  Gateway Services                │  │
│  │  - StripeService (parcelamento)  │  │
│  │  - PixService (PIX payments)     │  │
│  └──────────┬───────────────────────┘  │
└─────────────┼───────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐      ┌───────▼────────┐
│ Stripe │      │ PIX Provider   │
│        │      │ (Asaas/Mercado │
│        │      │  Pago/Stripe)  │
└────────┘      └────────────────┘
```

### Payment Flow

**Cartão Parcelado:**
1. Usuário seleciona plano e número de parcelas
2. Frontend envia requisição para criar checkout
3. Backend cria sessão Stripe com installments configurado
4. Usuário é redirecionado para Stripe Checkout
5. Após pagamento, webhook atualiza assinatura

**PIX:**
1. Usuário seleciona plano e opção PIX
2. Frontend envia requisição para criar pagamento PIX
3. Backend gera QR Code e código copia-e-cola
4. Frontend exibe QR Code e inicia polling de status
5. Quando pago, webhook confirma e ativa assinatura
6. Frontend detecta confirmação e redireciona

## Components and Interfaces

### Frontend Components

#### 1. CheckoutPage (Nova)
```typescript
interface CheckoutPageProps {
  planId: string
}

interface CheckoutState {
  selectedPlan: Plan | null
  paymentMethod: 'card' | 'pix' | null
  installments: number
  loading: boolean
  error: string
}
```

Responsabilidades:
- Exibir detalhes do plano selecionado
- Permitir escolha entre cartão e PIX
- Renderizar formulário apropriado baseado na escolha

#### 2. CardPaymentForm (Novo)
```typescript
interface CardPaymentFormProps {
  plan: Plan
  onSubmit: (installments: number) => Promise<void>
}
```

Responsabilidades:
- Exibir opções de parcelamento (1x a 12x)
- Calcular e mostrar valor de cada parcela
- Indicar se há juros
- Criar sessão Stripe ao confirmar

#### 3. PixPaymentForm (Novo)
```typescript
interface PixPaymentFormProps {
  plan: Plan
  onSubmit: () => Promise<void>
}

interface PixPaymentData {
  qrCode: string
  qrCodeBase64: string
  copyPasteCode: string
  expiresAt: Date
  amount: number
  discount: number
}
```

Responsabilidades:
- Exibir valor com desconto PIX
- Gerar e mostrar QR Code
- Fornecer botão "Copiar Código"
- Fazer polling de status do pagamento
- Exibir timer de expiração
- Redirecionar quando confirmado

#### 4. PaymentComparison (Novo)
```typescript
interface PaymentComparisonProps {
  plan: Plan
  pixDiscount: number
  onSelectMethod: (method: 'card' | 'pix') => void
}
```

Responsabilidades:
- Comparar lado a lado: cartão vs PIX
- Destacar economia do PIX
- Mostrar vantagens de cada método

### Backend Services

#### 1. PaymentService (Expandir existente)
```typescript
interface CreateCheckoutParams {
  studentId: string
  planId: string
  studentEmail: string
  installments: number
  paymentMethod: 'card' | 'pix'
}

interface CreatePixPaymentParams {
  studentId: string
  planId: string
  studentEmail: string
  amount: number
}

interface PixPaymentResult {
  paymentId: string
  qrCode: string
  qrCodeBase64: string
  copyPasteCode: string
  expiresAt: Date
  amount: number
}

class PaymentService {
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>
  async createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult>
  async checkPixPaymentStatus(paymentId: string): Promise<PaymentStatus>
  async handlePixWebhook(payload: any): Promise<void>
}
```

#### 2. PixGatewayService (Novo)
```typescript
interface PixChargeData {
  amount: number
  description: string
  customerEmail: string
  expirationMinutes: number
  metadata: Record<string, string>
}

interface PixChargeResult {
  chargeId: string
  qrCode: string
  qrCodeBase64: string
  copyPasteCode: string
  expiresAt: Date
  status: 'pending' | 'paid' | 'expired'
}

class PixGatewayService {
  async createCharge(data: PixChargeData): Promise<PixChargeResult>
  async getChargeStatus(chargeId: string): Promise<PixChargeResult>
  async cancelCharge(chargeId: string): Promise<void>
  verifyWebhookSignature(payload: string, signature: string): boolean
}
```

#### 3. StripeService (Atualizar existente)
```typescript
interface CreateCheckoutWithInstallmentsParams {
  planId: string
  planName: string
  planPrice: number
  currency: string
  studentId: string
  studentEmail: string
  installments: number
  successUrl: string
  cancelUrl: string
}

class StripeService {
  async createCheckoutWithInstallments(
    params: CreateCheckoutWithInstallmentsParams
  ): Promise<CheckoutSessionResult>
}
```

### API Endpoints

#### POST /api/payments/checkout
Cria sessão de checkout (cartão ou PIX)

Request:
```json
{
  "planId": "plan_123",
  "paymentMethod": "card",
  "installments": 12
}
```

Response (Card):
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_123"
}
```

Response (PIX):
```json
{
  "paymentId": "pix_123",
  "qrCode": "00020126...",
  "qrCodeBase64": "data:image/png;base64,...",
  "copyPasteCode": "00020126...",
  "expiresAt": "2024-01-01T12:30:00Z",
  "amount": 89.90,
  "discount": 10.00
}
```

#### GET /api/payments/pix/:paymentId/status
Verifica status de pagamento PIX

Response:
```json
{
  "status": "paid",
  "paidAt": "2024-01-01T12:15:00Z"
}
```

#### POST /api/payments/webhooks/pix
Recebe notificações de pagamento PIX

#### GET /api/payments/config
Retorna configurações de pagamento

Response:
```json
{
  "maxInstallments": 12,
  "pixDiscountPercent": 10,
  "installmentsWithoutInterest": 12
}
```

## Data Models

### Payment Configuration (Novo)
```typescript
interface PaymentConfig {
  id: string
  maxInstallments: number
  pixDiscountPercent: number
  installmentsWithoutInterest: number
  pixExpirationMinutes: number
  createdAt: Date
  updatedAt: Date
}
```

### PIX Payment (Novo)
```typescript
interface PixPayment {
  id: string
  studentId: string
  planId: string
  amount: number
  discount: number
  finalAmount: number
  qrCode: string
  copyPasteCode: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  expiresAt: Date
  paidAt: Date | null
  gatewayChargeId: string
  gatewayResponse: any
  createdAt: Date
  updatedAt: Date
}
```

### Payment (Atualizar existente)
Adicionar campos:
```typescript
interface Payment {
  // ... campos existentes
  paymentMethod: 'card' | 'pix'
  installments: number | null
  pixPaymentId: string | null
}
```

## Database Schema

### payments table (atualizar)
```sql
ALTER TABLE payments 
ADD COLUMN payment_method VARCHAR(10) DEFAULT 'card',
ADD COLUMN installments INTEGER,
ADD COLUMN pix_payment_id UUID REFERENCES pix_payments(id);
```

### pix_payments table (nova)
```sql
CREATE TABLE pix_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  amount DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  qr_code TEXT NOT NULL,
  copy_paste_code TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  paid_at TIMESTAMP,
  gateway_charge_id VARCHAR(255) NOT NULL,
  gateway_response JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pix_payments_student ON pix_payments(student_id);
CREATE INDEX idx_pix_payments_status ON pix_payments(status);
CREATE INDEX idx_pix_payments_gateway_charge ON pix_payments(gateway_charge_id);
```

### payment_config table (nova)
```sql
CREATE TABLE payment_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  max_installments INTEGER NOT NULL DEFAULT 12,
  pix_discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  installments_without_interest INTEGER NOT NULL DEFAULT 12,
  pix_expiration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default config
INSERT INTO payment_config (max_installments, pix_discount_percent, installments_without_interest, pix_expiration_minutes)
VALUES (12, 10.00, 12, 30);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Desconto PIX é aplicado corretamente
*Para qualquer* plano e configuração de desconto, quando um pagamento PIX é criado, o valor final deve ser igual ao valor do plano menos o percentual de desconto configurado
**Validates: Requirements 3.1, 4.1, 4.3**

### Property 2: Parcelamento calcula valores corretos
*Para qualquer* plano e número de parcelas, o valor de cada parcela multiplicado pelo número de parcelas deve ser igual ao valor total do plano (considerando arredondamentos)
**Validates: Requirements 2.2, 2.5**

### Property 3: Pagamento PIX expira após tempo configurado
*Para qualquer* pagamento PIX criado, se o tempo atual for maior que a data de expiração e o status for 'pending', o sistema deve marcar o pagamento como 'expired'
**Validates: Requirements 5.1, 5.2**

### Property 4: Webhook PIX ativa assinatura
*Para qualquer* pagamento PIX confirmado via webhook, a assinatura do estudante deve ser atualizada para status 'active' com data de expiração correta
**Validates: Requirements 5.3, 5.4, 5.5**

### Property 5: Polling detecta confirmação de pagamento
*Para qualquer* pagamento PIX, quando o status muda de 'pending' para 'paid', o próximo polling deve retornar o novo status
**Validates: Requirements 6.1, 6.2**

### Property 6: QR Code é único por pagamento
*Para qualquer* dois pagamentos PIX diferentes, os QR Codes gerados devem ser únicos
**Validates: Requirements 3.2, 3.3**

### Property 7: Configurações afetam novos checkouts
*Para qualquer* alteração nas configurações de pagamento, todos os checkouts criados após a alteração devem usar os novos valores
**Validates: Requirements 7.4**

### Property 8: Parcelamento respeita limite configurado
*Para qualquer* tentativa de criar checkout com parcelamento, o número de parcelas solicitado deve ser menor ou igual ao máximo configurado
**Validates: Requirements 2.1, 7.1**

## Error Handling

### Frontend Errors
- **PAYMENT_METHOD_NOT_SELECTED**: Usuário não selecionou método de pagamento
- **INSTALLMENTS_NOT_SELECTED**: Usuário não selecionou número de parcelas
- **PIX_GENERATION_FAILED**: Falha ao gerar QR Code PIX
- **PIX_EXPIRED**: Pagamento PIX expirou
- **PAYMENT_POLLING_FAILED**: Falha ao verificar status do pagamento

### Backend Errors
- **INVALID_INSTALLMENTS**: Número de parcelas inválido ou acima do limite
- **PIX_PROVIDER_ERROR**: Erro no provedor de PIX
- **INVALID_PIX_WEBHOOK**: Webhook PIX com assinatura inválida
- **PAYMENT_ALREADY_PROCESSED**: Tentativa de processar pagamento já confirmado
- **PIX_PAYMENT_NOT_FOUND**: Pagamento PIX não encontrado
- **CONFIG_NOT_FOUND**: Configuração de pagamento não encontrada

## Testing Strategy

### Unit Tests
- Cálculo de desconto PIX
- Cálculo de parcelas
- Validação de número de parcelas
- Geração de QR Code
- Verificação de expiração
- Processamento de webhooks

### Property-Based Tests
- Propriedade 1: Desconto PIX correto (fast-check)
- Propriedade 2: Cálculo de parcelas (fast-check)
- Propriedade 3: Expiração de pagamentos (fast-check)
- Propriedade 4: Ativação via webhook (fast-check)
- Propriedade 5: Polling de status (fast-check)
- Propriedade 6: Unicidade de QR Codes (fast-check)
- Propriedade 7: Aplicação de configurações (fast-check)
- Propriedade 8: Limite de parcelamento (fast-check)

### Integration Tests
- Fluxo completo de pagamento com cartão parcelado
- Fluxo completo de pagamento PIX
- Webhook PIX confirmando pagamento
- Expiração de pagamento PIX
- Polling de status
- Atualização de configurações

### E2E Tests
- Usuário seleciona plano e paga com cartão parcelado
- Usuário seleciona plano e paga com PIX
- Usuário copia código PIX e confirma pagamento
- Pagamento PIX expira e usuário gera novo
- Comparação visual entre métodos de pagamento

## Security Considerations

1. **Webhook Validation**: Sempre validar assinatura de webhooks PIX
2. **Payment Idempotency**: Prevenir processamento duplicado de pagamentos
3. **QR Code Expiration**: Invalidar QR Codes expirados
4. **Rate Limiting**: Limitar requisições de criação de pagamento PIX
5. **Data Encryption**: Criptografar dados sensíveis de pagamento
6. **Audit Logging**: Registrar todas as transações de pagamento

## Performance Considerations

1. **Polling Optimization**: Usar exponential backoff no polling de status PIX
2. **QR Code Caching**: Cachear QR Code base64 para evitar regeneração
3. **Webhook Processing**: Processar webhooks de forma assíncrona
4. **Database Indexing**: Índices em status e gateway_charge_id
5. **Connection Pooling**: Pool de conexões para provedor PIX

## Provider Selection

### Stripe - Provedor Único

**Decisão**: Usar exclusivamente Stripe para todos os métodos de pagamento.

**Capacidades do Stripe para o Brasil:**

1. **PIX**
   - ✅ Suporte nativo desde 2021
   - ✅ Geração automática de QR Code
   - ✅ Código copia-e-cola incluído
   - ✅ Webhook unificado para confirmação
   - ✅ Expiração configurável (padrão 24h, ajustável)
   - ✅ Status em tempo real via API

2. **Parcelamento (Installments)**
   - ✅ Suporte para parcelamento brasileiro
   - ✅ Configuração de 1x até 12x
   - ✅ Sem juros ou com juros configurável
   - ✅ Exibição automática no Checkout
   - ✅ Compatível com cartões brasileiros

3. **Vantagens da Solução Unificada:**
   - Webhook único para todos os métodos
   - Mesma estrutura de Customer
   - Reconciliação simplificada
   - Menor complexidade de código
   - Suporte técnico centralizado

**Limitações Conhecidas:**
- ⚠️ PIX via Stripe requer conta Stripe Brasil
- ⚠️ Taxas podem ser maiores que provedores locais
- ⚠️ Parcelamento requer configuração específica por país

**Configuração Necessária:**
```javascript
// Stripe Checkout com PIX
payment_method_types: ['card', 'pix']

// Stripe Checkout com Parcelamento
payment_method_options: {
  card: {
    installments: {
      enabled: true,
      plan: {
        count: 12,
        interval: 'month',
        type: 'fixed_count'
      }
    }
  }
}
```

## Migration Strategy

1. Criar novas tabelas (pix_payments, payment_config)
2. Atualizar tabela payments com novos campos
3. Implementar serviços PIX
4. Atualizar frontend com nova UI de checkout
5. Testar em ambiente de staging
6. Deploy gradual com feature flag
7. Monitorar métricas de conversão

## Monitoring and Metrics

- Taxa de conversão por método de pagamento
- Tempo médio até confirmação PIX
- Taxa de expiração de pagamentos PIX
- Distribuição de parcelas escolhidas
- Valor médio de desconto PIX utilizado
- Erros de webhook PIX
- Latência de polling de status
