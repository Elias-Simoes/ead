# Correção: Erro ao Clicar em uma Aula

## Problema Identificado

Quando um estudante tentava clicar em uma aula para visualizá-la, recebia um erro 403 (Forbidden) com a mensagem:
```
An active subscription is required to access this content
```

## Causa Raiz

O sistema possui um middleware de verificação de assinatura (`requireActiveSubscription`) que bloqueia o acesso ao conteúdo das aulas para estudantes sem assinatura ativa.

O middleware verifica dois campos na tabela `students`:
- `subscription_status`: deve ser 'active'
- `subscription_expires_at`: data de expiração da assinatura

Quando um estudante é criado, esses campos não são preenchidos automaticamente, resultando em:
- `subscription_status`: 'inactive' (padrão)
- `subscription_expires_at`: NULL

## Solução Implementada

### 1. Script de Correção Criado

Criado o script `create-subscription-simple.js` que:

1. **Busca o estudante** no banco de dados
2. **Verifica/cria um plano** de assinatura
3. **Cria ou atualiza a assinatura** na tabela `subscriptions`
4. **Atualiza os campos de assinatura** na tabela `students`:
   - Define `subscription_status = 'active'`
   - Define `subscription_expires_at` para 1 ano no futuro

### 2. Execução

```bash
node create-subscription-simple.js
```

### 3. Resultado

Após executar o script:
- ✅ Assinatura ativa criada para o estudante
- ✅ Status atualizado na tabela students
- ✅ Estudante pode acessar o conteúdo das aulas
- ✅ Assinatura válida por 1 ano

## Verificação

O script `debug-lesson-click.js` foi usado para verificar que:
1. Login funciona corretamente
2. Cursos são listados
3. Detalhes do curso são carregados
4. **Conteúdo da aula é acessível** ✅

## Fluxo de Acesso a Aulas

```
1. Estudante faz login
   ↓
2. Navega para página do curso (/courses/:id)
   ↓
3. Clica em uma aula
   ↓
4. Rota: /courses/:courseId/lessons/:lessonId
   ↓
5. Frontend chama: GET /api/lessons/:lessonId/content
   ↓
6. Middleware verifica assinatura ativa
   ↓
7. Se ativa: retorna conteúdo da aula ✅
   Se inativa: retorna erro 403 ❌
```

## Middleware de Assinatura

Localização: `src/shared/middleware/subscription.middleware.ts`

O middleware implementa a seguinte lógica:

### Bypass de Assinatura (Sem Verificação)
- ✅ **Administradores** - Acesso total sem assinatura
- ✅ **Instrutores** - Acesso total sem assinatura

### Verificação de Assinatura (Obrigatória)
- ⚠️ **Estudantes** - Requer assinatura ativa
  - Verifica se status é 'active'
  - Verifica se não expirou
  - Bloqueia acesso se inativa ou expirada

### Justificativa
- **Admins** precisam visualizar cursos para aprovação
- **Instrutores** precisam acessar seus próprios cursos
- **Estudantes** pagam pela assinatura para acessar conteúdo

## Rotas Protegidas

As seguintes rotas requerem assinatura ativa **APENAS para estudantes**:
- `GET /api/lessons/:id/content` - Visualizar conteúdo da aula
- `POST /api/courses/:courseId/progress` - Marcar aula como concluída
- Outras rotas de progresso e certificados

**Nota:** Admins e instrutores têm acesso livre a todas essas rotas sem necessidade de assinatura.

## Para Novos Estudantes

Quando criar um novo estudante, execute:

```bash
node create-subscription-simple.js
```

Ou crie uma assinatura via API admin (quando disponível).

## Credenciais de Teste

### Estudante com Assinatura Ativa
- **Email**: student@example.com
- **Senha**: Student123!
- **Status**: ✅ Assinatura ativa até 22/11/2026

## Scripts Úteis

- `create-subscription-simple.js` - Cria/atualiza assinatura para estudante
- `debug-lesson-click.js` - Testa acesso completo a uma aula
- `create-student.js` - Cria novo estudante

## Próximos Passos

1. ✅ Problema resolvido - estudante pode acessar aulas
2. Considerar criar assinatura automaticamente no registro
3. Implementar página de gerenciamento de assinaturas no frontend
4. Adicionar notificações de expiração de assinatura

## Observações Importantes

### Política de Assinaturas por Papel
- ✅ **Admins** - Acesso total sem assinatura (para aprovação de cursos)
- ✅ **Instrutores** - Acesso total sem assinatura (para gerenciar seus cursos)
- ⚠️ **Estudantes** - Requerem assinatura ativa para acessar conteúdo

### Verificação de Assinatura
- A assinatura é verificada em cada requisição de conteúdo
- O sistema usa cache Redis para otimizar verificações
- Middleware: `requireActiveSubscription` em `src/shared/middleware/subscription.middleware.ts`

### Teste de Acesso
Execute os scripts de teste para verificar:
- `test-admin-lesson-access.js` - Testa acesso de admin (sem assinatura)
- `debug-lesson-click.js` - Testa acesso de estudante (com assinatura)
