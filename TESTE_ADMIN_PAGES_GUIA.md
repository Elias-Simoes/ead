# Guia de Teste - Páginas do Administrador

## 🚀 Preparação

### 1. Iniciar os Serviços

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Credenciais de Acesso

**Admin:**
- Email: `admin@example.com`
- Senha: `Admin123!`

O usuário admin já foi criado pelo script `scripts/create-admin.js`.

### 3. Acessar o Frontend

Abra o navegador em: `http://localhost:5173`

---

## 📋 Roteiro de Testes

### Teste 1: Login como Administrador

1. Acesse `http://localhost:5173/login`
2. Faça login com as credenciais do admin
3. ✅ Verifique que o menu de navegação mostra as opções de admin:
   - Dashboard
   - Instrutores
   - Aprovações
   - Assinaturas
   - Relatórios

### Teste 2: Dashboard Administrativo

**URL:** `http://localhost:5173/admin/dashboard`

**O que testar:**

1. ✅ Verifique que os 8 cards de métricas são exibidos:
   - Assinantes Ativos
   - Total de Cursos
   - Instrutores
   - Aprovações Pendentes
   - Receita Mensal
   - Novos Assinantes (Mês)
   - Taxa de Retenção
   - Taxa de Churn

2. ✅ Clique no card "Aprovações Pendentes"
   - Deve navegar para `/admin/courses/pending`

3. ✅ Teste os botões de ação rápida:
   - Gerenciar Instrutores → `/admin/instructors`
   - Aprovar Cursos → `/admin/courses/pending`
   - Gerenciar Assinaturas → `/admin/subscriptions`
   - Ver Relatórios → `/admin/reports`

**Endpoints testados:**
- `GET /api/admin/reports/overview`

---

### Teste 3: Gestão de Instrutores

**URL:** `http://localhost:5173/admin/instructors`

**O que testar:**

#### 3.1 Listar Instrutores

1. ✅ Verifique que a lista de instrutores é exibida
2. ✅ Confira as colunas:
   - Nome (com avatar inicial)
   - Email
   - Especialidades (tags)
   - Status (Ativo/Suspenso)
   - Ações

#### 3.2 Criar Novo Instrutor

1. Clique em "Novo Instrutor"
2. Preencha o formulário:
   - Nome: `João Silva`
   - Email: `joao.silva@example.com`
   - Bio: `Especialista em desenvolvimento web`
   - Especialidades: `JavaScript, React, Node.js`
3. Clique em "Criar Instrutor"
4. ✅ Verifique que o instrutor aparece na lista
5. ✅ Verifique que as especialidades aparecem como tags

#### 3.3 Suspender Instrutor

1. Clique em "Suspender" em um instrutor ativo
2. ✅ Verifique que o status muda para "Suspenso"
3. ✅ Verifique que o badge fica vermelho

#### 3.4 Reativar Instrutor

1. Clique em "Reativar" em um instrutor suspenso
2. ✅ Verifique que o status volta para "Ativo"
3. ✅ Verifique que o badge fica verde

**Endpoints testados:**
- `GET /api/admin/instructors`
- `POST /api/admin/instructors`
- `PATCH /api/admin/instructors/:id/suspend`

---

### Teste 4: Aprovação de Cursos

**URL:** `http://localhost:5173/admin/courses/pending`

**Preparação:** Crie um curso como instrutor e envie para aprovação primeiro.

**O que testar:**

#### 4.1 Visualizar Cursos Pendentes

1. ✅ Verifique que os cursos pendentes são listados
2. ✅ Confira as informações exibidas:
   - Título e descrição
   - Imagem de capa
   - Nome do instrutor
   - Categoria
   - Carga horária
   - Data de criação
   - Badge "Pendente"

#### 4.2 Ver Detalhes do Curso

1. Clique em "Ver Detalhes do Curso"
2. ✅ Verifique que navega para a página de detalhes
3. ✅ Revise o conteúdo do curso (módulos, aulas)

#### 4.3 Aprovar Curso

1. Volte para `/admin/courses/pending`
2. Clique em "Aprovar" em um curso
3. Confirme a ação
4. ✅ Verifique que o curso sai da lista de pendentes
5. ✅ Verifique que o curso aparece como "Publicado" na lista geral

#### 4.4 Rejeitar Curso

1. Clique em "Rejeitar" em um curso
2. Digite um motivo: `O conteúdo precisa de mais detalhes nas aulas`
3. Clique em "Rejeitar Curso"
4. ✅ Verifique que o curso sai da lista de pendentes
5. ✅ Verifique que o instrutor recebe o feedback (pode verificar no banco)

