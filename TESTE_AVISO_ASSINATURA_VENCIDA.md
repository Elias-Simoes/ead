# Guia de Teste: Aviso de Assinatura Vencida

## 🎯 Objetivo

Verificar se o aviso de assinatura vencida aparece corretamente no frontend para estudantes com assinatura expirada.

## 📋 Pré-requisitos

1. Backend rodando em `http://localhost:3000`
2. Frontend rodando em `http://localhost:5173`
3. Usuário de teste criado (executar se necessário):
   ```bash
   node create-expired-student.js
   ```

## 🧪 Teste 1: Verificar Backend

Execute o script de teste:
```bash
node test-subscription-warning.js
```

**Resultado esperado:**
```
✓ SUCESSO: O aviso de assinatura vencida DEVE aparecer!
  - O backend está retornando os dados corretos
  - A lógica do componente deve detectar a expiração
```

## 🌐 Teste 2: Verificar Frontend

### Passo 1: Limpar Cache do Navegador
1. Abra o DevTools (F12)
2. Vá em Application > Storage
3. Clique em "Clear site data"
4. Recarregue a página

### Passo 2: Fazer Login
1. Acesse http://localhost:5173
2. Clique em "Entrar"
3. Use as credenciais:
   - **Email:** expired@example.com
   - **Senha:** Expired123!
4. Clique em "Entrar"

### Passo 3: Verificar Redirecionamento
- Você deve ser redirecionado automaticamente para `/courses`

### Passo 4: Verificar Aviso
Você deve ver um **banner amarelo** no topo da página com:

```
⚠️ Assinatura Expirada

Sua assinatura expirou há 30 dias. Para continuar acessando 
os cursos e avaliações, você precisa renovar sua assinatura.

[Renovar Assinatura]  [Ver Catálogo]
```

### Passo 5: Verificar em Outras Páginas
1. Clique em qualquer curso
2. O aviso também deve aparecer na página de detalhes do curso

## 🔍 Debug: Se o Aviso NÃO Aparecer

### 1. Verificar Console do Navegador
Abra o DevTools (F12) e vá na aba Console. Procure por erros.

### 2. Verificar Estado do AuthStore
No console do navegador, digite:
```javascript
// Verificar se há token
localStorage.getItem('accessToken')

// Verificar dados do usuário (se usando Zustand DevTools)
// Ou inspecione o componente no React DevTools
```

### 3. Verificar Dados do Usuário
Execute o script de debug:
```bash
node debug-subscription-warning-frontend.js
```

Este script mostra:
- Dados retornados pelo `/auth/login`
- Dados retornados pelo `/auth/me`
- Análise da lógica do componente
- Checklist de verificação

### 4. Verificar Componente
Verifique se o componente está sendo renderizado:
1. Abra React DevTools
2. Procure por `SubscriptionWarning`
3. Verifique as props:
   - `user.role` deve ser "student"
   - `user.subscriptionStatus` deve ser "inactive"
   - `user.subscriptionExpiresAt` deve estar no passado

## 🐛 Problemas Comuns

### Problema 1: "Invalid credentials"
**Solução:** Execute `node create-expired-student.js` para criar o usuário

### Problema 2: "Rate limit exceeded"
**Solução:** Execute `node clear-rate-limit.js`

### Problema 3: Aviso não aparece mas dados estão corretos
**Possíveis causas:**
- Componente não importado na página
- Erro de renderização (verificar console)
- Cache do navegador (limpar e recarregar)

### Problema 4: Dados de assinatura não estão no user
**Solução:** 
- Verifique se o `authStore.ts` foi atualizado corretamente
- O método `login()` deve chamar `/auth/me` após o login
- Recarregue o frontend (Ctrl+R no terminal do Vite)

## ✅ Checklist de Sucesso

- [ ] Backend retorna `subscriptionStatus` e `subscriptionExpiresAt` no `/auth/me`
- [ ] Login redireciona para `/courses`
- [ ] Banner amarelo aparece no topo da página
- [ ] Banner mostra "Assinatura Expirada"
- [ ] Banner mostra "expirou há X dias"
- [ ] Botões "Renovar Assinatura" e "Ver Catálogo" estão presentes
- [ ] Banner também aparece na página de detalhes do curso

## 📊 Resultado Esperado

### Visual do Banner

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Assinatura Expirada                                     │
│                                                              │
│ Sua assinatura expirou há 30 dias. Para continuar          │
│ acessando os cursos e avaliações, você precisa renovar     │
│ sua assinatura.                                             │
│                                                              │
│ [Renovar Assinatura]  [Ver Catálogo]                       │
└─────────────────────────────────────────────────────────────┘
```

### Cores
- Fundo: Amarelo claro (#FEF3C7)
- Borda esquerda: Amarelo (#F59E0B)
- Texto: Amarelo escuro (#92400E)
- Ícone: Amarelo (#F59E0B)

## 🎓 Testando com Outros Cenários

### Cenário 1: Assinatura Ativa
1. Faça login com um estudante com assinatura ativa
2. O aviso **NÃO** deve aparecer

### Cenário 2: Usuário Instrutor
1. Faça login como instrutor
2. O aviso **NÃO** deve aparecer (mesmo que tenha assinatura vencida)

### Cenário 3: Usuário Admin
1. Faça login como admin
2. O aviso **NÃO** deve aparecer

## 📝 Notas

- O aviso só aparece para usuários com `role: 'student'`
- O aviso aparece se `subscriptionStatus` for 'inactive' ou 'cancelled'
- O aviso também aparece se `subscriptionExpiresAt` estiver no passado
- O cálculo de dias é feito automaticamente pelo componente
- Os botões redirecionam para `/profile` e `/courses`

## 🔗 Arquivos Relacionados

- `frontend/src/components/SubscriptionWarning.tsx` - Componente do aviso
- `frontend/src/stores/authStore.ts` - Store de autenticação (CORRIGIDO)
- `frontend/src/pages/CoursesPage.tsx` - Página que exibe o aviso
- `frontend/src/pages/CourseDetailPage.tsx` - Página que exibe o aviso
- `src/modules/auth/controllers/auth.controller.ts` - Endpoint `/auth/me`

## 📞 Suporte

Se o aviso ainda não aparecer após seguir todos os passos:
1. Execute `node debug-subscription-warning-frontend.js`
2. Verifique o console do navegador
3. Verifique o React DevTools
4. Revise o arquivo `CORRECAO_AVISO_ASSINATURA_VENCIDA.md`
