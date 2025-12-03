# Requirements Document

## Introduction

Este documento especifica os requisitos para implementação de múltiplas opções de pagamento na página de checkout de assinaturas, incluindo parcelamento no cartão de crédito e pagamento à vista via PIX.

## Glossary

- **Sistema**: Plataforma EAD
- **Estudante**: Usuário com role 'student' que deseja assinar ou renovar assinatura
- **Checkout**: Página onde o estudante escolhe a forma de pagamento
- **Parcelamento**: Divisão do valor total em parcelas mensais no cartão de crédito
- **PIX**: Sistema de pagamento instantâneo brasileiro
- **Gateway de Pagamento**: Stripe (para cartão) e integração PIX
- **Plano**: Produto de assinatura com preço e duração definidos
- **QR Code**: Código visual para pagamento PIX
- **Copia e Cola**: String de pagamento PIX que pode ser copiada

## Requirements

### Requirement 1

**User Story:** Como estudante, quero visualizar diferentes opções de pagamento na página de checkout, para que eu possa escolher a forma mais conveniente de pagar minha assinatura.

#### Acceptance Criteria

1. WHEN o estudante acessa a página de renovação THEN o Sistema SHALL exibir os planos disponíveis com opções de pagamento
2. WHEN o estudante seleciona um plano THEN o Sistema SHALL exibir as formas de pagamento disponíveis (cartão parcelado e PIX à vista)
3. WHEN o estudante visualiza as opções THEN o Sistema SHALL destacar visualmente as diferenças entre cada forma de pagamento
4. WHEN o estudante está na página de checkout THEN o Sistema SHALL exibir o valor total, parcelas disponíveis e desconto PIX de forma clara

### Requirement 2

**User Story:** Como estudante, quero parcelar o pagamento da assinatura no cartão de crédito, para que eu possa distribuir o custo ao longo de vários meses.

#### Acceptance Criteria

1. WHEN o estudante seleciona pagamento com cartão THEN o Sistema SHALL exibir as opções de parcelamento disponíveis (1x até 12x)
2. WHEN o estudante escolhe o número de parcelas THEN o Sistema SHALL calcular e exibir o valor de cada parcela
3. WHEN o estudante confirma o parcelamento THEN o Sistema SHALL criar uma sessão de checkout no Stripe com o parcelamento configurado
4. WHEN o pagamento parcelado é processado THEN o Sistema SHALL ativar a assinatura imediatamente
5. WHEN o estudante visualiza as parcelas THEN o Sistema SHALL exibir se há juros aplicados em cada opção

### Requirement 3

**User Story:** Como estudante, quero pagar à vista via PIX, para que eu possa obter desconto e ter confirmação instantânea do pagamento.

#### Acceptance Criteria

1. WHEN o estudante seleciona pagamento via PIX THEN o Sistema SHALL calcular e exibir o valor com desconto aplicado
2. WHEN o estudante confirma pagamento PIX THEN o Sistema SHALL gerar um QR Code e código copia e cola
3. WHEN o QR Code é gerado THEN o Sistema SHALL exibir o código visual e a string para copiar
4. WHEN o estudante copia o código PIX THEN o Sistema SHALL fornecer feedback visual de cópia bem-sucedida
5. WHEN o pagamento PIX é confirmado THEN o Sistema SHALL ativar a assinatura automaticamente
6. WHEN o estudante está aguardando confirmação THEN o Sistema SHALL exibir status de "Aguardando Pagamento" com timer de expiração

### Requirement 4

**User Story:** Como estudante, quero ver claramente as vantagens de cada forma de pagamento, para que eu possa tomar uma decisão informada.

#### Acceptance Criteria

1. WHEN o estudante visualiza as opções de pagamento THEN o Sistema SHALL exibir o percentual de desconto do PIX
2. WHEN o estudante compara as opções THEN o Sistema SHALL mostrar o valor total a pagar em cada modalidade
3. WHEN há desconto no PIX THEN o Sistema SHALL destacar a economia em reais
4. WHEN o estudante seleciona parcelamento THEN o Sistema SHALL indicar se há juros e o custo efetivo total
5. WHEN o estudante visualiza PIX THEN o Sistema SHALL informar que o pagamento é instantâneo

### Requirement 5

**User Story:** Como sistema, quero processar pagamentos PIX de forma segura e eficiente, para que os estudantes tenham uma experiência confiável.

#### Acceptance Criteria

1. WHEN um pagamento PIX é gerado THEN o Sistema SHALL criar uma cobrança com validade de 30 minutos
2. WHEN o pagamento PIX expira THEN o Sistema SHALL invalidar o QR Code e notificar o estudante
3. WHEN o pagamento PIX é confirmado THEN o Sistema SHALL receber webhook de confirmação
4. WHEN o webhook é recebido THEN o Sistema SHALL validar a assinatura e origem da requisição
5. WHEN o pagamento é confirmado THEN o Sistema SHALL atualizar o status da assinatura para 'active'
6. WHEN há erro no processamento THEN o Sistema SHALL registrar logs detalhados para auditoria

### Requirement 6

**User Story:** Como estudante, quero acompanhar o status do meu pagamento PIX em tempo real, para que eu saiba quando minha assinatura será ativada.

#### Acceptance Criteria

1. WHEN o estudante está na página de pagamento PIX THEN o Sistema SHALL fazer polling para verificar confirmação
2. WHEN o pagamento é confirmado THEN o Sistema SHALL redirecionar automaticamente para página de sucesso
3. WHEN o pagamento expira THEN o Sistema SHALL exibir opção para gerar novo QR Code
4. WHEN o estudante fecha a página THEN o Sistema SHALL enviar email com link para verificar status
5. WHEN o estudante retorna THEN o Sistema SHALL exibir o status atualizado do pagamento

### Requirement 7

**User Story:** Como administrador, quero configurar as opções de parcelamento e desconto PIX, para que eu possa ajustar as condições comerciais conforme necessário.

#### Acceptance Criteria

1. WHEN o administrador acessa configurações THEN o Sistema SHALL permitir definir número máximo de parcelas
2. WHEN o administrador configura parcelamento THEN o Sistema SHALL permitir definir se há juros por parcela
3. WHEN o administrador configura PIX THEN o Sistema SHALL permitir definir percentual de desconto
4. WHEN as configurações são salvas THEN o Sistema SHALL aplicar imediatamente aos novos checkouts
5. WHEN há mudança nas configurações THEN o Sistema SHALL registrar auditoria da alteração

### Requirement 8

**User Story:** Como estudante, quero ter uma experiência mobile-friendly ao pagar via PIX, para que eu possa facilmente escanear o QR Code com meu celular.

#### Acceptance Criteria

1. WHEN o estudante acessa pelo mobile THEN o Sistema SHALL exibir interface otimizada para tela pequena
2. WHEN o QR Code é exibido no mobile THEN o Sistema SHALL priorizar o botão "Copiar Código"
3. WHEN o estudante copia o código THEN o Sistema SHALL permitir abrir app do banco diretamente
4. WHEN o estudante está no desktop THEN o Sistema SHALL exibir QR Code em tamanho adequado para escaneamento
5. WHEN o layout é responsivo THEN o Sistema SHALL manter legibilidade em todas as resoluções
