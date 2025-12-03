# Teste: Link da Aula

## Objetivo

Verificar por que o link da aula não está funcionando quando você clica nele.

## Preparação

1. Certifique-se de que o frontend está rodando:
   ```bash
   cd frontend
   npm run dev
   ```

2. Certifique-se de que o backend está rodando

3. Limpe o cache do navegador:
   - Pressione Ctrl+Shift+Delete
   - Selecione "Imagens e arquivos em cache"
   - Clique em "Limpar dados"

## Teste 1: Verificar Console

1. Abra o navegador em http://localhost:5173
2. Pressione F12 para abrir DevTools
3. Vá para a aba "Console"
4. Faça login como estudante:
   - Email: student@example.com
   - Senha: Student123!

5. Navegue para um curso
6. **Clique em uma aula**
7. Observe o console - você deve ver:
   ```
   Clicou na aula: [nome da aula]
   URL da aula: /courses/[id]/lessons/[id]
   ID do curso: [id]
   ID da aula: [id]
   ```

8. **Copie TUDO que aparecer no console** e me envie

## Teste 2: Navegação Direta

1. Copie esta URL:
   ```
   http://localhost:5173/courses/226b34e0-2556-41bc-bac8-a39682237545/lessons/dab75cc6-fe54-4a98-aab3-88fb5b3d8ba3
   ```

2. Cole no navegador e pressione Enter

3. O que acontece?
   - [ ] A página da aula abre normalmente
   - [ ] Aparece uma página de erro
   - [ ] A página fica em branco
   - [ ] Redireciona para outra página

4. Se aparecer erro, **copie o erro completo**

## Teste 3: Verificar Link HTML

1. Na página do curso, clique com o botão direito em uma aula
2. Selecione "Inspecionar elemento" (ou "Inspect")
3. Você deve ver algo como:
   ```html
   <a href="/courses/[id]/lessons/[id]" class="...">
   ```

4. O elemento `<a>` está presente? (Sim/Não)
5. Qual é o valor do atributo `href`?

## Teste 4: Verificar se o Clique Funciona

1. Na página do curso, com o DevTools aberto
2. Vá para a aba "Elements" (Elementos)
3. Clique em uma aula
4. O elemento `<a>` fica destacado/selecionado? (Sim/Não)

## Teste 5: Testar com Botão "Iniciar Curso"

1. Na página do curso, clique no botão "Iniciar Curso" (ou "Continuar Curso")
2. Esse botão funciona? (Sim/Não)
3. Se sim, ele te leva para a primeira aula?

## Resultados Esperados

### Se o console mostrar os logs:
✅ O clique está funcionando
✅ O problema pode ser na navegação do React Router

### Se o console NÃO mostrar os logs:
❌ O clique não está sendo registrado
❌ Pode haver um elemento sobrepondo o link

### Se a navegação direta funcionar:
✅ A página LessonPlayerPage está funcionando
✅ O problema é apenas no link

### Se a navegação direta NÃO funcionar:
❌ Há um problema na página LessonPlayerPage
❌ Pode ser erro de autenticação ou permissão

## Próximos Passos

Depois de executar esses testes, me envie:

1. ✅ Todos os logs do console
2. ✅ O que aconteceu no Teste 2 (navegação direta)
3. ✅ Se o elemento `<a>` está presente (Teste 3)
4. ✅ Se o botão "Iniciar Curso" funciona (Teste 5)

Com essas informações, poderei identificar exatamente o problema e fornecer a correção.