#### 4.5 Estado Vazio

1. Aprove/rejeite todos os cursos pendentes
2. ✅ Verifique que aparece a mensagem "Nenhum curso pendente"
3. ✅ Verifique o ícone e texto de estado vazio

**Endpoints testados:**
- `GET /api/courses?status=pending_approval`
- `PATCH /api/admin/courses/:id/approve`
- `PATCH /api/admin/courses/:id/reject`

---

### Teste 5: Gestão de Assinaturas

**URL:** `http://localhost:5173/admin/subscriptions`

**O que testar:**

#### 5.1 Visualizar Estatísticas

1. ✅ Verifique os 5 cards de estatísticas:
   - Assinaturas Ativas
   - Suspensas
   - Canceladas
   - MRR (Receita Mensal Recorrente)
   - Taxa de Churn

#### 5.2 Filtrar por Status

1. Clique em "Todas" → ✅ Mostra todas as assinaturas
2. Clique em "Ativas" → ✅ Mostra apenas ativas
3. Clique em "Suspensas" → ✅ Mostra apenas suspensas
4. Clique em "Canceladas" → ✅ Mostra apenas canceladas

#### 5.3 Visualizar Tabela

1. ✅ Verifique as colunas:
   - Nome e email do aluno
   - Status (badge colorido)
   - Início do período
   - Fim do período
   - Gateway ID (truncado)

#### 5.4 Paginação

1. Se houver mais de 20 assinaturas:
2. ✅ Verifique que a paginação aparece
3. Clique em "Próxima" → ✅ Carrega próxima página
4. Clique em "Anterior" → ✅ Volta para página anterior
5. ✅ Verifique o indicador "Página X de Y"

**Endpoints testados:**
- `GET /api/admin/subscriptions?page=1&limit=20&status=active`
- `GET /api/admin/subscriptions/stats`

---

### Teste 6: Relatórios

**URL:** `http://localhost:5173/admin/reports`

**O que testar:**

#### 6.1 Filtros

1. ✅ Teste o seletor de tipo de relatório:
   - Visão Geral
   - Assinaturas
   - Cursos
   - Financeiro

2. ✅ Teste os filtros de data:
   - Selecione uma data de início
   - Selecione uma data de fim
   - Verifique que os dados são atualizados

#### 6.2 Relatório de Assinaturas

1. Selecione "Assinaturas"
2. ✅ Verifique as métricas:
   - Total Ativas
   - Novas este Mês
   - Canceladas este Mês
   - Taxa de Retenção (%)
   - Taxa de Churn (%)

#### 6.3 Relatório de Cursos

1. Selecione "Cursos"
2. ✅ Verifique as métricas:
   - Total Publicados
   - Total de Matrículas
   - Taxa Média de Conclusão (%)
3. ✅ Verifique a seção "Cursos Mais Acessados":
   - Lista com ranking (1, 2, 3...)
   - Nome do curso
   - Número de acessos

#### 6.4 Relatório Financeiro

1. Selecione "Financeiro"
2. ✅ Verifique as métricas:
   - MRR (Receita Mensal Recorrente)
   - Receita Total
   - Receita Média por Usuário
   - Projeção Anual

#### 6.5 Exportar Relatórios

1. Clique em "Exportar CSV"
2. ✅ Verifique que o arquivo CSV é baixado
3. ✅ Abra o arquivo e verifique o conteúdo

4. Clique em "Exportar PDF"
5. ✅ Verifique que o arquivo PDF é baixado
6. ✅ Abra o arquivo e verifique o conteúdo

**Endpoints testados:**
- `GET /api/admin/reports/overview?startDate=X&endDate=Y`
- `GET /api/admin/reports/subscriptions?startDate=X&endDate=Y`
- `GET /api/admin/reports/courses?startDate=X&endDate=Y`
- `GET /api/admin/reports/financial?startDate=X&endDate=Y`
- `GET /api/admin/reports/export?format=csv&type=X`
- `GET /api/admin/reports/export?format=pdf&type=X`

---

## 🧪 Testes de Responsividade

### Desktop (> 1024px)
1. ✅ Verifique que os grids mostram 4 colunas
2. ✅ Verifique que as tabelas são totalmente visíveis
3. ✅ Verifique que os modais são centralizados

