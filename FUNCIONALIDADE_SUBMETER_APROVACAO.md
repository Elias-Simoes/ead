# Funcionalidade: Submeter Curso para Aprovação

## ✅ Implementação Concluída

Adicionada a funcionalidade de "Submeter para Aprovação" no Dashboard do Instrutor.

## 📍 Localização

A funcionalidade está disponível em:
- **Página**: Dashboard do Instrutor (`/instructor/dashboard`)
- **Seção**: Tabela "Meus Cursos"
- **Coluna**: "Ações"

## 🎯 Como Funciona

### Para o Instrutor:

1. **Acesse o Dashboard**:
   - Login como instrutor
   - Vá para o Dashboard do Instrutor

2. **Visualize seus cursos**:
   - Na tabela "Meus Cursos", você verá todos os seus cursos
   - Cada curso mostra seu status atual

3. **Submeta para aprovação**:
   - Cursos com status "Rascunho" (draft) têm um botão **"Submeter"**
   - Clique no botão "Submeter"
   - Confirme a ação no diálogo

4. **Após submissão**:
   - O status muda para "Em Aprovação" (pending_approval)
   - O botão "Editar" desaparece (curso não pode ser editado)
   - Aguarde a aprovação ou rejeição do administrador

### Para o Administrador:

1. **Acesse a página de aprovação**:
   - Login como admin
   - Vá para "Aprovação de Cursos"

2. **Visualize cursos pendentes**:
   - Todos os cursos submetidos aparecem na lista
   - Informações do instrutor são exibidas

3. **Aprove ou rejeite**:
   - **Aprovar**: Curso fica publicado e visível para alunos
   - **Rejeitar**: Curso volta para "Rascunho" e instrutor pode editar

## 🔧 Mudanças Implementadas

### Frontend - `InstructorDashboardPage.tsx`

#### 1. Adicionado estado para controle de submissão:
```typescript
const [submitting, setSubmitting] = useState<string | null>(null)
```

#### 2. Criada função para submeter curso:
```typescript
const handleSubmitForApproval = async (courseId: string) => {
  if (!confirm('Tem certeza que deseja submeter este curso para aprovação?')) {
    return
  }

  try {
    setSubmitting(courseId)
    await api.post(`/courses/${courseId}/submit`)
    alert('Curso submetido para aprovação com sucesso!')
    fetchDashboard() // Recarregar lista
  } catch (err: any) {
    const errorMessage = err.response?.data?.error?.message || 'Erro ao submeter curso'
    alert(errorMessage)
  } finally {
    setSubmitting(null)
  }
}
```

#### 3. Atualizada coluna de ações na tabela:
```typescript
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
  <div className="flex items-center space-x-3">
    {course.status === 'draft' && (
      <button
        onClick={() => handleSubmitForApproval(course.id)}
        disabled={submitting === course.id}
        className="text-purple-600 hover:text-purple-900"
      >
        {submitting === course.id ? 'Submetendo...' : 'Submeter'}
      </button>
    )}
    {course.status !== 'pending_approval' && (
      <Link to={`/instructor/courses/${course.id}`}>
        Editar
      </Link>
    )}
    <Link to={`/instructor/courses/${course.id}/students`}>
      Alunos
    </Link>
  </div>
</td>
```

## 📋 Regras de Negócio

### Quando um curso pode ser submetido:

✅ **Pode submeter se**:
- Status é "draft" (rascunho)
- Curso tem pelo menos 1 módulo
- Curso tem pelo menos 1 aula

❌ **Não pode submeter se**:
- Status já é "pending_approval" ou "published"
- Curso não tem módulos
- Curso não tem aulas

### Validações no Backend:

O backend valida automaticamente:
```typescript
// Verifica se tem módulos
const moduleCount = await client.query(
  'SELECT COUNT(*) FROM modules WHERE course_id = $1',
  [courseId]
);

if (parseInt(moduleCount.rows[0].count) === 0) {
  throw new Error('COURSE_NEEDS_MODULE');
}

// Verifica se tem aulas
const lessonCount = await client.query(
  `SELECT COUNT(l.*) 
   FROM lessons l
   INNER JOIN modules m ON l.module_id = m.id
   WHERE m.course_id = $1`,
  [courseId]
);

if (parseInt(lessonCount.rows[0].count) === 0) {
  throw new Error('COURSE_NEEDS_LESSON');
}
```

## 🎨 Interface do Usuário

