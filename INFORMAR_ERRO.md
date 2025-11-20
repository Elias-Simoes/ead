# ❓ Como Informar o Erro

## 🔍 Preciso das Seguintes Informações:

### 1. Qual é a mensagem de erro?
Abra o console do navegador (F12) e copie a mensagem de erro completa.

**Exemplo:**
```
Uncaught TypeError: Cannot read property 'id' of undefined
    at AssessmentFormPage.tsx:25
```

### 2. Qual URL você está acessando?
**Exemplo:**
```
http://localhost:5173/instructor/courses/8f2e1d3c-4b5a-6789-0123-456789abcdef/assessments/new
```

### 3. O que acontece na tela?
- [ ] Página em branco
- [ ] Erro visível na tela
- [ ] Loading infinito
- [ ] Outro: ___________

### 4. Quando o erro acontece?
- [ ] Ao carregar a página
- [ ] Ao clicar em "Criar Avaliação"
- [ ] Ao preencher o formulário
- [ ] Ao salvar
- [ ] Outro: ___________

### 5. O backend está rodando?
```bash
npm run dev
```
- [ ] Sim, está rodando
- [ ] Não está rodando
- [ ] Não sei

### 6. O frontend está rodando?
```bash
cd frontend && npm run dev
```
- [ ] Sim, está rodando na porta 5173
- [ ] Não está rodando
- [ ] Não sei

## 📸 Screenshots (Opcional)

Se possível, tire screenshots de:
1. Console do navegador (F12 → Console)
2. Network tab (F12 → Network)
3. Tela com o erro

## 🧪 Teste Rápido

Execute este comando e me diga o resultado:

```bash
node test-assessments-backend.js
```

**Resultado:**
- [ ] ✅ Todos os testes passaram
- [ ] ❌ Algum teste falhou
- [ ] ⚠️ Erro ao executar

---

## 📝 Formato de Resposta

Por favor, responda assim:

```
1. Mensagem de erro: [copiar do console]
2. URL: [copiar da barra de endereço]
3. O que acontece: [descrever]
4. Quando acontece: [descrever]
5. Backend rodando: Sim/Não
6. Frontend rodando: Sim/Não
7. Teste backend: Passou/Falhou
```

---

**Com essas informações, posso identificar e corrigir o problema rapidamente!**
