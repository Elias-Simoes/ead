# Módulo de Relatórios - Referência Rápida

## 📍 Endpoints

### 1. Relatório Geral
```
GET /api/admin/reports/overview
```
Retorna visão geral com métricas de assinaturas, cursos, alunos e certificados.

### 2. Relatório de Assinaturas
```
GET /api/admin/reports/subscriptions
```
Retorna detalhes de assinaturas, breakdown por plano e tendências.

### 3. Relatório de Cursos
```
GET /api/admin/reports/courses
```
Retorna estatísticas de cursos, mais acessados e distribuição por categoria.

### 4. Relatório Financeiro
```
GET /api/admin/reports/financial
```
Retorna métricas financeiras, MRR, receita e dados do gateway de pagamento.

### 5. Exportar Relatório
```
GET /api/admin/reports/export?format={csv|pdf}&type={overview|subscriptions|courses|financial}
```
Exporta relatório no formato especificado.

## 🔑 Autenticação

Todos os endpoints requerem:
- Header: `Authorization: Bearer {token}`
- Role: `admin`

## 📅 Filtros de Data (Opcionais)

Adicione aos endpoints de relatórios:
```
?startDate=2025-01-01&endDate=2025-01-31
```

## 💡 Exemplos Rápidos

### Obter Overview
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/admin/reports/overview
```

### Exportar Financeiro em PDF
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/admin/reports/export?format=pdf&type=financial" \
  --output report.pdf
```

### Relatório com Período
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/admin/reports/financial?startDate=2025-01-01&endDate=2025-01-31"
```

## 📊 Estrutura de Dados

### Overview
- subscriptions: métricas de assinaturas
- courses: estatísticas de cursos
- students: dados de alunos
- certificates: certificados emitidos

### Subscriptions
- totalSubscriptions, activeSubscriptions, etc.
- subscriptionsByPlan: array de planos
- subscriptionTrend: tendência temporal

### Courses
- totalCourses, publishedCourses
- mostAccessedCourses: top cursos
- coursesByCategory: distribuição

### Financial
- totalRevenue, mrr, projectedMRR
- revenueByPlan: receita por plano
- gatewayData: dados do Stripe

## 🧪 Teste Rápido

```bash
node test-reports.js
```

## 📁 Arquivos Principais

- `src/modules/reports/services/metrics.service.ts` - Cálculo de métricas
- `src/modules/reports/services/report.service.ts` - Geração de relatórios
- `src/modules/reports/services/export.service.ts` - Exportação CSV/PDF
- `src/modules/reports/services/gateway-integration.service.ts` - Integração Stripe
- `src/modules/reports/controllers/report.controller.ts` - Controlador
- `src/modules/reports/routes/report.routes.ts` - Rotas

## 🔧 Configuração Necessária

### .env
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Banco de Dados
- Tabelas: subscriptions, payments, courses, students, certificates
- Dados: pelo menos algumas assinaturas e cursos para testes

## ⚡ Performance

- Queries otimizadas com agregações SQL
- Tempo de resposta típico: < 1s
- Exportações: < 2s para volumes normais

## 🛡️ Segurança

- Autenticação JWT obrigatória
- Apenas role 'admin' tem acesso
- Validação de parâmetros de entrada
- Tratamento de erros adequado

## 📈 Métricas Disponíveis

### Assinaturas
- Total de assinantes ativos
- Novos assinantes no período
- Taxa de retenção
- Taxa de churn
- MRR (Monthly Recurring Revenue)

### Cursos
- Total de cursos publicados
- Cursos mais acessados
- Taxa de conclusão
- Progresso médio

### Financeiro
- Receita total
- Receita no período
- MRR atual e projetado
- Receita média por usuário
- Dados do gateway (Stripe)

## 🎯 Casos de Uso

1. **Dashboard Administrativo**: Overview para visão geral
2. **Análise de Churn**: Subscription report com filtros de data
3. **Performance de Cursos**: Course report para identificar top performers
4. **Análise Financeira**: Financial report com dados do gateway
5. **Relatórios Mensais**: Export em PDF para apresentações
6. **Análise de Dados**: Export em CSV para análise em planilhas

## 🔄 Fluxo Típico

1. Admin faz login → recebe token
2. Acessa dashboard → chama `/overview`
3. Analisa métricas específicas → chama endpoints detalhados
4. Exporta relatório → chama `/export` com formato desejado
5. Compartilha arquivo gerado

## ✅ Status Codes

- `200` - Sucesso
- `400` - Parâmetros inválidos
- `401` - Não autenticado
- `403` - Sem permissão (não é admin)
- `500` - Erro interno

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique logs do servidor
2. Consulte TESTE_RELATORIOS_GUIA.md
3. Execute test-reports.js para diagnóstico
4. Verifique TASK_10_REPORTS_SUMMARY.md para detalhes
