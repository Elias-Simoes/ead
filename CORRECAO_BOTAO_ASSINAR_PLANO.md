# Correção: Botão "Assinar Plano" vs "Renovar Assinatura"

## Problema Identificado

O usuário recém-cadastrado (Elias Simoes) estava vendo o botão **"Renovar Assinatura"** quando deveria ver **"Assinar Plano"**, pois nunca teve uma assinatura.

## Análise do Problema

### Status do Usuário Elias:
- ✅ Cadastrado com sucesso
- ❌ `subscriptionStatus: 'inactive'`
- ❌ `subscriptionExpiresAt: null`
- ❌ Nenhuma assinatura na tabela `subscriptions`
- ❌ Nenhum pagamento realizado

### Lógica Anterior (Incorreta):
```typescript
const isExpiredSubscription = user?.role === 'student' && 
  (user?.subscriptionStatus === 'inactive' || user?.subscriptionStatus === 'cancelled')
```

**Problema**: Não distinguia entre usuário novo e usuário com assinatura expirada.

## Solução Implementada

### Nova Lógica:
```typescript
// Verificar se o usuário tem assinatura ativa ou expirada
const isExpiredSubscription = user?.role === 'student' && 
  (user?.subscriptionStatus === 'inactive' || user?.subscriptionStatus === 'cancelled')

// Verificar se é um usuário novo (nunca teve assinatura) ou se já teve assinatura
const isNewUser = user?.role === 'student' && 
  user?.subscriptionStatus === 'inactive' && 
  !user?.subscriptionExpiresAt
```

### Lógica do Botão:
```typescript
// Botão dinâmico baseado no tipo de usuário
<button
  onClick={() => navigate(isNewUser ? '/plans' : '/subscription/renew')}
  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-md font-medium inline-flex items-center justify-center"
>
  {isNewUser ? 'Assinar Plano' : 'Renovar Assinatura'}
</button>
```

### Mensagens Personalizadas:
```typescript
{isNewUser 
  ? 'Sua assinatura está inativa. Para continuar acessando os cursos e avaliações, você precisa renovar sua assinatura. Acesse a página de cursos para renovar.'
  : user?.subscriptionStatus === 'cancelled' 
    ? 'Sua assinatura foi cancelada. Para acessar os cursos, você precisa renovar sua assinatura.'
    : 'Sua assinatura expirou. Para continuar acessando os cursos, você precisa renovar sua assinatura.'
}
```

## Cenários Cobertos

### 1. Usuário Novo (Como Elias)
- **Status**: `inactive`
- **Expires At**: `null`
- **Botão**: "Assinar Plano"
- **Destino**: `/plans`
- **Mensagem**: "Sua assinatura está inativa..."

### 2. Usuário com Assinatura Expirada
- **Status**: `inactive`
- **Expires At**: `data no passado`
- **Botão**: "Renovar Assinatura"
- **Destino**: `/subscription/renew`
- **Mensagem**: "Sua assinatura expirou..."

### 3. Usuário com Assinatura Cancelada
- **Status**: `cancelled`
- **Expires At**: `qualquer valor`
- **Botão**: "Renovar Assinatura"
- **Destino**: `/subscription/renew`
- **Mensagem**: "Sua assinatura foi cancelada..."

## Fluxo Correto Agora

### Para Usuário Novo (Elias):
1. **Cadastro** ✅
2. **Login automático** ✅
3. **Página de cursos** ✅
4. **Botão "Assinar Plano"** ✅ (CORRIGIDO)
5. **Redirecionamento para /plans** ✅
6. **Escolha do plano e pagamento**
7. **Ativação da assinatura**

### Para Usuário com Assinatura Expirada:
1. **Login** ✅
2. **Página de cursos** ✅
3. **Botão "Renovar Assinatura"** ✅
4. **Redirecionamento para /subscription/renew** ✅
5. **Renovação da assinatura**

## Arquivos Modificados

- `frontend/src/pages/CoursesPage.tsx` - Lógica corrigida para distinguir usuários novos

## Como Testar

### 1. Usuário Novo (Elias):
- Acesse: http://localhost:5173/courses
- Deve mostrar: "Assinar Plano"
- Ao clicar: deve ir para `/plans`

### 2. Usuário com Assinatura Expirada:
- Crie um usuário com assinatura expirada
- Acesse: http://localhost:5173/courses
- Deve mostrar: "Renovar Assinatura"
- Ao clicar: deve ir para `/subscription/renew`

## Resultado

✅ **Usuários novos**: Veem "Assinar Plano" e vão para página de planos  
✅ **Usuários com assinatura expirada**: Veem "Renovar Assinatura" e vão para renovação  
✅ **Mensagens personalizadas**: Cada tipo de usuário recebe mensagem apropriada  
✅ **UX melhorada**: Fluxo mais claro e intuitivo para cada situação