### Tablet (640px - 1024px)
1. Redimensione o navegador para ~800px
2. ✅ Verifique que os grids mostram 2 colunas
3. ✅ Verifique que as tabelas têm scroll horizontal
4. ✅ Verifique que os botões são responsivos

### Mobile (< 640px)
1. Redimensione o navegador para ~375px
2. ✅ Verifique que os grids mostram 1 coluna
3. ✅ Verifique que as tabelas têm scroll horizontal
4. ✅ Verifique que os modais ocupam a tela toda
5. ✅ Verifique que o menu de navegação funciona

---

## 🔍 Testes de Estados

### Loading States
1. ✅ Abra o DevTools e vá para Network
2. ✅ Throttle para "Slow 3G"
3. ✅ Recarregue cada página
4. ✅ Verifique que os skeleton screens aparecem

### Error States
1. ✅ Pare o backend
2. ✅ Tente acessar qualquer página admin
3. ✅ Verifique que mensagens de erro aparecem
4. ✅ Verifique que não há crashes

### Empty States
1. ✅ Aprove todos os cursos pendentes
2. ✅ Verifique a mensagem de "Nenhum curso pendente"
3. ✅ Verifique o ícone e texto apropriados

---

## 🎨 Testes Visuais

### Cores e Badges
1. ✅ Status Ativo → Verde
2. ✅ Status Suspenso → Amarelo
3. ✅ Status Cancelado → Vermelho
4. ✅ Status Pendente → Amarelo

### Ícones
1. ✅ Cada métrica tem um ícone apropriado
2. ✅ Ícones têm cores consistentes com o tema
3. ✅ Ícones são visíveis e claros

### Hover Effects
1. ✅ Cards de métricas têm hover effect
2. ✅ Botões mudam de cor no hover
3. ✅ Links têm hover effect

---

## 🔐 Testes de Segurança

### Proteção de Rotas
1. ✅ Faça logout
2. ✅ Tente acessar `/admin/dashboard` diretamente
3. ✅ Verifique que é redirecionado para login

### Permissões
1. ✅ Faça login como aluno
2. ✅ Tente acessar `/admin/dashboard`
3. ✅ Verifique que recebe erro 403 ou é redirecionado

---

## 📊 Checklist Final

### Dashboard
- [ ] Métricas carregam corretamente
- [ ] Quick actions funcionam
- [ ] Loading states funcionam
- [ ] Navegação funciona

### Instrutores
- [ ] Lista carrega
- [ ] Criar instrutor funciona
- [ ] Suspender funciona
- [ ] Reativar funciona
- [ ] Validação de formulário funciona

### Aprovação de Cursos
- [ ] Lista de pendentes carrega
- [ ] Ver detalhes funciona
- [ ] Aprovar funciona
- [ ] Rejeitar com motivo funciona
- [ ] Estado vazio funciona

### Assinaturas
- [ ] Estatísticas carregam
- [ ] Filtros funcionam
- [ ] Tabela carrega
- [ ] Paginação funciona

### Relatórios
- [ ] Todos os tipos de relatório funcionam
- [ ] Filtros de data funcionam
- [ ] Exportar CSV funciona
- [ ] Exportar PDF funciona
- [ ] Métricas são precisas

### Geral
- [ ] Navegação entre páginas funciona
- [ ] Responsividade funciona
- [ ] Loading states funcionam
- [ ] Error handling funciona
- [ ] Logout funciona

---

## 🐛 Problemas Conhecidos

Se encontrar erros de API (404, 500), verifique:

1. **Backend está rodando?**
   ```bash
   npm run dev
   ```

2. **Rotas admin estão implementadas?**
   - Algumas rotas podem ainda não estar implementadas no backend
   - Verifique os arquivos em `src/modules/*/routes/`

3. **Usuário tem permissão de admin?**
   ```sql
   SELECT * FROM users WHERE email = 'admin@example.com';
   -- role deve ser 'admin'
   ```

---

## 📝 Notas

- As páginas foram implementadas seguindo os padrões das páginas de aluno e instrutor
- Todos os componentes são responsivos
- Estados de loading, erro e vazio estão implementados
- A integração com a API está pronta, mas depende dos endpoints do backend
- Exportação de relatórios usa download de blob

---

## 🚀 Próximos Passos

Após validar o frontend:

1. Implementar os endpoints faltantes no backend
2. Adicionar proteção de rotas (middleware de admin)
3. Implementar testes automatizados
4. Adicionar gráficos nos relatórios (Chart.js ou Recharts)
5. Implementar busca e filtros avançados
6. Adicionar notificações em tempo real