### Botão "Submeter":
- **Cor**: Roxo (`text-purple-600`)
- **Hover**: Roxo escuro (`hover:text-purple-900`)
- **Estado desabilitado**: Opacidade reduzida
- **Texto durante submissão**: "Submetendo..."

### Status dos Cursos:
- **Rascunho**: Badge cinza
- **Em Aprovação**: Badge amarelo
- **Publicado**: Badge verde

### Ações Disponíveis por Status:

| Status | Submeter | Editar | Ver Alunos |
|--------|----------|--------|------------|
| Rascunho | ✅ | ✅ | ✅ |
| Em Aprovação | ❌ | ❌ | ✅ |
| Publicado | ❌ | ✅ | ✅ |

## 🔄 Fluxo Completo

```
1. Instrutor cria curso (status: draft)
   ↓
2. Instrutor adiciona módulos e aulas
   ↓
3. Instrutor clica em "Submeter" no Dashboard
   ↓
4. Sistema valida (tem módulo? tem aula?)
   ↓
5. Status muda para "pending_approval"
   ↓
6. Admin vê curso na página de aprovação
   ↓
7a. Admin aprova → status: "published"
    OU
7b. Admin rejeita → status: "draft"
   ↓
8. Instrutor recebe notificação (se configurado)
```

## 🧪 Como Testar

### Teste 1: Submeter Curso Válido

1. Login como instrutor: `instructor@example.com` / `Senha123!`
2. Crie um curso novo
3. Adicione pelo menos 1 módulo
4. Adicione pelo menos 1 aula ao módulo
5. Volte ao Dashboard
6. Clique em "Submeter" no curso criado
7. Confirme a ação
8. **Resultado esperado**: 
   - Mensagem de sucesso
   - Status muda para "Em Aprovação"
   - Botão "Editar" desaparece

### Teste 2: Tentar Submeter Curso Sem Conteúdo

1. Crie um curso novo
2. NÃO adicione módulos ou aulas
3. Tente clicar em "Submeter"
4. **Resultado esperado**:
   - Erro: "Course must have at least one module before submission"

### Teste 3: Verificar como Admin

1. Faça logout do instrutor
2. Login como admin: `admin@example.com` / `Admin123!`
3. Acesse "Aprovação de Cursos"
4. **Resultado esperado**:
   - Curso submetido aparece na lista
   - Informações do instrutor visíveis
   - Botões "Aprovar" e "Rejeitar" disponíveis

## 📡 API Endpoints Utilizados

### Submeter para Aprovação:
```
POST /api/courses/:id/submit
Authorization: Bearer {token}
```

**Resposta de Sucesso (200)**:
```json
{
  "message": "Course submitted for approval successfully",
  "data": {
    "course": {
      "id": "...",
      "title": "...",
      "status": "pending_approval",
      ...
    }
  }
}
```

**Erros Possíveis**:
- `COURSE_NOT_FOUND` (404): Curso não encontrado
- `COURSE_NOT_DRAFT` (400): Curso não está em rascunho
- `COURSE_NEEDS_MODULE` (400): Curso precisa de pelo menos 1 módulo
- `COURSE_NEEDS_LESSON` (400): Curso precisa de pelo menos 1 aula
- `FORBIDDEN` (403): Usuário não é dono do curso

## 📝 Mensagens para o Usuário

### Confirmação antes de submeter:
```
"Tem certeza que deseja submeter este curso para aprovação? 
Você não poderá editá-lo até que seja aprovado ou rejeitado."
```

### Sucesso:
```
"Curso submetido para aprovação com sucesso!"
```

### Erros:
- Sem módulos: "Course must have at least one module before submission"
- Sem aulas: "Course must have at least one lesson before submission"
- Não é rascunho: "Only draft courses can be submitted for approval"

## ✨ Melhorias Futuras (Opcional)

1. **Notificações em tempo real**: Usar WebSocket para notificar quando curso é aprovado/rejeitado
2. **Histórico de submissões**: Mostrar quantas vezes o curso foi submetido
3. **Comentários do admin**: Permitir admin adicionar comentários na rejeição
4. **Preview antes de submeter**: Mostrar preview de como o curso ficará publicado
5. **Checklist de validação**: Mostrar checklist visual antes de permitir submissão

## 🎯 Status Atual

- ✅ Botão "Submeter" adicionado ao Dashboard
- ✅ Validação de módulos e aulas no backend
- ✅ Mudança de status funcionando
- ✅ Restrição de edição para cursos pendentes
- ✅ Integração com página de aprovação do admin
- ✅ Mensagens de erro e sucesso implementadas

**Funcionalidade pronta para uso!** 🚀
