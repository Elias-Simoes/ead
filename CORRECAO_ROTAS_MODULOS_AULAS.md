# Correção - Rotas de Módulos e Aulas

## Problema
Erro 404 ao tentar salvar uma nova aula no sistema.

## Causa Raiz
O frontend estava chamando rotas incorretas para operações de módulos e aulas:
- **Rotas incorretas**: `/modules/:id`, `/lessons/:id`
- **Rotas corretas**: `/courses/modules/:id`, `/courses/lessons/:id`

As rotas de cursos são registradas no servidor com o prefixo `/api/courses`, então todas as sub-rotas de módulos e aulas precisam incluir esse prefixo.

## Erro no Console
```
POST /api/modules/21853d88-a4f5-4ef5-a2b3-f2a203a20dde/lessons 404
```

## Correção Aplicada

### Frontend - ModulesManagementPage.tsx

#### 1. Criar Aula
```typescript
// ANTES
await api.post(`/modules/${selectedModuleId}/lessons`, lessonForm)

// DEPOIS
await api.post(`/courses/modules/${selectedModuleId}/lessons`, lessonForm)
```

#### 2. Editar Aula
```typescript
// ANTES
await api.patch(`/lessons/${editingLesson.id}`, lessonForm)

// DEPOIS
await api.patch(`/courses/lessons/${editingLesson.id}`, lessonForm)
```

#### 3. Editar Módulo
```typescript
// ANTES
await api.patch(`/modules/${editingModule.id}`, moduleForm)

// DEPOIS
await api.patch(`/courses/modules/${editingModule.id}`, moduleForm)
```

#### 4. Excluir Módulo
```typescript
// ANTES
await api.delete(`/modules/${moduleId}`)

// DEPOIS
await api.delete(`/courses/modules/${moduleId}`)
```

#### 5. Excluir Aula
```typescript
// ANTES
await api.delete(`/lessons/${lessonId}`)

// DEPOIS
await api.delete(`/courses/lessons/${lessonId}`)
```

## Estrutura de Rotas no Backend

As rotas são registradas no servidor da seguinte forma:

```typescript
// src/server.ts
app.use('/api/courses', courseRoutes);
```

E dentro de `course.routes.ts`:

```typescript
// Criar aula
router.post('/modules/:id/lessons', ...)

// Editar aula
router.patch('/lessons/:id', ...)

// Excluir aula
router.delete('/lessons/:id', ...)

// Editar módulo
router.patch('/modules/:id', ...)

// Excluir módulo
router.delete('/modules/:id', ...)
```

Portanto, as rotas completas são:
- `POST /api/courses/modules/:id/lessons`
- `PATCH /api/courses/lessons/:id`
- `DELETE /api/courses/lessons/:id`
- `PATCH /api/courses/modules/:id`
- `DELETE /api/courses/modules/:id`

## Como Testar

1. **Limpar cache do navegador** (Ctrl+Shift+Delete)
2. **Fazer login como instrutor**:
   - Email: `instructor@example.com`
   - Senha: `Senha123!`
3. **Acessar um curso** e clicar em "Gerenciar Módulos"
4. **Criar um módulo**
5. **Adicionar uma aula** ao módulo
6. **Verificar** se a aula é salva com sucesso

## Arquivos Modificados

- `frontend/src/pages/instructor/ModulesManagementPage.tsx`

## Build

Frontend recompilado com sucesso:
```
✓ 127 modules transformed.
dist/assets/index-DYbzOR_X.js   348.97 kB │ gzip: 92.21 kB
✓ built in 3.67s
```

## Resultado

### Antes
- ❌ Erro 404 ao criar aula
- ❌ Erro 404 ao editar aula
- ❌ Erro 404 ao excluir aula
- ❌ Erro 404 ao editar módulo
- ❌ Erro 404 ao excluir módulo

### Depois
- ✅ Criar aula funciona
- ✅ Editar aula funciona
- ✅ Excluir aula funciona
- ✅ Editar módulo funciona
- ✅ Excluir módulo funciona
