# Guia de Teste - Módulo de Relatórios Administrativos

## 🎯 Objetivo

Este guia fornece instruções passo a passo para testar o módulo de relatórios administrativos da Plataforma EAD.

## 📋 Pré-requisitos

1. **Servidor rodando**
   ```bash
   npm run dev
   ```

2. **Banco de dados configurado** com:
   - Usuário admin criado
   - Alguns cursos publicados
   - Algumas assinaturas ativas
   - Alguns pagamentos registrados

3. **Variáveis de ambiente configuradas** (.env):
   ```
   DATABASE_URL=postgresql://...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## 🚀 Execução Rápida

### Opção 1: Script de Teste Automatizado

```bash
node test-reports.js
```

Este script executa todos os testes automaticamente e exibe os resultados no console.

### Opção 2: Testes Manuais com cURL

Siga os exemplos abaixo para testar cada endpoint individualmente.

## 📝 Testes Detalhados

### 1. Autenticação Admin

Primeiro, obtenha um token de admin:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@plataforma.com",
    "password": "Admin@123"
  }'
```

**Resposta esperada:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "email": "admin@plataforma.com",
    "name": "Admin",
    "role": "admin"
  }
}
```

Salve o `accessToken` para usar nos próximos testes.

### 2. Teste: Relatório Geral (Overview)

```bash
curl -X GET http://localhost:3000/api/admin/reports/overview \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "subscriptions": {
    "totalActive": 150,
    "newInPeriod": 25,
    "retentionRate": 92.5,
    "churnRate": 7.5,
    "mrr": 14850.00
  },
  "courses": {
    "totalPublished": 45,
    "totalInProgress": 12,
    "totalCompleted": 320
  },
  "students": {
    "totalActive": 150,
    "totalStudyTime": 45600
  },
  "certificates": {
    "totalIssued": 280,
    "issuedInPeriod": 35
  }
}
```

**Validações:**
- Status: 200 OK
- Todas as métricas devem estar presentes
- Valores numéricos devem ser >= 0

### 3. Teste: Relatório de Assinaturas

```bash
curl -X GET http://localhost:3000/api/admin/reports/subscriptions \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "totalSubscriptions": 200,
  "activeSubscriptions": 150,
  "suspendedSubscriptions": 30,
  "cancelledSubscriptions": 20,
  "subscriptionsByPlan": [
    {
      "planId": "...",
      "planName": "Plano Mensal",
      "count": 150,
      "revenue": 14850.00
    }
  ],
  "subscriptionTrend": [
    {
      "date": "2025-01-15",
      "newSubscriptions": 5,
      "cancelledSubscriptions": 1
    }
  ]
}
```

**Validações:**
- Status: 200 OK
- Total = ativas + suspensas + canceladas
- Array de planos não vazio (se houver assinaturas)

### 4. Teste: Relatório de Cursos

```bash
curl -X GET http://localhost:3000/api/admin/reports/courses \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "totalCourses": 57,
  "publishedCourses": 45,
  "mostAccessedCourses": [
    {
      "courseId": "...",
      "courseTitle": "Introdução ao JavaScript",
      "instructorName": "João Silva",
      "totalAccesses": 120,
      "totalCompletions": 85,
      "completionRate": 70.83,
      "averageProgress": 78.5
    }
  ],
  "coursesByCategory": [
    {
      "category": "Programação",
      "count": 25
    }
  ]
}
```

**Validações:**
- Status: 200 OK
- publishedCourses <= totalCourses
- completionRate entre 0 e 100

### 5. Teste: Relatório Financeiro

```bash
curl -X GET http://localhost:3000/api/admin/reports/financial \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "totalRevenue": 125000.00,
  "revenueInPeriod": 14850.00,
  "mrr": 14850.00,
  "averageRevenuePerUser": 99.00,
  "revenueByPlan": [
    {
      "planId": "...",
      "planName": "Plano Mensal",
      "revenue": 14850.00,
      "subscribers": 150
    }
  ],
  "revenueTrend": [
    {
      "date": "2025-01-15",
      "revenue": 495.00
    }
  ],
  "projectedMRR": 13736.25,
  "gatewayData": {
    "totalPaymentsFromGateway": 150,
    "totalRevenueFromGateway": 14850.00,
    "successfulPayments": 145,
    "failedPayments": 5,
    "refundedPayments": 2,
    "averageTransactionValue": 99.00,
    "paymentSuccessRate": 96.67,
    "refundRate": 1.38
  }
}
```

**Validações:**
- Status: 200 OK
- totalRevenue >= revenueInPeriod
- paymentSuccessRate entre 0 e 100
- Dados do gateway presentes (se Stripe configurado)

### 6. Teste: Relatório com Filtro de Data

```bash
curl -X GET "http://localhost:3000/api/admin/reports/overview?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Validações:**
- Status: 200 OK
- Métricas devem refletir apenas o período especificado
- newInPeriod deve considerar apenas o período

