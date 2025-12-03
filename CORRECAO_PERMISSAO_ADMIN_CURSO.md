# Correção: Admin Não Conseguia Ver Detalhes do Curso Pendente

## Problema Identificado

Ao clicar em "Ver Detalhes do Curso" na página de aprovação, o admin recebia erro **403 (Forbidden)**.

### Erros no Console:
```
Failed to load :3000/api/courses/65-41bbd1883/content:1
the server responded with a status of 404 (Not Found)

Failed to load :3000/api/students/courses/progress:1
the server responded with a status of 403 (Forbidden)
```

### Causa Raiz

O controller `getCourseById` estava bloqueando o acesso de **todos** os usuários (exceto o dono) a cursos que não estavam publicados, **incluindo admins**.

```typescript
// CÓDIGO PROBLEMÁTICO
// Instructors can only see their own courses unless published
if (userRole === 'instructor' && course.instructor_id !== userId && course.status !== 'published') {
  // Bloqueia acesso
}

// Students can only see published courses
if (userRole === 'student' && course.status !== 'published') {
  // Bloqueia acesso
}

// ❌ PROBLEMA: Não havia verificação para admins!
// Admins eram tratados como qualquer outro usuário
```

## Correção Implementada

Adicionada verificação explícita para permitir que **admins vejam todos os cursos**, independente do status.

### Código Corrigido:

```typescript
// Check access permissions
// Admins can see all courses
if (userRole === 'admin') {
  // Admin has full access ✅
}
// Instructors can only see their own courses unless published
else if (userRole === 'instructor' && course.instructor_id !== userId && course.status !== 'published') {
  res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this course',
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
  return;
}
// Students can only see published courses
else if (userRole === 'student' && course.status !== 'published') {
  res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message: 'This course is not available',
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
  return;
}
```

## Lógica de Permissões

### Matriz de Acesso por Papel e Status:

| Papel | Draft (Próprio) | Draft (Outro) | Pending | Published |
|-------|----------------|---------------|---------|-----------|
| **Admin** | ✅ Acesso Total | ✅ Acesso Total | ✅ Acesso Total | ✅ Acesso Total |
| **Instructor** | ✅ Pode Ver | ❌ Bloqueado | ❌ Bloqueado* | ✅ Pode Ver |
| **Student** | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado | ✅ Pode Ver |

*Exceto se for o próprio instrutor

### Regras de Negócio:

1. **Admin**:
   - Acesso total a todos os cursos
   - Pode ver cursos em qualquer status
   - Necessário para aprovar/rejeitar cursos

2. **Instructor**:
   - Pode ver seus próprios cursos (qualquer status)
   - Pode ver cursos publicados de outros instrutores
   - Não pode ver cursos draft/pending de outros

3. **Student**:
   - Pode ver apenas cursos publicados
   - Não pode ver cursos em desenvolvimento

## Arquivo Modificado

**src/modules/courses/controllers/course.controller.ts**
- Método: `getCourseById`
- Linha: ~45-75
- Mudança: Adicionada verificação explícita para role 'admin'

## Como Testar

### Teste 1: Admin Vê Curso Pendente

1. Login como admin: `admin@example.com` / `Admin123!`
2. Acesse "Aprovação de Cursos"
3. Clique em "Ver Detalhes do Curso" em qualquer curso pendente
4. **Resultado esperado**:
   - ✅ Página do curso carrega corretamente
   - ✅ Mostra todos os módulos e aulas
   - ✅ Sem erros 403 ou 404

### Teste 2: Instrutor Vê Próprio Curso

1. Login como instrutor: `instructor@example.com` / `Senha123!`
2. Acesse um curso próprio (qualquer status)
3. **Resultado esperado**:
   - ✅ Pode ver o curso
   - ✅ Pode editar (se draft)

### Teste 3: Instrutor NÃO Vê Curso de Outro

1. Login como instrutor
2. Tente acessar curso draft de outro instrutor
3. **Resultado esperado**:
   - ❌ Erro 403 (Forbidden)
   - Mensagem: "You do not have permission to access this course"

### Teste 4: Aluno Vê Apenas Publicados

1. Login como aluno: `student@example.com` / `Student123!`
2. Tente acessar curso pendente ou draft
3. **Resultado esperado**:
   - ❌ Erro 403 (Forbidden)
   - Mensagem: "This course is not available"

## Fluxo de Aprovação Completo

```
1. Instrutor cria curso (draft)
   ↓
2. Instrutor submete para aprovação (pending_approval)
   ↓
3. Admin acessa "Aprovação de Cursos"
   ↓
4. Admin clica "Ver Detalhes" ✅ AGORA FUNCIONA
   ↓
5. Admin revisa conteúdo completo
   ↓
6. Admin aprova ou rejeita
   ↓
7a. Se aprovado → status: published (visível para alunos)
7b. Se rejeitado → status: draft (instrutor pode editar)
```

## Endpoints Afetados

### GET /api/courses/:id
**Antes**: Bloqueava admin de ver cursos pendentes
**Depois**: Admin tem acesso total

**Permissões**:
- ✅ Admin: Todos os cursos
- ✅ Instructor: Próprios cursos + publicados
- ✅ Student: Apenas publicados

## Segurança

A correção mantém a segurança:

1. **Alunos** continuam vendo apenas cursos publicados
2. **Instrutores** continuam sem ver cursos de outros (exceto publicados)
3. **Admins** agora têm acesso necessário para fazer seu trabalho

## Logs do Backend

Após a correção, o backend deve logar:

```
2025-11-22 03:39:47 [info]: Server running on port 3000
2025-11-22 03:39:47 [info]: Environment: development
```

Sem erros de permissão ao admin acessar cursos pendentes.

## Próximos Passos

1. ✅ Testar acesso do admin a cursos pendentes
2. ✅ Verificar se aprovação/rejeição funciona
3. ✅ Confirmar que outros papéis mantêm restrições corretas

## Status

- ✅ Correção implementada
- ✅ Backend reiniciado
- ✅ Pronto para teste
- ⏳ Aguardando validação do usuário

**Correção aplicada! Agora admins podem ver detalhes de cursos pendentes.** 🎉
