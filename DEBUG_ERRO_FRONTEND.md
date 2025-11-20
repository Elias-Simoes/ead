# 🔍 Debug - Erro na Página de Avaliações

## ✅ Correções Aplicadas

1. **Adicionado Navbar** ao AssessmentFormPage
2. **Adicionado wrapper** com bg-gray-50 e min-h-screen
3. **Corrigido loading state** com Navbar

## 🧪 Como Verificar o Erro

### 1. Abrir Console do Navegador
```
F12 → Console
```

### 2. Verificar Erros
Procure por:
- ❌ Erros em vermelho
- ⚠️ Warnings em amarelo
- 🔵 Logs em azul

### 3. Erros Comuns

#### Erro: "Cannot read property 'id' of undefined"
**Causa**: courseId não está sendo passado corretamente
**Solução**: Verificar a URL e os parâmetros da rota

#### Erro: "Network Error" ou "404"
**Causa**: Backend não está rodando ou rota incorreta
**Solução**: 
```bash
# Verificar se backend está rodando
npm run dev
```

#### Erro: "Unauthorized" ou "401"
**Causa**: Token expirado ou não autenticado
**Solução**: Fazer login novamente

#### Erro: "Module not found"
**Causa**: Import incorreto
**Solução**: Verificar imports no arquivo

### 4. Verificar Rota

A URL deve ser:
```
http://localhost:5173/instructor/courses/[COURSE_ID]/assessments/new
```

Exemplo:
```
http://localhost:5173/instructor/courses/8f2e1d3c-4b5a-6789-0123-456789abcdef/assessments/new
```

### 5. Verificar Backend

Teste a rota da API:
```bash
# Testar criação de avaliação
node test-assessments-backend.js
```

## 🔧 Passos de Debug

### Passo 1: Verificar se Frontend está rodando
```bash
cd frontend
npm run dev
```

Deve mostrar:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Passo 2: Verificar se Backend está rodando
```bash
npm run dev
```

Deve mostrar:
```
Server running on port 3000
```

### Passo 3: Fazer Login
1. Acessar: http://localhost:5173/login
2. Email: instructor@example.com
3. Senha: Senha123!

### Passo 4: Navegar para Avaliações
1. Dashboard → Selecionar Curso
2. Clicar em "Avaliações"
3. Clicar em "+ Criar Avaliação"

### Passo 5: Verificar Console
- Abrir F12
- Ver se há erros
- Copiar mensagem de erro completa

## 📋 Checklist de Verificação

- [ ] Frontend rodando (porta 5173)
- [ ] Backend rodando (porta 3000)
- [ ] Logado como instrutor
- [ ] Console do navegador aberto
- [ ] URL correta com courseId válido
- [ ] Sem erros de compilação TypeScript

## 🐛 Possíveis Erros e Soluções

### Erro 1: Página em Branco
**Sintomas**: Página carrega mas não mostra nada
**Verificar**:
- Console do navegador (F12)
- Network tab para ver requisições
- Se há erro de autenticação

**Solução**:
```bash
# Limpar cache do navegador
Ctrl + Shift + Delete

# Ou fazer hard refresh
Ctrl + F5
```

### Erro 2: "Cannot GET /instructor/courses/..."
**Sintomas**: Erro 404 no frontend
**Causa**: Rota não configurada corretamente

**Solução**: Verificar se a rota está em App.tsx

### Erro 3: Componente não renderiza
**Sintomas**: Erro no console sobre componente
**Causa**: Import incorreto ou componente não exportado

**Solução**: Verificar exports e imports

### Erro 4: API retorna erro
**Sintomas**: Erro 400, 401, 403, 404, 500
**Causa**: Problema no backend

**Solução**:
```bash
# Ver logs do backend
npm run dev

# Testar API diretamente
node test-assessments-backend.js
```

## 📸 Como Reportar o Erro

Se o erro persistir, forneça:

1. **Mensagem de erro completa** do console
2. **URL** que está tentando acessar
3. **Screenshot** da tela
4. **Logs do backend** (se houver)
5. **Network tab** do navegador (F12 → Network)

### Exemplo de Relatório:
```
Erro: [copiar mensagem do console]
URL: http://localhost:5173/instructor/courses/xxx/assessments/new
Browser: Chrome 120
Status: Página em branco / Erro específico
```

## 🚀 Teste Rápido

Execute este comando para testar se tudo está funcionando:

```bash
# Teste completo do backend
node test-assessments-backend.js
```

Se o teste passar, o problema está no frontend.
Se o teste falhar, o problema está no backend.

## 💡 Dica

Abra o console ANTES de navegar para a página para capturar todos os erros desde o início.

---

**Aguardando informações sobre o erro específico para continuar o debug.**
