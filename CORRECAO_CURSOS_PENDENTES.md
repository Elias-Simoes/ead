# Correção: Cursos Pendentes Não Aparecem para Admins

## Problema Identificado

Os cursos criados pelos instrutores com status `pending_approval` não estavam aparecendo na página de aprovação de cursos para os administradores.

### Causa Raiz

A página `CourseApprovalPage.tsx` estava fazendo uma requisição para:
```
GET /api/courses?status=pending_approval
```

Porém, o controller `course.controller.ts` na rota `/api/courses` (método `getPublishedCourses`) não estava tratando o parâmetro `status`, sempre retornando apenas cursos publicados.

## Correções Implementadas

### 1. Controller - `src/modules/courses/controllers/course.controller.ts`

Adicionado suporte ao parâmetro `status` na rota `/api/courses`:

```typescript
async getPublishedCourses(req: Request, res: Response): Promise<void> {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;  // ✅ NOVO

    // Se status é pending_approval, redireciona para getPendingCourses
    if (status === 'pending_approval') {  // ✅ NOVO
      const result = await courseService.getPendingCourses(page, limit);
      res.status(200).json({
        message: 'Pending courses retrieved successfully',
        data: result,
      });
      return;
    }

    const result = await courseService.getPublishedCourses(page, limit, category, search);
    // ... resto do código
  }
}
```

### 2. Service - `src/modules/courses/services/course.service.ts`

Melhorado o método `getPendingCourses` para retornar dados formatados corretamente:

```typescript
async getPendingCourses(
  page: number = 1,
  limit: number = 20
): Promise<{ courses: any[]; total: number; page: number; totalPages: number }> {
  try {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM courses WHERE status = 'pending_approval'"
    );
    const total = parseInt(countResult.rows[0].count);

    // Get courses with instructor info
    const result = await pool.query(
      `SELECT 
        c.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as instructor  // ✅ Retorna objeto instructor formatado
       FROM courses c
       INNER JOIN users u ON c.instructor_id = u.id
       WHERE c.status = 'pending_approval'
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Enrich courses with URLs and format data
    const enrichedCourses = result.rows.map(course => ({
      ...this.enrichCourseWithUrls(course),
      createdAt: course.created_at,  // ✅ camelCase
      updatedAt: course.updated_at,
      publishedAt: course.published_at,
      instructorId: course.instructor_id,
      coverImage: course.cover_image,
    }));

    return {
      courses: enrichedCourses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error('Failed to get pending courses', error);
    throw error;
  }
}
```

## Verificação no Banco de Dados

Executado script `check-pending-courses.js` que confirmou:

```
📊 ESTATÍSTICAS POR STATUS:
===========================
draft: 38 curso(s)
pending_approval: 2 curso(s)  ✅ Existem cursos pendentes
published: 14 curso(s)
```

## Como Testar

### 1. Como Instrutor - Submeter Curso para Aprovação

1. Login como instrutor: `instructor@example.com` / `Senha123!`
2. Criar um curso completo (com módulo e aula)
3. Clicar em "Submeter para Aprovação"
4. O curso deve mudar de status `draft` → `pending_approval`

### 2. Como Admin - Aprovar Curso

1. Login como admin: `admin@example.com` / `Admin123!`
2. Acessar "Aprovação de Cursos" no menu
3. Os cursos com status `pending_approval` devem aparecer na lista
4. Clicar em "Aprovar" ou "Rejeitar"

## Rotas Afetadas

- `GET /api/courses?status=pending_approval` - Agora funciona corretamente
- `GET /api/admin/courses/pending` - Continua funcionando (rota alternativa)
- `PATCH /api/admin/courses/:id/approve` - Aprovar curso
- `PATCH /api/admin/courses/:id/reject` - Rejeitar curso

## Arquivos Modificados

1. `src/modules/courses/controllers/course.controller.ts`
   - Adicionado suporte ao parâmetro `status` em `getPublishedCourses`

2. `src/modules/courses/services/course.service.ts`
   - Melhorado `getPendingCourses` para retornar dados formatados
   - Adicionado objeto `instructor` com informações do instrutor
   - Convertido campos para camelCase

## Scripts de Teste Criados

- `check-pending-courses.js` - Verifica cursos no banco de dados
- `test-pending-courses-api.js` - Testa a API de cursos pendentes

## Resultado Esperado

Após as correções, a página de aprovação de cursos deve:

✅ Mostrar todos os cursos com status `pending_approval`
✅ Exibir informações do instrutor (nome, email)
✅ Exibir imagem de capa do curso
✅ Permitir aprovar ou rejeitar cursos
✅ Atualizar a lista após aprovação/rejeição

## Próximos Passos

1. Reiniciar o backend para aplicar as mudanças
2. Testar no frontend a listagem de cursos pendentes
3. Verificar se os botões de aprovar/rejeitar funcionam corretamente
