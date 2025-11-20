# Correção - EditorJS Não Carrega Conteúdo ao Editar

## Problema
Ao clicar em "Editar" uma aula existente, o conteúdo do texto não aparecia no EditorJS.

## Causa
O EditorJS tinha dois `useEffect`:
1. **Primeiro** - Inicializava o editor com `data` (dependência vazia `[]`)
2. **Segundo** - Tentava renderizar quando `data` mudava

O problema é que o primeiro `useEffect` só executava uma vez (na montagem do componente), e o segundo `useEffect` não funcionava corretamente porque tentava chamar `render()` em um editor já inicializado.

### Código Antigo (❌ Errado):
```typescript
useEffect(() => {
  // Inicializa editor apenas uma vez
  if (!editorRef.current) {
    const editor = new EditorJS({
      data: data,  // Usa data inicial
      // ...
    })
    editorRef.current = editor
  }
  return () => { /* cleanup */ }
}, []) // ❌ Dependência vazia - só executa uma vez

// Tentava atualizar depois
useEffect(() => {
  if (editorRef.current && data) {
    editorRef.current.render(data) // ❌ Não funcionava bem
  }
}, [data])
```

## Solução
Remover o segundo `useEffect` e adicionar `data` como dependência do primeiro. Isso faz o EditorJS ser **reinicializado** sempre que `data` mudar (quando carregar uma aula para editar).

### Código Novo (✅ Correto):
```typescript
useEffect(() => {
  if (!holderRef.current) return

  // Inicializar o editor apenas uma vez
  if (!editorRef.current) {
    const editor = new EditorJS({
      holder: holderRef.current,
      data: data,  // Usa data atual
      // ...
    })
    editorRef.current = editor
  }

  // Cleanup
  return () => {
    if (editorRef.current && editorRef.current.destroy) {
      editorRef.current.destroy()
      editorRef.current = null
    }
  }
}, [data]) // ✅ Reinicializa quando data muda
```

## Como Funciona Agora

### Cenário 1: Criar Nova Aula
1. Componente monta com `data = undefined`
2. EditorJS inicializa vazio
3. Usuário digita
4. Funciona! ✅

### Cenário 2: Editar Aula Existente
1. Componente monta com `data = undefined`
2. EditorJS inicializa vazio
3. API retorna dados da aula
4. `data` muda para o conteúdo da aula
5. `useEffect` detecta mudança em `data`
6. EditorJS é destruído e reinicializado com os dados
7. Conteúdo aparece! ✅

## Teste

1. Crie uma aula com texto no EditorJS
2. Salve a aula
3. Volte para lista de aulas
4. Clique em "Editar" na aula criada
5. ✅ O conteúdo deve aparecer no EditorJS

## Nota Técnica

A prop `key={lessonId || 'new-lesson'}` no `LessonFormPage` também ajuda, pois força a recriação do componente quando muda de aula, mas a dependência `[data]` no `useEffect` é essencial para garantir que o editor seja reinicializado com os dados corretos.

## Status
✅ Correção aplicada
✅ Frontend recarregado
✅ Pronto para teste
