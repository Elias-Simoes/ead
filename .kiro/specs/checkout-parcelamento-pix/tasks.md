# Implementation Plan

- [ ] 1. Criar migração de banco de dados para suporte a PIX e parcelamento
  - Criar tabela `pix_payments` com campos: id, student_id, plan_id, amount, discount, final_amount, qr_code, copy_paste_code, status, expires_at, paid_at, gateway_charge_id, gateway_response, created_at, updated_at
  - Criar tabela `payment_config` com campos: id, max_installments, pix_discount_percent, installments_without_interest, pix_expiration_minutes, created_at, updated_at
  - Adicionar colunas à tabela `payments`: payment_method, installments, pix_payment_id
  - Criar índices necessários para performance
  - Inserir configuração padrão: 12 parcelas, 10% desconto PIX, 30min expiração
  - _Requirements: 5.1, 7.1, 7.2, 7.3_

- [ ] 2. Implementar serviço de configuração de pagamentos
  - [ ] 2.1 Criar PaymentConfigService com métodos getConfig() e updateConfig()
    - Implementar cache de configurações em memória
    - Validar valores mínimos e máximos
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 2.2 Escrever testes de propriedade para configurações
    - **Property 7: Configurações afetam novos checkouts**
    - **Validates: Requirements 7.4**
  
  - [ ] 2.3 Criar endpoint GET /api/payments/config
    - Retornar configurações atuais
    - Cachear resposta por 5 minutos
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 2.4 Criar endpoint PUT /api/admin/payments/config (admin only)
    - Validar permissões de administrador
    - Atualizar configurações
    - Registrar auditoria
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 3. Expandir StripeService para suportar PIX e parcelamento
  - [ ] 3.1 Adicionar método createCheckoutWithPaymentOptions()
    - Aceitar parâmetros: paymentMethod ('card' | 'pix'), installments
    - Configurar payment_method_types baseado na escolha
    - Configurar installments para cartão
    - Retornar sessionId e checkoutUrl
    - _Requirements: 1.3, 2.1, 2.3, 3.2_
  
  - [ ] 3.2 Escrever testes de propriedade para parcelamento
    - **Property 2: Parcelamento calcula valores corretos**
    - **Validates: Requirements 2.2, 2.5**
  
  - [ ] 3.3 Escrever testes de propriedade para limite de parcelas
    - **Property 8: Parcelamento respeita limite configurado**
    - **Validates: Requirements 2.1, 7.1**
  
  - [ ] 3.4 Adicionar método getPaymentIntentDetails()
    - Buscar detalhes do PaymentIntent
    - Extrair informações de parcelamento
    - _Requirements: 2.4_

