# Melhoria: Seleção de Módulo na Criação de Avaliação

## 📋 Resumo

Implementada melhoria na tela de criação de avaliação para mostrar apenas os módulos que ainda não possuem avaliação, com desabilitação automática do botão quando todos os módulos já tiverem suas avaliações.

## ✅ Funcionalidades Implementadas

### 1. Lista de Módulos Disponíveis

A tela de criação de avaliação agora mostra:
- **Dropdown com módulos disponíveis** - Apenas módulos sem avaliação
- **Contador de módulos** - Mostra quantos módulos estão disponíveis
- **Seleção obrigatória** - Usuário deve escolher um módulo antes de criar

### 2. Validação e Feedback

- **Mensagem informativa** quando todos os módulos já têm avaliação
- **Botão desabilitado** quando não há módulos disponíveis
- **Campos desabilitados** quando não há módulos disponíveis
- **Validação** impede criar avaliação sem selecionar módulo

### 3. UX Melhorada

- **Visual claro** com ícone e cores para destacar informações
- **Texto explicativo** sobre a situação atual
- **Contador dinâmico** mostra quantos módulos estão disponíveis

## 🔧 Implementação Técnica

### Backend

#### Novo Endpoint
**GET** `/api/courses/:id/modules-without-assessments`

Retorna lista de módulos que ainda não possuem avaliação.

**Arquivo:** `src/modules/assessments/services/assessment.service.ts`

```typescript
async getModulesWithoutAssessments(courseId: string): Promise<any[]> {
  const result = await pool.query(
    `SELECT m.id, m.title, m.description, m.order_index
     FROM modules m
     LEFT JOIN assessments a ON m.id = a.module_id
     WHERE m.course_id = $1 AND a.id IS NULL
     ORDER BY m.order_index ASC`,
    [courseId]
  );
  return result.rows;
}
```

**Controller:** `src/modules/assessments/controllers/assessment.controller.ts`

```typescript
async getModulesWithoutAssessments(req: Request, res: Response): Promise<void> {
  const { id: courseId } = req.params;
  const instructorId = req.user!.userId;

  // Verifica permissão
  const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
  if (!isOwner) {
    res.status(403).json({ error: { code: 'FORBIDDEN', ... } });
    return;
  }

  const modules = await assessmentService.getModulesWithoutAssessments(courseId);
  res.status(200).json({ data: { modules } });
}
```

**Rota:** `src/modules/assessments/routes/assessment.routes.ts`

```typescript
router.get(
  '/courses/:id/modules-without-assessments',
  authenticate,
  authorize('instructor'),
  assessmentController.getModulesWithoutAssessments.bind(assessmentController)
);
```

### Frontend

**Arquivo:** `frontend/src/pages/instructor/AssessmentFormPage.tsx`

#### Estados Adicionados

```typescript
const [selectedModuleId, setSelectedModuleId] = useState('');
const [availableModules, setAvailableModules] = useState<Module[]>([]);
const [loadingModules, setLoadingModules] = useState(false);
```

#### Carregamento de Módulos

```typescript
const loadAvailableModules = async () => {
  try {
    setLoadingModules(true);
    const response = await api.get(`/courses/${courseId}/modules-without-assessments`);
    setAvailableModules(response.data.data.modules);
  } catch (err: any) {
    setError(err.response?.data?.error?.message || 'Erro ao carregar módulos disponíveis');
  } finally {
    setLoadingModules(false);
  }
};
```

#### Validação na Criação

```typescript
if (!selectedModuleId) {
  setError('Selecione um módulo para a avaliação');
  return;
}

const response = await api.post(`/modules/${selectedModuleId}/assessments`, {
  title,
  type: 'multiple_choice',
  passing_score: passingScore,
});
```

## 🎨 Interface do Usuário

### Cenário 1: Módulos Disponíveis

