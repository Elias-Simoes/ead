# Correção: Tela Vazia de Cursos

## Problema

Quando um aluno acessa `/courses` e não há cursos disponíveis (ou a busca não retorna resultados), a página mostrava apenas uma mensagem simples "Nenhum curso encontrado", sem um design amigável.

## Solução Implementada

Criei um estado vazio (empty state) bonito e informativo que:

### Características

1. **Ícone Visual** - Ícone de livro grande e amigável
2. **Mensagem Contextual** - Mensagens diferentes para:
   - Quando não há cursos no sistema
   - Quando a busca/filtro não retorna resultados
3. **Botão de Ação** - Quando há filtros ativos, mostra botão para limpar
4. **Design Responsivo** - Funciona bem em mobile e desktop

### Mensagens

#### Sem Cursos no Sistema
```
Título: "Ainda não há cursos disponíveis"
Descrição: "Novos cursos serão adicionados em breve. Volte mais tarde para conferir!"
```

#### Busca Sem Resultados
```
Título: "Nenhum curso encontrado"
Descrição: "Tente ajustar seus filtros de busca ou explorar outras categorias."
Ação: Botão "Limpar Filtros"
```

## Código Implementado

### Estado Vazio Bonito

```tsx
<div className="bg-white rounded-lg shadow-md p-12 text-center">
  {/* Ícone de livro */}
  <svg className="mx-auto h-24 w-24 text-gray-400 mb-6">
    {/* SVG path */}
  </svg>
  
  {/* Título contextual */}
  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
    {searchTerm || selectedCategory
      ? 'Nenhum curso encontrado'
      : 'Ainda não há cursos disponíveis'}
  </h3>
  
  {/* Descrição contextual */}
  <p className="text-gray-600 mb-6 max-w-md mx-auto">
    {searchTerm || selectedCategory
      ? 'Tente ajustar seus filtros de busca ou explorar outras categorias.'
      : 'Novos cursos serão adicionados em breve. Volte mais tarde para conferir!'}
  </p>
  
  {/* Botão para limpar filtros (apenas se houver filtros) */}
  {(searchTerm || selectedCategory) && (
    <button onClick={clearFilters}>
      Limpar Filtros
    </button>
  )}
</div>
```

## Benefícios

1. **Melhor UX** - Usuário entende claramente o que está acontecendo
2. **Ação Clara** - Quando há filtros, o usuário sabe como voltar
3. **Visual Profissional** - Design limpo e moderno
4. **Contextual** - Mensagens diferentes para situações diferentes

## Teste

Para testar o estado vazio:

### Cenário 1: Sem Cursos no Sistema
1. Faça login como aluno
2. Acesse `/courses`
3. Se não houver cursos, verá a tela bonita

### Cenário 2: Busca Sem Resultados
1. Faça login como aluno
2. Acesse `/courses`
3. Digite algo na busca que não existe
4. Verá a tela com botão "Limpar Filtros"

## Arquivos Modificados

- `frontend/src/pages/CoursesPage.tsx` - Adicionado estado vazio bonito

## Próximas Melhorias

Considerar adicionar estados vazios similares em:
- `/my-courses` - Quando aluno não tem cursos
- `/certificates` - Quando aluno não tem certificados
- Dashboard do instrutor - Quando não tem cursos criados
