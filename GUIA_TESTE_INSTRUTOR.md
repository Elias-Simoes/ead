# Guia Completo de Teste - Jornada do Instrutor

## 🎓 Credenciais do Instrutor

```
📧 Email: instructor@example.com
🔑 Password: Instructor123!
👤 Nome: Professor João Silva
```

## 🚀 Jornada Completa do Instrutor

### 1. Login e Dashboard

1. Acesse: http://localhost:5173
2. Faça login com as credenciais acima
3. Você será redirecionado para: `/instructor/dashboard`

**O que verificar:**
- ✅ Cards com estatísticas (Total de Cursos, Alunos Ativos, Taxa de Conclusão, Receita)
- ✅ Lista de cursos recentes
- ✅ Navegação no menu (Dashboard, Meus Cursos, Novo Curso)

---

### 2. Criar um Novo Curso

1. Clique em **"Novo Curso"** no menu ou no botão do dashboard
2. Preencha o formulário:
   - **Título:** "Curso de React Avançado"
   - **Descrição:** "Aprenda React do zero ao avançado"
   - **Categoria:** "Programação"
   - **Nível:** "Intermediário"
   - **Duração estimada:** 40 horas
   - **Preço:** R$ 199.90
   - **Thumbnail URL:** https://via.placeholder.com/400x300
3. Clique em **"Criar Curso"**

**O que verificar:**
- ✅ Formulário valida campos obrigatórios
- ✅ Curso é criado com sucesso
- ✅ Redirecionamento para a página de módulos do curso

---

### 3. Adicionar Módulos ao Curso

1. Na página do curso, clique em **"Adicionar Módulo"**
2. Preencha:
   - **Título:** "Introdução ao React"
   - **Descrição:** "Conceitos básicos do React"
   - **Ordem:** 1
3. Clique em **"Salvar"**
4. Repita para criar mais módulos:
   - Módulo 2: "Hooks e Estado"
   - Módulo 3: "Context API"
   - Módulo 4: "React Router"

**O que verificar:**
- ✅ Módulos aparecem na lista
- ✅ Ordem dos módulos está correta
- ✅ Pode editar e excluir módulos

---

### 4. Adicionar Aulas aos Módulos

1. Clique em um módulo para expandir
2. Clique em **"Adicionar Aula"**
3. Preencha:
   - **Título:** "O que é React?"
   - **Descrição:** "Introdução ao React e seus conceitos"
   - **Tipo:** "video"
   - **Duração:** 15 minutos
   - **Conteúdo/URL:** https://www.youtube.com/watch?v=exemplo
   - **Ordem:** 1
4. Clique em **"Salvar"**
5. Adicione mais aulas ao módulo

**O que verificar:**
- ✅ Aulas aparecem dentro do módulo
- ✅ Pode adicionar diferentes tipos (video, text, quiz)
- ✅ Pode reordenar aulas
- ✅ Pode editar e excluir aulas

---

### 5. Criar Avaliações

1. No menu, clique em **"Avaliações"**
2. Clique em **"Nova Avaliação"**
3. Preencha:
   - **Título:** "Avaliação Final - React"
   - **Descrição:** "Teste seus conhecimentos"
   - **Curso:** Selecione o curso criado
   - **Módulo:** (Opcional) Selecione um módulo
   - **Nota mínima:** 70
   - **Duração:** 60 minutos
4. Clique em **"Criar Avaliação"**

**O que verificar:**
- ✅ Avaliação é criada
- ✅ Redirecionamento para adicionar questões

---

### 6. Adicionar Questões à Avaliação

1. Na página da avaliação, clique em **"Adicionar Questão"**
2. Preencha:
   - **Tipo:** "multiple_choice"
   - **Pergunta:** "O que é JSX?"
   - **Pontos:** 10
   - **Opções:**
     - A) Uma linguagem de programação
     - B) Uma extensão de sintaxe para JavaScript ✓
     - C) Um framework
     - D) Uma biblioteca CSS
