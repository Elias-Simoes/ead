# Implementação: Aviso de Assinatura Vencida

## Visão Geral

Implementado sistema de avisos visuais para estudantes com assinatura vencida ou inativa, informando que o acesso aos cursos e avaliações está bloqueado até a renovação.

## Problema

Quando um estudante com assinatura vencida tentava acessar a plataforma:
- ❌ Não recebia nenhum aviso visual sobre o status da assinatura
- ❌ Só descobria o problema ao tentar acessar uma aula (erro 403)
- ❌ Não havia orientação clara sobre como renovar

## Solução Implementada

### 1. Atualização do AuthStore

**Arquivo**: `frontend/src/stores/authStore.ts`

Adicionado campos de assinatura na interface `User`:

```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'instructor' | 'student'
  subscriptionStatus?: 'active' | 'inactive' | 'suspended' | 'cancelled'
  subscriptionExpiresAt?: string
}
```

### 2. Componente de Aviso

**Arquivo**: `frontend/src/components/SubscriptionWarning.tsx`

Criado componente que:
- ✅ Verifica se o usuário é estudante
- ✅ Detecta assinatura inativa ou expirada
- ✅ Calcula dias desde a expiração
- ✅ Exibe aviso visual destacado
- ✅ Oferece botões de ação (Renovar / Ver Catálogo)

#### Lógica de Detecção

```typescript
// Não mostrar para admins e instrutores
if (!user || user.role !== 'student') {
  return null
}

// Verificar status
const isInactive = user.subscriptionStatus === 'inactive' || 
                   user.subscriptionStatus === 'cancelled'
const isExpired = user.subscriptionExpiresAt && 
                  new Date(user.subscriptionExpiresAt) < new Date()

if (!isInactive && !isExpired) {
  return null
}
```

#### Visual do Aviso

- **Cor**: Amarelo (warning)
- **Ícone**: Triângulo de alerta
- **Conteúdo**: 
  - Título: "Assinatura Expirada" ou "Assinatura Inativa"
  - Mensagem: Dias desde expiração + orientação
  - Ações: Botões para renovar ou ver catálogo

### 3. Integração nas Páginas

#### Página de Cursos

**Arquivo**: `frontend/src/pages/CoursesPage.tsx`

```typescript
import { SubscriptionWarning } from '../components/SubscriptionWarning'

// No render
<h1 className="text-3xl font-bold text-gray-900 mb-8">Cursos Disponíveis</h1>
<SubscriptionWarning />
<div className="bg-white rounded-lg shadow-md p-6 mb-8">
  {/* Search and Filter */}
</div>
```

#### Página de Detalhes do Curso

**Arquivo**: `frontend/src/pages/CourseDetailPage.tsx`

```typescript
import { SubscriptionWarning } from '../components/SubscriptionWarning'

// No render
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <SubscriptionWarning />
  {/* Course Header */}
</div>
```

## Fluxo de Experiência do Usuário

### Estudante com Assinatura Ativa ✅

1. Faz login
2. É redirecionado para `/courses`
3. **Não vê nenhum aviso**
4. Pode navegar e acessar cursos normalmente

### Estudante com Assinatura Vencida ⚠️

1. Faz login
2. É redirecionado para `/courses`
3. **Vê aviso amarelo destacado no topo**:
   ```
   ⚠️ Assinatura Expirada
   
   Sua assinatura expirou há X dias. Para continuar acessando 
   os cursos e avaliações, você precisa renovar sua assinatura.
   
   [Renovar Assinatura]  [Ver Catálogo]
   ```
4. Pode ver o catálogo de cursos (mas não acessar conteúdo)
5. Ao clicar em "Renovar Assinatura", vai para `/profile`
6. Ao tentar acessar uma aula, recebe erro 403 do backend

### Estudante com Assinatura Inativa ⚠️

1. Faz login
2. É redirecionado para `/courses`
3. **Vê aviso amarelo destacado no topo**:
   ```
   ⚠️ Assinatura Inativa
   
   Sua assinatura está inativa. Para continuar acessando 
   os cursos e avaliações, você precisa renovar sua assinatura.
   
   [Renovar Assinatura]  [Ver Catálogo]
   ```

## Mensagens por Situação

### Assinatura Expirada (com data)

