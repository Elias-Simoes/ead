# Correção - EditorJS Perdendo Dados dos Outros Campos

## Problema
Toda vez que o EditorJS atualizava (ao digitar no editor), os outros campos do formulário (título, descrição, vídeo URL, etc.) perdiam suas informações.

## Causa
O problema estava no `onChange` do EditorJS que usava uma **closure** capturando o valor antigo do estado:

```typescript
// ❌ ERRADO - Captura o valor antigo de lessonForm
onChange={(data) => setLessonForm({ ...lessonForm, textContent: data })}
```

### O que acontecia:
1. Usuário preenche o título: "Introdução ao React"
2. Usuário preenche a descrição: "Primeira aula"
3. Usuário começa a digitar no EditorJS
4. O `onChange` do EditorJS é chamado
5. Mas ele usa o valor de `lessonForm` de quando o componente foi renderizado
6. Resultado: título e descrição são perdidos!

## Solução
Usar a **forma funcional** do `setState` que recebe o estado anterior como parâmetro:

```typescript
// ✅ CORRETO - Usa o valor mais recente do estado
onChange={(data) => setLessonForm((prev) => ({ ...prev, textContent: data }))}
```

### Por que funciona:
- `setLessonForm((prev) => ...)` recebe o estado **mais recente**
- Não depende de closures
- Sempre preserva os outros campos

## Código Corrigido

### Antes:
```typescript
<EditorJSComponent
  data={lessonForm.textContent || undefined}
  onChange={(data) => setLessonForm({ ...lessonForm, textContent: data })}
/>
```

### Depois:
```typescript
<EditorJSComponent
  data={lessonForm.textContent || undefined}
  onChange={(data) => setLessonForm((prev) => ({ ...prev, textContent: data }))}
/>
```

## Teste
1. Preencha o título: "Teste de Aula"
2. Preencha a descrição: "Descrição da aula"
3. Preencha a duração: 30
4. Digite algo no EditorJS
5. ✅ Título, descrição e duração devem permanecer preenchidos

## Lição Aprendida
Sempre use a forma funcional do `setState` quando:
- O novo estado depende do estado anterior
- Você está dentro de um callback que pode ser chamado depois
- Você quer evitar problemas com closures

### Padrão Recomendado:
```typescript
// ✅ BOM
setState((prev) => ({ ...prev, newField: value }))

// ❌ EVITAR (pode causar bugs)
setState({ ...state, newField: value })
```

## Status
✅ Correção aplicada
✅ Frontend recarregado automaticamente
✅ Pronto para teste