3. Marque a opção correta (B)
4. Clique em **"Salvar"**
5. Adicione mais 4-5 questões

**O que verificar:**
- ✅ Questões aparecem na lista
- ✅ Pode editar e excluir questões
- ✅ Total de pontos é calculado automaticamente

---

### 7. Publicar o Curso

1. Volte para **"Meus Cursos"**
2. Encontre o curso criado
3. Clique em **"Publicar"** ou mude o status para "published"

**O que verificar:**
- ✅ Status do curso muda para "Publicado"
- ✅ Curso aparece na listagem pública
- ✅ Alunos podem se inscrever

---

### 8. Visualizar Alunos Inscritos

1. No curso, clique em **"Alunos"**
2. Veja a lista de alunos inscritos

**O que verificar:**
- ✅ Lista de alunos com nome, email, progresso
- ✅ Pode ver detalhes de cada aluno
- ✅ Pode ver o progresso individual

---

### 9. Corrigir Avaliações

1. No menu, clique em **"Correções"** ou **"Avaliações Pendentes"**
2. Veja as avaliações submetidas pelos alunos
3. Para questões dissertativas, adicione feedback e nota
4. Clique em **"Salvar Correção"**

**O que verificar:**
- ✅ Lista de avaliações pendentes
- ✅ Pode ver respostas dos alunos
- ✅ Pode adicionar feedback
- ✅ Nota é calculada automaticamente

---

### 10. Acompanhar Estatísticas

1. Volte para o **Dashboard**
2. Veja as estatísticas atualizadas:
   - Total de cursos
   - Alunos ativos
   - Taxa de conclusão
   - Receita gerada

**O que verificar:**
- ✅ Estatísticas são atualizadas em tempo real
- ✅ Gráficos mostram dados corretos
- ✅ Pode filtrar por período

---

## 🎯 Páginas do Instrutor

### Páginas Implementadas:
1. ✅ `/instructor/dashboard` - Dashboard com estatísticas
2. ✅ `/instructor/courses` - Lista de cursos
3. ✅ `/instructor/courses/new` - Criar novo curso
4. ✅ `/instructor/courses/:id/edit` - Editar curso
5. ✅ `/instructor/courses/:id/modules` - Gerenciar módulos
6. ✅ `/instructor/courses/:id/students` - Ver alunos
7. ✅ `/instructor/assessments` - Gerenciar avaliações
8. ✅ `/instructor/assessments/:id/grade` - Corrigir avaliações

---

## 🧪 Testes Automatizados

Para testar a API do instrutor:

```bash
# Testar criação de curso
node test-courses-comprehensive.js

# Testar avaliações
node test-assessments.js

# Testar tracking de instrutor
node test-instructor-tracking.js
```

---

## 🐛 Problemas Comuns

### Erro ao criar curso
- Verifique se está logado como instrutor
- Verifique se todos os campos obrigatórios estão preenchidos

### Módulos não aparecem
- Recarregue a página (F5)
- Verifique se o curso foi salvo corretamente

### Não consegue publicar curso
- Verifique se o curso tem pelo menos 1 módulo
- Verifique se o módulo tem pelo menos 1 aula

---

## 📝 Checklist de Teste

- [ ] Login como instrutor
- [ ] Dashboard carrega corretamente
- [ ] Criar novo curso
- [ ] Adicionar módulos ao curso
- [ ] Adicionar aulas aos módulos
- [ ] Criar avaliação
- [ ] Adicionar questões à avaliação
- [ ] Publicar curso
- [ ] Ver lista de alunos
- [ ] Corrigir avaliações
- [ ] Ver estatísticas atualizadas

---

## 🎉 Próximos Passos

Após validar a jornada do instrutor:
1. Testar a jornada do aluno
2. Testar interação entre instrutor e aluno
3. Testar certificados
4. Testar relatórios

---

## 📞 Suporte

Se encontrar algum problema:
1. Verifique o console do navegador (F12)
2. Verifique os logs do backend
3. Tire prints e me envie para análise