### 7. Teste: Exportação CSV

```bash
curl -X GET "http://localhost:3000/api/admin/reports/export?format=csv&type=overview" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  --output overview-report.csv
```

**Validações:**
- Status: 200 OK
- Arquivo CSV criado
- Content-Type: text/csv
- Arquivo contém dados em formato CSV válido

**Verificar arquivo:**
```bash
cat overview-report.csv
```

### 8. Teste: Exportação PDF

```bash
curl -X GET "http://localhost:3000/api/admin/reports/export?format=pdf&type=financial" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  --output financial-report.pdf
```

**Validações:**
- Status: 200 OK
- Arquivo PDF criado
- Content-Type: application/pdf
- Arquivo pode ser aberto em visualizador de PDF

### 9. Teste: Controle de Acesso (Negativo)

Tente acessar relatórios sem token:

```bash
curl -X GET http://localhost:3000/api/admin/reports/overview
```

**Resposta esperada:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Validação:**
- Status: 401 Unauthorized

Tente acessar com token de estudante:

```bash
# Primeiro, faça login como estudante
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "Student@123"
  }'

# Depois, tente acessar relatórios
curl -X GET http://localhost:3000/api/admin/reports/overview \
  -H "Authorization: Bearer TOKEN_DO_ESTUDANTE"
```

**Resposta esperada:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

**Validação:**
- Status: 403 Forbidden

### 10. Teste: Validação de Parâmetros

Tente exportar com formato inválido:

```bash
curl -X GET "http://localhost:3000/api/admin/reports/export?format=xml&type=overview" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "error": {
    "code": "INVALID_FORMAT",
    "message": "Format must be either csv or pdf"
  }
}
```

**Validação:**
- Status: 400 Bad Request

## 📊 Cenários de Teste Avançados

### Cenário 1: Período sem Dados

Teste com período futuro (sem dados):

```bash
curl -X GET "http://localhost:3000/api/admin/reports/overview?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Validação:**
- Status: 200 OK
- Métricas devem retornar 0 ou valores vazios

### Cenário 2: Múltiplas Exportações

Execute várias exportações em sequência:

```bash
# CSV Overview
curl -X GET "http://localhost:3000/api/admin/reports/export?format=csv&type=overview" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  --output overview.csv

# CSV Subscriptions
curl -X GET "http://localhost:3000/api/admin/reports/export?format=csv&type=subscriptions" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  --output subscriptions.csv

# PDF Financial
curl -X GET "http://localhost:3000/api/admin/reports/export?format=pdf&type=financial" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  --output financial.pdf
```

**Validação:**
- Todos os arquivos devem ser criados corretamente
- Sem erros de memória ou timeout

## 🐛 Troubleshooting

### Erro: "STRIPE_SECRET_KEY is not configured"

**Solução:** Configure a chave do Stripe no arquivo .env:
```
STRIPE_SECRET_KEY=sk_test_...
```

Se não tiver Stripe configurado, os relatórios ainda funcionarão, mas sem dados do gateway.

### Erro: "Failed to connect to database"

**Solução:** Verifique se o PostgreSQL está rodando e as credenciais no .env estão corretas.

### Erro: "Admin authentication failed"

**Solução:** Crie um usuário admin usando o script:
```bash
node scripts/create-admin.js
```

### Relatórios retornam dados vazios

**Solução:** Certifique-se de que há dados no banco:
- Assinaturas criadas
- Cursos publicados
- Pagamentos registrados

Use os scripts de teste existentes para popular dados:
```bash
node create-test-subscriptions.js
node setup-test-assessments.js
```

## ✅ Checklist de Validação

- [ ] Relatório overview retorna dados corretos
- [ ] Relatório de assinaturas mostra breakdown por plano
- [ ] Relatório de cursos lista cursos mais acessados
- [ ] Relatório financeiro inclui dados do gateway
- [ ] Exportação CSV funciona para todos os tipos
- [ ] Exportação PDF funciona para todos os tipos
- [ ] Filtros de data funcionam corretamente
- [ ] Controle de acesso bloqueia não-admins
- [ ] Validação de parâmetros funciona
- [ ] Performance é aceitável (< 2s para relatórios)

## 📈 Métricas de Sucesso

- ✅ Todos os endpoints retornam 200 OK para admin
- ✅ Todos os endpoints retornam 403 para não-admin
- ✅ Exportações geram arquivos válidos
- ✅ Dados do gateway são integrados corretamente
- ✅ Filtros de data funcionam como esperado
- ✅ Sem erros no console do servidor

## 🎉 Conclusão

Se todos os testes passarem, o módulo de relatórios está funcionando corretamente e pronto para uso em produção!
