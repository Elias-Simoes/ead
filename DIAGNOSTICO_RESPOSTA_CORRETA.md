# Diagnóstico: Problema com Resposta Correta

## 🔍 Investigação Realizada

### 1. Verificação no Banco de Dados

✅ **DADOS ESTÃO CORRETOS NO BANCO**

Executei query direta no PostgreSQL e confirmei:

```
Questão 1 (Avaliação de Teste):
- Texto: "Qual é a capital do Brasil?"
- Tipo: multiple_choice
- Opções: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"]
- Resposta Correta: 2 (NUMBER) ✅
- Opção correspondente: "Brasília" ✅

Questão 2 (Avaliação de Teste):
- Texto: "Quanto é 2 + 2?"
- Tipo: multiple_choice
- Opções: ["3", "4", "5", "6"]
- Resposta Correta: 1 (NUMBER) ✅
- Opção correspondente: "4" ✅
```

**Conclusão Parcial**: O backend está salvando corretamente no banco de dados.

### 2. Estrutura da Tabela

```
Tabela: questions
- id: uuid
- assessment_id: uuid
- text: text
- type: character varying
- options: jsonb (ARRAY)
- correct_answer: integer ✅
- points: numeric
- order_index: integer
```

**Observação**: O campo `correct_answer` é do tipo `integer`, que é correto para armazenar o índice da opção correta.

### 3. Tentativa de Teste da API

❌ **NÃO FOI POSSÍVEL TESTAR A API DIRETAMENTE**

Motivo: Problema de autorização ao tentar acessar as avaliações via API.

```
GET /api/assessments/:id
Status: 401 Unauthorized
```

O controller `getAssessment` verifica se o instrutor é dono do curso antes de retornar os dados. Como não conseguimos autenticar corretamente com o instrutor que possui as avaliações, não foi possível verificar se a API está serializando os dados corretamente.

## 🎯 Próximos Passos Sugeridos

### Opção 1: Testar via Frontend (Recomendado)

1. Abrir o navegador em http://localhost:5173
2. Fazer login com `instructor@example.com` / `Senha123!`
3. Navegar até a página de edição de avaliação
4. Abrir o DevTools (F12) → Aba Network
5. Editar uma questão e salvar
6. Verificar a requisição PATCH e a resposta
7. Verificar se `correctAnswer` está sendo enviado e retornado corretamente

### Opção 2: Adicionar Logs Temporários no Backend

Adicionar logs no `assessment.service.ts` para ver o que está sendo retornado:

```typescript
async getAssessmentWithQuestions(assessmentId: string) {
  const result = await pool.query(/* ... */);
  console.log('🔍 DEBUG - Questions from DB:', JSON.stringify(result.rows, null, 2));
  return result;
}
```

### Opção 3: Verificar o Mapeamento no Service

Verificar se o service está mapeando corretamente o campo `correct_answer` do banco para `correctAnswer` no JSON de resposta.

## 📊 Resumo

| Item | Status | Observação |
|------|--------|------------|
| Banco de Dados | ✅ OK | Dados salvos corretamente |
| Tipo do Campo | ✅ OK | `integer` é adequado |
| Valores Salvos | ✅ OK | Índices corretos (0, 1, 2, etc) |
| API Response | ❓ Não testado | Problema de autenticação |
| Frontend Display | ❓ Não testado | Aguardando teste da API |

## 🤔 Hipóteses

### Hipótese 1: Problema no Mapeamento (Backend)
O service pode não estar mapeando `correct_answer` → `correctAnswer` corretamente.

### Hipótese 2: Problema no Frontend
O frontend pode estar recebendo os dados corretamente mas não exibindo/usando adequadamente.

### Hipótese 3: Problema na Serialização
O campo pode estar sendo perdido durante a serialização JSON.

## 💡 Recomendação

**Teste manual via frontend** é a forma mais rápida de identificar onde está o problema:

1. Se o Network tab mostrar `correctAnswer: 2` na resposta → problema é no frontend
2. Se o Network tab mostrar `correctAnswer: null` → problema é no backend
3. Se o Network tab não mostrar o campo → problema é no mapeamento do service

---

**Próxima ação**: Você pode testar manualmente no frontend ou posso adicionar logs temporários no backend para debug?
