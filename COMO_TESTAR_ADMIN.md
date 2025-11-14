# 🚀 Como Testar as Páginas do Administrador

## Passo a Passo Rápido

### 1️⃣ Iniciar o Backend

Abra um terminal e execute:

```bash
npm run dev
```

Aguarde até ver a mensagem:
```
✓ Server running on port 3000
✓ Database connected
```

### 2️⃣ Iniciar o Frontend

Abra OUTRO terminal e execute:

```bash
cd frontend
npm run dev
```

Aguarde até ver:
```
  ➜  Local:   http://localhost:5173/
```

### 3️⃣ Testar os Endpoints (Opcional)

Em um TERCEIRO terminal, execute:

```bash
node test-admin-pages.js
```

Isso vai testar se os endpoints do backend estão respondendo corretamente.

### 4️⃣ Acessar o Frontend

1. Abra o navegador em: **http://localhost:5173**

2. Clique em **"Entrar"**

3. Use as credenciais do admin:
   - **Email:** `admin@example.com`
   - **Senha:** `Admin123!`

4. Após o login, você verá o menu com as opções de admin:
   - Dashboard
   - Instrutores
   - Aprovações
   - Assinaturas
   - Relatórios

### 5️⃣ Testar Cada Página

#### 📊 Dashboard (`/admin/dashboard`)
- Veja as métricas da plataforma
- Clique nos botões de ação rápida

#### 👥 Instrutores (`/admin/instructors`)
- Veja a lista de instrutores
- Clique em "Novo Instrutor" para criar um
- Teste suspender/reativar um instrutor

#### ✅ Aprovações (`/admin/courses/pending`)
- Veja cursos pendentes de aprovação
- Aprove ou rejeite um curso
- *Nota: Você precisa criar um curso como instrutor primeiro*

#### 💳 Assinaturas (`/admin/subscriptions`)
- Veja estatísticas de assinaturas
- Filtre por status (Ativas, Suspensas, Canceladas)
- Navegue pelas páginas

#### 📈 Relatórios (`/admin/reports`)
- Selecione o tipo de relatório
- Ajuste o período (data início/fim)
- Teste exportar CSV e PDF

---

## 🎯 Teste Rápido Visual

Se você só quer ver as páginas funcionando visualmente:

1. **Inicie backend e frontend** (passos 1 e 2 acima)

2. **Faça login como admin** (passo 4 acima)

3. **Navegue pelas páginas:**
   - http://localhost:5173/admin/dashboard
   - http://localhost:5173/admin/instructors
   - http://localhost:5173/admin/courses/pending
   - http://localhost:5173/admin/subscriptions
   - http://localhost:5173/admin/reports

4. **Verifique:**
   - ✅ As páginas carregam sem erros
   - ✅ O layout está correto
   - ✅ Os componentes são responsivos
   - ✅ Os botões e links funcionam

---

## ⚠️ Possíveis Problemas

### Problema: "Cannot GET /api/admin/..."

**Causa:** Endpoint não implementado no backend ainda

**Solução:** Algumas rotas admin podem não estar implementadas. As páginas do frontend estão prontas, mas dependem dos endpoints do backend.

**O que fazer:**
- As páginas vão mostrar estados de loading ou erro
- Isso é esperado se o endpoint não existe
- Você pode implementar os endpoints faltantes depois

### Problema: "401 Unauthorized"

**Causa:** Token expirado ou usuário não é admin

**Solução:**
1. Faça logout e login novamente
2. Verifique se o usuário tem role 'admin':
   ```bash
   node scripts/create-admin.js
   ```

### Problema: Página em branco

**Causa:** Erro de JavaScript no console

**Solução:**
1. Abra o DevTools (F12)
2. Veja o console para erros
3. Verifique se o build está atualizado:
   ```bash
   cd frontend
   npm run build
   ```

---

## 📋 Checklist de Teste Mínimo

Marque conforme testa:

- [ ] Backend está rodando (porta 3000)
- [ ] Frontend está rodando (porta 5173)
- [ ] Consegui fazer login como admin
- [ ] Menu de admin aparece no topo
- [ ] Dashboard carrega (mesmo com dados vazios)
- [ ] Página de instrutores carrega
- [ ] Página de aprovações carrega
- [ ] Página de assinaturas carrega
- [ ] Página de relatórios carrega
- [ ] Não há erros no console do navegador

---

## 🎨 O Que Você Deve Ver

### Dashboard
![Dashboard com 8 cards de métricas e botões de ação rápida]

### Instrutores
![Tabela com lista de instrutores e botão "Novo Instrutor"]

### Aprovações
![Lista de cursos pendentes com botões Aprovar/Rejeitar]

### Assinaturas
![Cards de estatísticas + tabela com filtros e paginação]

### Relatórios
![Filtros de tipo e data + cards de métricas + botões de exportar]

---

## 🔧 Comandos Úteis

```bash
# Ver logs do backend
npm run dev

# Ver logs do frontend
cd frontend && npm run dev

# Testar endpoints
node test-admin-pages.js

# Criar usuário admin
node scripts/create-admin.js

# Build do frontend
cd frontend && npm run build

# Verificar erros TypeScript
cd frontend && npm run type-check
```

---

## 📚 Documentação Completa

Para um guia detalhado de todos os testes:
- **TESTE_ADMIN_PAGES_GUIA.md** - Guia completo de testes
- **TASK_15.5_ADMIN_PAGES_SUMMARY.md** - Resumo da implementação

---

## ✅ Pronto!

Se você conseguiu:
1. ✅ Fazer login como admin
2. ✅ Ver o menu de admin
3. ✅ Acessar qualquer página admin sem erro 404
4. ✅ Ver os componentes renderizando

**Então está tudo funcionando!** 🎉

As páginas estão prontas. Alguns dados podem não aparecer se os endpoints do backend não estiverem implementados, mas isso é esperado e pode ser feito depois.
