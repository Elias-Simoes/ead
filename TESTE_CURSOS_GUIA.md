# 🧪 Guia de Teste - Módulo de Cursos

## 📋 Pré-requisitos

1. **Docker rodando** com PostgreSQL e Redis:
```bash
docker-compose up -d
```

2. **Servidor iniciado**:
```bash
npm run dev
```

3. **Banco de dados migrado** (já foi feito automaticamente):
```bash
npm run migrate
```

## 🚀 Método 1: Teste Automatizado (Mais Rápido)

Execute o script de teste completo:

```bash
node test-courses.js
```

Este script testa automaticamente todo o fluxo:
- ✅ Login como admin
- ✅ Criação de instrutor
- ✅ Criação de curso
- ✅ Adição de módulo
- ✅ Adição de aula
- ✅ Submissão para aprovação
- ✅ Aprovação do curso
- ✅ Listagem de cursos publicados

**Resultado esperado**: Todos os testes devem passar (taxa de sucesso: 100%)

## 🔧 Método 2: Teste Manual Passo a Passo

### Passo 1: Fazer Login como Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@plataforma-ead.com",
    "password": "Admin@123"
  }'
```

**Copie o `accessToken` da resposta** - você vai precisar dele!

### Passo 2: Criar um Instrutor

```bash
curl -X POST http://localhost:3000/api/admin/instructors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "email": "instrutor@test.com",
    "name": "Professor João",
    "bio": "Especialista em Node.js",
    "expertise": ["JavaScript", "Node.js", "TypeScript"]
  }'
```

**Anote a senha temporária** que aparece na resposta!

### Passo 3: Criar um Curso (como Instrutor)

Para simplificar, vamos usar o token do admin (que tem todas as permissões):

```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "title": "Curso de Node.js Avançado",
    "description": "Aprenda Node.js do zero ao avançado",
    "category": "Programação",
    "workload": 40
  }'
```

**Copie o `id` do curso** da resposta!

### Passo 4: Adicionar um Módulo

```bash
curl -X POST http://localhost:3000/api/courses/ID_DO_CURSO/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "title": "Módulo 1 - Introdução",
    "description": "Conceitos básicos do Node.js"
  }'
```

**Copie o `id` do módulo** da resposta!

### Passo 5: Adicionar uma Aula

```bash
curl -X POST http://localhost:3000/api/courses/modules/ID_DO_MODULO/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "title": "Aula 1 - O que é Node.js",
    "description": "Introdução ao Node.js",
    "type": "video",
    "content": "https://example.com/video1.mp4",
    "duration": 15
  }'
```

### Passo 6: Submeter para Aprovação

```bash
curl -X POST http://localhost:3000/api/courses/ID_DO_CURSO/submit \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

O status do curso deve mudar para `pending_approval`.

### Passo 7: Aprovar o Curso (como Admin)

```bash
curl -X PATCH http://localhost:3000/api/courses/admin/ID_DO_CURSO/approve \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

O status do curso deve mudar para `published`!

### Passo 8: Listar Cursos Publicados

```bash
curl -X GET http://localhost:3000/api/courses \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Você deve ver o curso que acabou de criar na lista!

### Passo 9: Ver Detalhes do Curso

```bash
curl -X GET http://localhost:3000/api/courses/ID_DO_CURSO \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Deve retornar o curso completo com módulos e aulas!

## 📱 Método 3: Usando REST Client (VS Code)

Se você usa VS Code:

1. Instale a extensão **REST Client**
2. Abra o arquivo `test-api.http`
3. Role até a seção **"10. COURSES MODULE"**
4. Clique em **"Send Request"** acima de cada requisição

**Dica**: Substitua os placeholders:
- `YOUR_ADMIN_TOKEN` → token do admin
- `COURSE_ID` → ID do curso criado
- `MODULE_ID` → ID do módulo criado
- `LESSON_ID` → ID da aula criada

## 🔍 Verificando no Banco de Dados

Se quiser ver os dados diretamente no banco:

```bash
# Conectar ao PostgreSQL
docker exec -it plataforma-ead-db psql -U user -d plataforma_ead