```
┌─────────────────────────────────────────┐
│ Informações da Avaliação                │
├─────────────────────────────────────────┤
│ Módulo *                                │
│ ┌─────────────────────────────────────┐ │
│ │ Selecione um módulo            ▼   │ │
│ └─────────────────────────────────────┘ │
│ Módulos que ainda não possuem avaliação│
│ (2 disponíveis)                         │
│                                         │
│ Título da Avaliação                     │
│ ┌─────────────────────────────────────┐ │
│ │ Ex: Avaliação Final - Módulo 1     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Nota de Corte (%)                       │
│ ┌────┐                                  │
│ │ 70 │                                  │
│ └────┘                                  │
│                                         │
│ [ Criar Avaliação ]                     │
└─────────────────────────────────────────┘
```

### Cenário 2: Todos os Módulos com Avaliação

```
┌─────────────────────────────────────────┐
│ Informações da Avaliação                │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ ℹ️ Todos os módulos já possuem      │ │
│ │    avaliações                        │ │
│ │                                      │ │
│ │ Não é possível criar novas          │ │
│ │ avaliações pois todos os módulos    │ │
│ │ do curso já possuem suas avaliações.│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Módulo *                                │
│ Nenhum módulo disponível para criar    │
│ avaliação                               │
│                                         │
│ Título da Avaliação                     │
│ ┌─────────────────────────────────────┐ │
│ │ (desabilitado)                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ Criar Avaliação ] (desabilitado)      │
└─────────────────────────────────────────┘
```

## 📊 Fluxo de Uso

### Criar Nova Avaliação

1. Instrutor acessa "Nova Avaliação"
2. Sistema carrega módulos sem avaliação
3. **Se houver módulos disponíveis:**
   - Mostra dropdown com módulos
   - Instrutor seleciona módulo
   - Preenche título e nota de corte
   - Clica em "Criar Avaliação"
4. **Se NÃO houver módulos disponíveis:**
   - Mostra mensagem informativa
   - Desabilita campos e botão
   - Instrutor não pode criar avaliação

### Editar Avaliação Existente

1. Instrutor acessa avaliação existente
2. Sistema NÃO carrega lista de módulos
3. Campos de título e nota de corte habilitados
4. Botão "Atualizar Avaliação" habilitado

## 🎯 Benefícios

1. **Clareza** - Usuário vê exatamente quais módulos precisam de avaliação
2. **Prevenção de Erros** - Impossível criar avaliação duplicada
3. **Feedback Imediato** - Mensagem clara quando não há módulos disponíveis
4. **UX Melhorada** - Interface intuitiva e autoexplicativa
5. **Validação Robusta** - Backend e frontend validam a seleção

## 🧪 Como Testar

### Teste 1: Criar Avaliação com Módulos Disponíveis

1. Criar curso com 3 módulos
2. Criar avaliação para 1 módulo
3. Acessar "Nova Avaliação"
4. **Resultado esperado:** Dropdown mostra 2 módulos disponíveis

### Teste 2: Todos os Módulos com Avaliação

1. Criar curso com 2 módulos
2. Criar avaliação para ambos os módulos
3. Acessar "Nova Avaliação"
4. **Resultado esperado:** 
   - Mensagem "Todos os módulos já possuem avaliações"
   - Botão "Criar Avaliação" desabilitado
   - Campos desabilitados

### Teste 3: Validação de Seleção

1. Acessar "Nova Avaliação" com módulos disponíveis
2. Preencher título e nota
3. NÃO selecionar módulo
4. Clicar em "Criar Avaliação"
5. **Resultado esperado:** Erro "Selecione um módulo para a avaliação"

## 📝 Arquivos Modificados

### Backend
- `src/modules/assessments/services/assessment.service.ts` - Novo método
- `src/modules/assessments/controllers/assessment.controller.ts` - Novo endpoint
- `src/modules/assessments/routes/assessment.routes.ts` - Nova rota

### Frontend
- `frontend/src/pages/instructor/AssessmentFormPage.tsx` - Interface atualizada

## ✅ Status

- [x] Backend - Endpoint de módulos disponíveis
- [x] Frontend - Dropdown de seleção
- [x] Frontend - Mensagem quando não há módulos
- [x] Frontend - Desabilitar botão e campos
- [x] Frontend - Validação de seleção
- [x] Frontend - Contador de módulos
- [x] Documentação completa

**Status:** IMPLEMENTADO E PRONTO ✅

---

**Data:** 25/11/2024  
**Versão:** 1.0
