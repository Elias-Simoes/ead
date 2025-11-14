# Correção: Página "Meus Cursos" para Instrutores

## Problema Identificado

A página "Meus Cursos" estava chamando o endpoint `/students/courses/progress`, que é específico para alunos. Quando um instrutor acessava a página, não via seus cursos criados.

## Solução Implementada

### 1. Detecção de Role do Usuário

A página agora detecta o role do usuário logado e chama o endpoint apropriado:

- **Instrutor**: `/api/instructor/courses` - Lista cursos criados pelo instrutor
- **Aluno**: `/api/students/courses/progress` - Lista cursos com progresso do aluno

### 2. Filtros Contextuais

Os filtros foram adaptados para cada tipo de usuário:

**Para Instrutores:**
- **Todos**: Todos os cursos criados
- **Em Edição**: Cursos com status `draft` ou `pending_approval`
- **Publicados**: Cursos com status `published`

**Para Alunos:**
- **Todos**: Todos os cursos iniciados
- **Em Progresso**: Cursos com 0% < progresso < 100%
- **Concluídos**: Cursos com progresso = 100%
- **Favoritos**: Cursos marcados como favoritos

### 3. Mensagens Contextuais

As mensagens de "lista vazia" foram adaptadas:

- **Instrutor sem cursos**: "Você ainda não criou nenhum curso" + botão "Criar Novo Curso"
- **Aluno sem cursos**: "Você ainda não iniciou nenhum curso" + botão "Explorar Cursos"

## Dados do Seu Usuário Instrutor

**Email**: instructor@example.com
**Nome**: Professor João Silva
**ID**: 5a6b6086-5a53-43c9-9113-267462cfe5bd

**Cursos Cadastrados**: 5
1. Teste (draft)
2. teste (draft)
3. teste (draft)
4. teste (draft)
5. Curso de React Avançado (draft)

## Como Testar

1. Faça login como instrutor (instructor@example.com)
2. Acesse a página "Meus Cursos" (/my-courses)
3. Você deve ver os 5 cursos listados
4. Use os filtros para ver:
   - **Todos**: 5 cursos
   - **Em Edição**: 5 cursos (todos estão em draft)
   - **Publicados**: 0 cursos

## Próximos Passos

Para ver cursos na aba "Publicados":
1. Acesse um dos seus cursos
2. Adicione módulos e aulas
3. Submeta o curso para aprovação
4. Um admin precisa aprovar o curso
5. O curso aparecerá como "Publicado"

## Arquivos Modificados

- `frontend/src/pages/MyCoursesPage.tsx` - Lógica adaptada para instrutores e alunos