# Ver cursos
SELECT id, title, status, instructor_id FROM courses;

# Ver módulos de um curso
SELECT * FROM modules WHERE course_id = 'ID_DO_CURSO';

# Ver aulas de um módulo
SELECT * FROM lessons WHERE module_id = 'ID_DO_MODULO';

# Ver versões do curso
SELECT * FROM course_versions WHERE course_id = 'ID_DO_CURSO';

# Sair
\q
```

## ✅ Checklist de Testes

- [ ] Servidor está rodando (porta 3000)
- [ ] Login como admin funciona
- [ ] Criar instrutor funciona
- [ ] Criar curso funciona
- [ ] Adicionar módulo funciona
- [ ] Adicionar aula funciona
- [ ] Submeter para aprovação funciona
- [ ] Aprovar curso funciona
- [ ] Listar cursos publicados funciona
- [ ] Ver detalhes do curso funciona
- [ ] Buscar cursos por categoria funciona
- [ ] Buscar cursos por texto funciona

## 🐛 Problemas Comuns

### Erro: "Cannot connect to database"
**Solução**: Certifique-se de que o Docker está rodando:
```bash
docker-compose up -d
```

### Erro: "Unauthorized" (401)
**Solução**: Seu token expirou. Faça login novamente para obter um novo token.

### Erro: "COURSE_NEEDS_MODULE" ou "COURSE_NEEDS_LESSON"
**Solução**: Você precisa adicionar pelo menos 1 módulo e 1 aula antes de submeter o curso para aprovação.

### Erro: "FORBIDDEN" (403)
**Solução**: Você está tentando acessar um recurso que não tem permissão. Verifique se está usando o token correto (admin/instrutor/aluno).

## 📊 Endpoints Disponíveis

### Instrutor
- `POST /api/courses` - Criar curso
- `GET /api/courses/:id` - Ver curso
- `PATCH /api/courses/:id` - Atualizar curso
- `DELETE /api/courses/:id` - Deletar curso (apenas draft)
- `GET /api/courses/instructor/my-courses` - Listar meus cursos
- `POST /api/courses/:id/modules` - Adicionar módulo
- `PATCH /api/courses/modules/:id` - Atualizar módulo
- `DELETE /api/courses/modules/:id` - Deletar módulo
- `POST /api/courses/modules/:id/lessons` - Adicionar aula
- `PATCH /api/courses/lessons/:id` - Atualizar aula
- `DELETE /api/courses/lessons/:id` - Deletar aula
- `POST /api/courses/:id/submit` - Submeter para aprovação

### Admin
- `GET /api/courses/admin/pending` - Listar cursos pendentes
- `PATCH /api/courses/admin/:id/approve` - Aprovar curso
- `PATCH /api/courses/admin/:id/reject` - Rejeitar curso

### Público (Autenticado)
- `GET /api/courses` - Listar cursos publicados
- `GET /api/courses?category=X` - Filtrar por categoria
- `GET /api/courses?search=X` - Buscar por texto
- `GET /api/courses/:id` - Ver detalhes (apenas publicados)

## 🎯 Próximos Passos

Após testar o módulo de cursos, você pode:

1. Implementar o módulo de assinaturas (Task 5)
2. Implementar o módulo de progresso (Task 6)
3. Implementar o módulo de avaliações (Task 7)
4. Implementar o módulo de certificados (Task 8)

## 💡 Dicas

- Use o Postman ou Insomnia para salvar suas requisições
- Mantenha os tokens e IDs em variáveis de ambiente
- O script `test-courses.js` é a forma mais rápida de validar tudo
- Consulte o arquivo `TASK_4_COURSES_SUMMARY.md` para mais detalhes