- [ ] 4. Implementar PixPaymentService
  - [ ] 4.1 Criar PixPaymentService com método createPixPayment()
    - Calcular desconto baseado em configuração
    - Criar PaymentIntent Stripe com method_types: ['pix']
    - Extrair QR Code e código copia-e-cola
    - Salvar em pix_payments table
    - Retornar dados completos do pagamento
    - _Requirements: 3.1, 3.2, 3.3, 5.1_
  
  - [ ] 4.2 Escrever testes de propriedade para desconto PIX
    - **Property 1: Desconto PIX é aplicado corretamente**
    - **Validates: Requirements 3.1, 4.1, 4.3**
  
  - [ ] 4.3 Escrever testes de propriedade para unicidade de QR Code
    - **Property 6: QR Code é único por pagamento**
    - **Validates: Requirements 3.2, 3.3**
  
  - [ ] 4.4 Criar método checkPixPaymentStatus()
    - Consultar status no Stripe
    - Atualizar status local se mudou
    - Retornar status atualizado
    - _Requirements: 6.1, 6.3_
  
  - [ ] 4.5 Escrever testes de propriedade para polling
    - **Property 5: Polling detecta confirmação de pagamento**
    - **Validates: Requirements 6.1, 6.2**
  
  - [ ] 4.6 Criar job de expiração de pagamentos PIX
    - Rodar a cada 5 minutos
    - Buscar pagamentos pending com expires_at < now
    - Marcar como expired
    - Cancelar no Stripe se necessário
    - _Requirements: 5.2, 6.3_
  
  - [ ] 4.7 Escrever testes de propriedade para expiração
    - **Property 3: Pagamento PIX expira após tempo configurado**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 5. Atualizar PaymentController e rotas
  - [ ] 5.1 Atualizar POST /api/payments/checkout
    - Aceitar paymentMethod e installments no body
    - Validar número de parcelas contra configuração
    - Rotear para Stripe ou PIX baseado no método
    - _Requirements: 1.2, 2.1, 3.1_
  
  - [ ] 5.2 Criar GET /api/payments/pix/:paymentId/status
    - Validar que paymentId pertence ao usuário
    - Retornar status atualizado
    - _Requirements: 6.1, 6.2_
  
  - [ ] 5.3 Atualizar webhook handler para processar PIX
    - Detectar eventos pix.payment_intent.succeeded
    - Atualizar pix_payments status para 'paid'
    - Ativar assinatura do estudante
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [ ] 5.4 Escrever testes de propriedade para webhook PIX
    - **Property 4: Webhook PIX ativa assinatura**
    - **Validates: Requirements 5.3, 5.4, 5.5**

- [ ] 6. Checkpoint - Garantir que backend está funcionando
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Criar componente PaymentMethodSelector (Frontend)
  - [ ] 7.1 Implementar UI de seleção entre Cartão e PIX
    - Cards lado a lado com ícones
    - Destacar desconto PIX visualmente
    - Mostrar vantagens de cada método
    - Estado selecionado com borda destacada
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_
  
  - [ ] 7.2 Criar componente PaymentComparison
    - Tabela comparativa: Cartão vs PIX
    - Mostrar valor total, parcelas, desconto
    - Calcular e exibir economia em reais
    - Design responsivo
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. Criar componente CardPaymentForm (Frontend)
  - [ ] 8.1 Implementar seletor de parcelas
    - Dropdown com opções 1x até 12x
    - Calcular e exibir valor de cada parcela
    - Indicar "sem juros" quando aplicável
    - Mostrar valor total
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [ ] 8.2 Implementar botão de confirmação
    - Chamar API para criar checkout Stripe
    - Mostrar loading durante processamento
    - Redirecionar para Stripe Checkout
    - Tratar erros de validação
    - _Requirements: 2.3, 2.4_

- [ ] 9. Criar componente PixPaymentForm (Frontend)
  - [ ] 9.1 Implementar exibição de valor com desconto
    - Mostrar valor original riscado
    - Destacar valor com desconto em verde
    - Exibir percentual de economia
    - _Requirements: 3.1, 4.1, 4.3_
  
  - [ ] 9.2 Implementar geração e exibição de QR Code
    - Chamar API para gerar pagamento PIX
    - Renderizar QR Code como imagem
    - Exibir código copia-e-cola
    - Botão "Copiar Código" com feedback visual
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ] 9.3 Implementar timer de expiração
    - Countdown visual mostrando tempo restante
    - Alerta quando faltarem 5 minutos
    - Opção de gerar novo QR Code quando expirar
    - _Requirements: 5.1, 5.2, 6.3_
  
  - [ ] 9.4 Implementar polling de status
    - Iniciar polling após gerar QR Code
    - Verificar status a cada 3 segundos
    - Usar exponential backoff após 1 minuto
    - Parar polling quando pago ou expirado
    - Redirecionar para success quando confirmado
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 9.5 Implementar UI responsiva para mobile
    - Priorizar botão "Copiar" em mobile
    - QR Code em tamanho adequado
    - Botão para abrir app do banco
    - Layout otimizado para telas pequenas
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10. Criar nova CheckoutPage (Frontend)
  - [ ] 10.1 Implementar layout principal
    - Header com informações do plano
    - Seção de seleção de método de pagamento
    - Área para formulário de pagamento
    - Resumo do pedido lateral (desktop)
    - _Requirements: 1.1, 1.4_
  
  - [ ] 10.2 Integrar componentes de pagamento
    - Renderizar PaymentMethodSelector
    - Renderizar CardPaymentForm ou PixPaymentForm baseado na seleção
    - Gerenciar estado global da página
    - Tratar erros e loading states
    - _Requirements: 1.2, 1.3_
  
  - [ ] 10.3 Implementar busca de configurações
    - Carregar configurações ao montar componente
    - Usar configurações para limitar parcelas
    - Calcular desconto PIX dinamicamente
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 11. Atualizar SubscriptionRenewPage
  - [ ] 11.1 Redirecionar para nova CheckoutPage
    - Ao clicar em "Renovar", ir para /checkout/:planId
    - Passar dados do plano via route state
    - Manter compatibilidade com fluxo antigo
    - _Requirements: 1.1_

