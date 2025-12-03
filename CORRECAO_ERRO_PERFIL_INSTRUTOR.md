# Correção: Erro ao Clicar no Nome do Usuário (Instrutor)

## Problema Identificado

Quando um usuário logado como **instrutor** clicava no próprio nome no menu, recebia o erro:
```
You do not have permission to access this resource
```

## Causa Raiz

A página de perfil (`ProfilePage.tsx`) estava sempre tentando acessar a rota `/api/students/profile`, independentemente do role do usuário logado.

### Logs do Backend:
```json
{
  "userId": "5a6b6086-5a53-43c9-9113-267462cfe5bd",
  "role": "instructor",
  "requiredRoles": ["student"],
  "path": "/profile",
  "statusCode": 403
}
```

O sistema bloqueava o acesso porque:
- Usuário tinha role: **instructor**
- Rota exigia role: **student**

## Solução Implementada

### 1. Detecção do Role do Usuário
Adicionado import do `useAuthStore` para acessar o role do usuário:

```typescript
import { useAuthStore } from '../stores/authStore'

export const ProfilePage = () => {
  const { user } = useAuthStore()
  // ...
}
```

### 2. Função para Determinar Endpoint Correto
Criada função que retorna o endpoint apropriado baseado no role:

```typescript
const getProfileEndpoint = () => {
  if (user?.role === 'student') {
    return '/students/profile'
  } else if (user?.role === 'instructor') {
    return '/instructors/profile'
  } else if (user?.role === 'admin') {
    return '/admin/profile'
  }
  return '/students/profile' // fallback
}
```

### 3. Validação de Acesso
Como apenas estudantes têm página de perfil completa no sistema atual, adicionada validação:

```typescript
const fetchProfile = async () => {
  try {
    // Apenas estudantes têm página de perfil completa
    if (user?.role !== 'student') {
      setError('Página de perfil disponível apenas para estudantes')
      setLoading(false)
      return
    }
    // ...
  }
}
```

### 4. Mensagem Amigável com Redirecionamento
Quando um instrutor ou admin acessa a página de perfil, agora vê uma mensagem amigável com botão para ir ao dashboard apropriado:

**Para Instrutores:**
- Mensagem: "Como instrutor, você pode gerenciar suas informações através do Dashboard do Instrutor."
- Botão: "Ir para Dashboard do Instrutor"

**Para Admins:**
- Mensagem: "Como administrador, você pode gerenciar suas informações através do Dashboard Admin."
- Botão: "Ir para Dashboard Admin"

## Arquivos Modificados

### 1. `frontend/src/pages/ProfilePage.tsx`
- Adicionado import do `useAuthStore`
- Criada função `getProfileEndpoint()`
- Adicionada validação de role
- Melhorada mensagem de erro com redirecionamento

### 2. `frontend/src/components/Navbar.tsx`
- **Removido link clicável de perfil** para instrutores e admins
- Link de perfil agora **aparece apenas para estudantes**
- Para instrutores e admins, o nome aparece como texto simples (não clicável)

## Resultado

✅ **Link de perfil removido do menu** para instrutores e admins - o nome aparece como texto simples

✅ **Estudantes** continuam vendo o link clicável para acessar sua página de perfil

✅ **Sem mais erros 403** - instrutores e admins não podem mais clicar no nome

✅ **Melhor UX** - fica claro visualmente que instrutores/admins não têm página de perfil

## Observação

A solução atual é temporária e funcional. Para uma solução mais completa, seria ideal:

1. Criar rotas de perfil específicas para instructors e admins no backend
2. Criar páginas de perfil dedicadas para cada role
3. Ou criar uma página de perfil genérica que se adapta ao role do usuário

---
**Data**: 02/12/2025
**Status**: ✅ Resolvido
