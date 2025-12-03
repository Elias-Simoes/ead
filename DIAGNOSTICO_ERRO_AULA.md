# Diagnóstico: Erro ao Clicar em Aula

## Problema Observado

Quando você clica em uma aula, um modal/popup aparece mas há erros 404 no console do navegador.

## O que já verificamos

✅ Backend está funcionando corretamente
✅ API retorna o conteúdo da aula sem erros
✅ Middleware de assinatura está funcionando
✅ Estudante tem assinatura ativa

## Possíveis Causas

### 1. Links Externos Quebrados no Conteúdo
Os erros 404 para URLs como `https://localhost:5008/...` sugerem que há links externos no conteúdo da aula que não existem.

### 2. Recursos Estáticos Não Encontrados
Pode haver referências a arquivos CSS, JS ou fontes que não existem.

### 3. Problema de Roteamento no Frontend
O modal pode estar tentando carregar recursos com URLs incorretas.

## Como Diagnosticar

### Passo 1: Verificar Console do Navegador

1. Abra o navegador (Chrome/Edge/Firefox)
2. Pressione F12 para abrir DevTools
3. Vá para a aba "Console"
4. Clique em uma aula
5. **Copie TODOS os erros que aparecem no console**

### Passo 2: Verificar Aba Network

1. No DevTools, vá para a aba "Network" (Rede)
2. Clique em uma aula
3. Observe quais requisições estão falhando (status 404)
4. **Anote as URLs completas que estão falhando**

### Passo 3: Verificar Conteúdo da Aula

Execute este comando para ver o conteúdo da aula:

\`\`\`bash
node debug-lesson-frontend.js
\`\`\`

Verifique se há URLs estranhas no conteúdo.

## Informações Necessárias

Para eu poder ajudar melhor, preciso que você me forneça:

1. **Erros do Console** (texto completo)
   - Exemplo: "GET https://localhost:5008/... 404 (Not Found)"

2. **URLs que estão falhando** (da aba Network)
   - Quais recursos estão retornando 404?

3. **Screenshot da aba Network** mostrando as requisições falhando

4. **Tipo de aula** que você está tentando abrir
   - É uma aula de vídeo, PDF, texto ou link externo?

## Testes Rápidos

### Teste 1: Verificar se o modal abre
```
1. Faça login como estudante
2. Vá para um curso
3. Clique em uma aula
4. O modal abre? (Sim/Não)
5. Você consegue ver algum conteúdo? (Sim/Não)
```

### Teste 2: Verificar diferentes tipos de aula
```
1. Tente abrir uma aula de TEXTO
2. Tente abrir uma aula de VÍDEO (se houver)
3. Tente abrir uma aula de PDF (se houver)
4. Qual delas funciona? Qual não funciona?
```

### Teste 3: Verificar como admin
```
1. Faça login como admin
2. Vá para um curso
3. Clique em uma aula
4. O erro acontece também? (Sim/Não)
```

## Soluções Possíveis

### Se o problema for links externos quebrados:

1. Editar a aula e remover/corrigir os links
2. Ou ignorar os erros (não afetam a funcionalidade)

### Se o problema for recursos estáticos:

1. Verificar se o Vite está rodando corretamente
2. Limpar cache do navegador (Ctrl+Shift+Delete)
3. Reiniciar o servidor frontend

### Se o problema for roteamento:

1. Verificar se a rota `/courses/:courseId/lessons/:lessonId` está configurada
2. Verificar se o componente LessonPlayerPage está sendo renderizado

## Comandos Úteis

### Reiniciar Frontend
\`\`\`bash
# Parar o servidor (Ctrl+C)
# Limpar cache
npm run clean  # ou rm -rf node_modules/.vite

# Reinstalar e iniciar
cd frontend
npm install
npm run dev
\`\`\`

### Verificar Logs do Backend
\`\`\`bash
# No terminal onde o backend está rodando
# Observe se há erros quando você clica na aula
\`\`\`

### Limpar Cache do Navegador
\`\`\`
1. Pressione Ctrl+Shift+Delete
2. Selecione "Imagens e arquivos em cache"
3. Clique em "Limpar dados"
4. Recarregue a página (Ctrl+F5)
\`\`\`

## Próximos Passos

Por favor, execute os testes acima e me forneça:

1. ✅ Erros completos do console
2. ✅ URLs que estão falhando
3. ✅ Tipo de aula que está tentando abrir
4. ✅ Se o modal abre ou não
5. ✅ Se consegue ver algum conteúdo

Com essas informações, poderei identificar exatamente qual é o problema e fornecer uma solução específica.