- [ ] 12. Criar página de administração de configurações de pagamento
  - [ ] 12.1 Implementar PaymentConfigPage (admin)
    - Formulário para editar max_installments
    - Formulário para editar pix_discount_percent
    - Formulário para editar installments_without_interest
    - Formulário para editar pix_expiration_minutes
    - Validações de valores mínimos/máximos
    - Botão salvar com confirmação
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 13. Implementar notificações por email
  - [ ] 13.1 Email de pagamento PIX pendente
    - Enviar após gerar QR Code
    - Incluir link para verificar status
    - Incluir código copia-e-cola
    - _Requirements: 6.4_
  
  - [ ] 13.2 Email de pagamento PIX confirmado
    - Enviar após confirmação
    - Incluir detalhes da assinatura ativada
    - _Requirements: 6.2_
  
  - [ ] 13.3 Email de pagamento PIX expirado
    - Enviar quando expirar
    - Incluir link para gerar novo pagamento
    - _Requirements: 6.3_

- [ ] 14. Adicionar logging e monitoramento
  - [ ] 14.1 Implementar logs estruturados
    - Log de criação de pagamento PIX
    - Log de confirmação de pagamento
    - Log de expiração de pagamento
    - Log de erros de webhook
    - _Requirements: 5.6_
  
  - [ ] 14.2 Criar dashboard de métricas
    - Taxa de conversão por método
    - Distribuição de parcelas
    - Tempo médio de confirmação PIX
    - Taxa de expiração PIX
    - Valor médio de desconto utilizado
    - _Requirements: 7.5_

- [ ] 15. Testes de integração e E2E
  - [ ] 15.1 Testes de integração backend
    - Fluxo completo de pagamento cartão parcelado
    - Fluxo completo de pagamento PIX
    - Webhook confirmando pagamento PIX
    - Expiração de pagamento PIX
    - Atualização de configurações
  
  - [ ] 15.2 Testes E2E com Playwright
    - Usuário seleciona plano e escolhe cartão parcelado
    - Usuário seleciona plano e escolhe PIX
    - Usuário copia código PIX
    - Pagamento PIX é confirmado e redireciona
    - Pagamento PIX expira e usuário gera novo

- [ ] 16. Documentação e deploy
  - [ ] 16.1 Atualizar documentação da API
    - Documentar novos endpoints
    - Exemplos de request/response
    - Códigos de erro
  
  - [ ] 16.2 Criar guia de configuração Stripe
    - Como habilitar PIX no Stripe
    - Como configurar parcelamento
    - Como testar em modo sandbox
  
  - [ ] 16.3 Deploy em staging
    - Rodar migrações
    - Configurar variáveis de ambiente
    - Testar fluxos completos
  
  - [ ] 16.4 Deploy em produção
    - Feature flag para rollout gradual
    - Monitorar métricas
    - Rollback plan documentado

- [ ] 17. Checkpoint Final - Garantir que tudo está funcionando
  - Ensure all tests pass, ask the user if questions arise.
