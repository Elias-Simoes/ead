# Playwright E2E Tests - Setup Completo ✅

## Status da Configuração

✅ **Playwright instalado** - @playwright/test  
✅ **Navegador Chromium instalado** - v143.0.7499.4  
✅ **Configuração criada** - playwright.config.ts  
✅ **Testes ativados** - 2 arquivos de teste com 36 casos de teste  

## Arquivos Criados

1. **playwright.config.ts** - Configuração do Playwright
   - Testes sequenciais (1 worker)
   - Suporte para desktop e mobile
   - Screenshots e vídeos em falhas
   - Retry automático no CI

2. **tests/e2e/checkout-card-installments.spec.ts** - 8 testes
   - Checkout com parcelamento
   - Validação de limites
   - Cálculo de parcelas
   - Tratamento de erros
   - Comparação de métodos

3. **tests/e2e/checkout-pix-payment.spec.ts** - 28 testes
   - Geração de QR Code PIX
   - Cópia de código
   - Confirmação de pagamento
   - Expiração e renovação
   - Layout mobile responsivo
   - Polling de status

## Como Executar os Testes

### Pré-requisitos

Os testes E2E precisam que os servidores estejam rodando:

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Executar Todos os Testes

```bash
# Executar todos os testes
npx playwright test

# Executar com interface visual
npx playwright test --ui

# Executar em modo debug
npx playwright test --debug
```

### Executar Testes Específicos

```bash
# Apenas testes de cartão
npx playwright test checkout-card-installments

# Apenas testes de PIX
npx playwright test checkout-pix-payment

# Teste específico por nome
npx playwright test -g "E2E-CHECKOUT-001"
```

### Executar em Navegadores Específicos

```bash
# Apenas Chrome
npx playwright test --project=chromium

# Apenas Mobile
npx playwright test --project=mobile-chrome

# Todos os projetos
npx playwright test --project=chromium --project=mobile-chrome
```

### Ver Relatório

```bash
# Gerar e abrir relatório HTML
npx playwright show-report
```

## Estrutura dos Testes

### Testes de Cartão (8 casos)

1. **E2E-CHECKOUT-001** - Checkout completo com 12 parcelas
2. **E2E-CHECKOUT-008** - Validação de limites de parcelamento
3. **Cálculo de parcelas** - Valores corretos para diferentes quantidades
4. **Parcelas sem juros** - Indicador de "sem juros"
5. **E2E-CHECKOUT-010** - Tratamento de falha de pagamento
6. **Validação de campos** - Campos obrigatórios
7. **E2E-CHECKOUT-006** - Comparação de métodos de pagamento
8. **Seleção de método** - Highlight do método selecionado

### Testes de PIX (28 casos)

**Fluxo Principal:**
1. **E2E-CHECKOUT-002** - Geração de QR Code
2. **E2E-CHECKOUT-003** - Cópia de código para clipboard
3. **E2E-CHECKOUT-004** - Confirmação e redirecionamento
4. **E2E-CHECKOUT-005** - Expiração e regeneração
5. **E2E-CHECKOUT-009** - Desconto configurável

**Mobile Responsivo (E2E-CHECKOUT-007):**
6. Layout otimizado para mobile
7. Botão de copiar com touch
8. Layout em landscape

**Polling de Status:**
9. Polling a cada 3 segundos
10. Parar polling após confirmação

## Configuração de Ambiente

### Variáveis de Ambiente

Crie um arquivo `.env.test` na raiz do projeto:

```env
# URLs dos servidores
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:4000

# Credenciais de teste
TEST_STUDENT_EMAIL=student-test@example.com
TEST_STUDENT_PASSWORD=Test123!

# Stripe (modo teste)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Dados de Teste

Os testes assumem que existem:
- Usuário estudante: `student-test@example.com`
- Plano Premium: R$ 99,90/mês
- Configuração de pagamento:
  - Máximo 12 parcelas
  - 10% desconto PIX
  - 30 minutos expiração PIX

## Resultado da Execução Atual

**Status:** ❌ Testes falharam (esperado)

**Motivo:** Servidores não estão rodando

**Testes Executados:** 36 testes iniciados

**Próximos Passos:**
1. Iniciar backend: `npm run dev`
2. Iniciar frontend: `cd frontend && npm run dev`
3. Executar testes novamente: `npx playwright test`

## Comandos Úteis

```bash
# Instalar navegadores adicionais
npx playwright install firefox
npx playwright install webkit

# Gerar código de teste
npx playwright codegen http://localhost:3000

# Executar teste específico em modo debug
npx playwright test checkout-card-installments --debug

# Executar apenas testes que falharam
npx playwright test --last-failed

# Executar com mais detalhes
npx playwright test --reporter=list --reporter=html

# Limpar cache de navegadores
npx playwright uninstall --all
npx playwright install
```

## Integração com CI/CD

### GitHub Actions

Adicione ao `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start backend
        run: npm run dev &
        
      - name: Start frontend
        run: cd frontend && npm run dev &
      
      - name: Wait for servers
        run: npx wait-on http://localhost:4000 http://localhost:3000
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Erro: "Target page, context or browser has been closed"
- Verifique se os servidores estão rodando
- Aumente o timeout nas configurações

### Erro: "Timeout waiting for selector"
- Verifique se os data-testid estão corretos no frontend
- Aumente o actionTimeout no playwright.config.ts

### Erro: "Navigation timeout"
- Verifique se as URLs estão corretas
- Verifique se os servidores estão acessíveis

### Testes lentos
- Use `--workers=1` para testes de pagamento
- Desabilite vídeos: `video: 'off'`
- Use headless mode (padrão)

## Próximas Melhorias

1. **Adicionar testes de API** - Testar endpoints diretamente
2. **Adicionar visual regression** - Comparar screenshots
3. **Adicionar testes de acessibilidade** - Validar WCAG
4. **Adicionar testes de performance** - Medir tempos de carregamento
5. **Adicionar testes de segurança** - Validar autenticação e autorização

## Documentação Adicional

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)

## Conclusão

✅ Playwright está completamente configurado e pronto para uso  
✅ 36 testes E2E criados cobrindo fluxos de cartão e PIX  
✅ Suporte para desktop e mobile  
✅ Configuração otimizada para CI/CD  

**Para executar:** Inicie os servidores e rode `npx playwright test`
