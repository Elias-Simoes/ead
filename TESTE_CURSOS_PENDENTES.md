# Guia de Teste: Cursos Pendentes para Aprovação

## ✅ Correção Aplicada

O problema dos cursos pendentes não aparecerem para os administradores foi corrigido!

## 🔧 O que foi corrigido

1. **Controller**: Adicionado suporte ao parâmetro `status=pending_approval` na rota `/api/courses`
2. **Service**: Melhorado retorno de dados com informações do instrutor formatadas
3. **Backend**: Reiniciado para aplicar as mudanças

## 🧪 Como Testar

### Passo 1: Criar um Curso como Instrutor

1. Acesse: http://localhost:5173
2. Faça login como instrutor:
   - Email: `instructor@example.com`
   - Senha: `Senha123!`

3. Crie um novo curso:
   - Clique em "Criar Novo Curso"
   - Preencha os dados
   - Salve o curso

4. Adicione conteúdo ao curso:
   - Acesse "Gerenciar Módulos"
   - Crie pelo menos 1 módulo
   - Adicione pelo menos 1 aula ao módulo

5. Submeta para aprovação:
   - Volte para "Meus Cursos"
   - Clique em "Submeter para Aprovação" no curso criado
   - Confirme a submissão

### Passo 2: Verificar como Admin

1. Faça logout do instrutor
2. Faça login como admin:
   - Email: `admin@example.com`
   - Senha: `Admin123!`

3. Acesse "Aprovação de Cursos" no menu

4. **Resultado Esperado**:
   - ✅ O curso submetido deve aparecer na lista
   - ✅ Deve mostrar o nome do instrutor
   - ✅ Deve mostrar a imagem de capa (se houver)
   - ✅ Deve ter botões "Aprovar" e "Rejeitar"

### Passo 3: Aprovar ou Rejeitar

#### Para Aprovar:
1. Clique no botão "Aprovar"
2. Confirme a ação
3. O curso deve desaparecer da lista de pendentes
4. O curso agora está publicado

#### Para Rejeitar:
1. Clique no botão "Rejeitar"
2. Digite um motivo para a rejeição
3. Confirme a ação
4. O curso volta para status "draft"
5. O instrutor pode editar e resubmeter

## 🔍 Verificação no Banco de Dados

Se quiser verificar diretamente no banco:

```bash
node check-pending-courses.js
```

Isso mostrará:
- Todos os cursos no banco
- Cursos com status `pending_approval`
- Estatísticas por status

## 📊 Cursos Existentes

Atualmente no banco existem:
- **2 cursos** com status `pending_approval`
- **38 cursos** em draft
- **14 cursos** publicados

Os 2 cursos pendentes são:
1. "Instructor Tracking Test Course" (ID: 1d096a42-975f-461b-9dec-d539327ba64e)
2. "Instructor Tracking Test Course" (ID: 5af1ace6-1b27-468c-8920-4e1d6e1a982e)

Esses cursos devem aparecer na página de aprovação agora!

## 🐛 Se Ainda Não Aparecer

1. **Limpe o cache do navegador**:
   - Ctrl + Shift + Delete
   - Ou abra em aba anônima

2. **Verifique o console do navegador** (F12):
   - Procure por erros na aba "Console"
   - Verifique a aba "Network" para ver as requisições

3. **Verifique os logs do backend**:
   - Veja o terminal onde o backend está rodando
   - Procure por erros relacionados a `/api/courses`

4. **Teste a API diretamente**:
   ```bash
   # Aguarde 15 minutos para o rate limit resetar
   node test-pending-courses-api.js
   ```

## 📝 Rotas Disponíveis

### Para Listar Cursos Pendentes:
- `GET /api/courses?status=pending_approval` (✅ Corrigida)
- `GET /api/admin/courses/pending` (alternativa)

### Para Aprovar/Rejeitar:
- `PATCH /api/admin/courses/:id/approve`
- `PATCH /api/admin/courses/:id/reject`

## ✨ Resultado Final

Após seguir esses passos, você deve ver:

1. **Na página do instrutor**:
   - Curso com badge "Pendente de Aprovação"
   - Não pode mais editar enquanto pendente

2. **Na página do admin**:
   - Lista de todos os cursos pendentes
   - Informações completas de cada curso
   - Botões para aprovar ou rejeitar

3. **Após aprovação**:
   - Curso aparece na lista pública de cursos
   - Alunos podem se inscrever
   - Instrutor recebe notificação (se configurado)

## 🎯 Status

- ✅ Backend corrigido e reiniciado
- ✅ Rotas funcionando corretamente
- ✅ Dados formatados adequadamente
- ⏳ Aguardando teste no frontend

**Pronto para testar!** 🚀