```
Sua assinatura expirou há 5 dias. Para continuar acessando 
os cursos e avaliações, você precisa renovar sua assinatura.
```

### Assinatura Inativa (sem data)

```
Sua assinatura está inativa. Para continuar acessando 
os cursos e avaliações, você precisa renovar sua assinatura.
```

## Comportamento por Tipo de Usuário

| Tipo | Vê Aviso? | Pode Ver Catálogo? | Pode Acessar Aulas? |
|------|-----------|-------------------|---------------------|
| **Admin** | ❌ Não | ✅ Sim | ✅ Sim |
| **Instrutor** | ❌ Não | ✅ Sim | ✅ Sim (seus cursos) |
| **Estudante (ativo)** | ❌ Não | ✅ Sim | ✅ Sim |
| **Estudante (vencido)** | ✅ Sim | ✅ Sim | ❌ Não (403) |

## Arquivos Modificados

1. **frontend/src/stores/authStore.ts**
   - Adicionado `subscriptionStatus` e `subscriptionExpiresAt` na interface `User`

2. **frontend/src/components/SubscriptionWarning.tsx** (NOVO)
   - Componente de aviso de assinatura vencida

3. **frontend/src/pages/CoursesPage.tsx**
   - Importado e adicionado `<SubscriptionWarning />`

4. **frontend/src/pages/CourseDetailPage.tsx**
   - Importado e adicionado `<SubscriptionWarning />`

## Próximos Passos

### Backend

Para que o aviso funcione completamente, o backend precisa retornar os campos de assinatura no endpoint `/auth/me`:

```typescript
// src/modules/auth/controllers/auth.controller.ts
async getMe(req: Request, res: Response) {
  const user = await this.authService.getUserById(req.user.id)
  
  // Se for estudante, incluir informações de assinatura
  if (user.role === 'student') {
    const student = await this.studentService.getById(user.id)
    return res.json({
      ...user,
      subscriptionStatus: student.subscriptionStatus,
      subscriptionExpiresAt: student.subscriptionExpiresAt
    })
  }
  
  return res.json(user)
}
```

### Frontend - Outras Páginas

Adicionar o componente `<SubscriptionWarning />` em:
- ✅ CoursesPage
- ✅ CourseDetailPage
- 🔄 MyCoursesPage
- 🔄 LessonPlayerPage
- 🔄 ProfilePage

### Melhorias Futuras

1. **Aviso de Expiração Próxima**
   - Mostrar aviso 7 dias antes da expiração
   - Cor laranja ao invés de amarelo

2. **Link Direto para Pagamento**
   - Integrar com gateway de pagamento
   - Botão "Renovar Agora" leva direto ao checkout

3. **Histórico de Assinaturas**
   - Mostrar histórico de pagamentos
   - Permitir download de recibos

4. **Notificações por Email**
   - Email 7 dias antes da expiração
   - Email no dia da expiração
   - Email 3 dias após expiração

## Teste

### Testar Aviso de Assinatura Vencida

1. **Criar estudante com assinatura vencida**:
   ```bash
   node create-expired-subscription.js
   ```

2. **Fazer login como estudante**:
   - Email: `student@example.com`
   - Senha: `Student123!`

3. **Verificar**:
   - ✅ Aviso amarelo aparece no topo da página de cursos
   - ✅ Aviso mostra "Assinatura Expirada" ou "Assinatura Inativa"
   - ✅ Botões "Renovar Assinatura" e "Ver Catálogo" funcionam
   - ✅ Ao tentar acessar uma aula, recebe erro 403

### Testar Estudante com Assinatura Ativa

1. **Fazer login como estudante com assinatura ativa**:
   - Email: `student@example.com`
   - Senha: `Student123!`

2. **Verificar**:
   - ✅ Nenhum aviso aparece
   - ✅ Pode acessar cursos normalmente

## Referências

- Política de Assinaturas: `POLITICA_ASSINATURAS.md`
- Middleware de Assinatura: `src/shared/middleware/subscription.middleware.ts`
- Correção de Redirecionamento: `CORRECAO_REDIRECIONAMENTO_ESTUDANTE.md`

---
**Data**: 02/12/2025
**Status**: ✅ Implementado (Frontend) | 🔄 Pendente (Backend - retornar campos de assinatura)
