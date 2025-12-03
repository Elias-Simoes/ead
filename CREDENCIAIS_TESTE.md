# Credenciais para Teste - Plataforma EAD

## URLs de Acesso

### Frontend
- **URL**: http://localhost:5173
- **Status**: ✅ Rodando

### Backend
- **URL**: http://localhost:3000
- **Status**: ✅ Rodando

## Credenciais de Acesso

### Instrutor (Professor)
- **Email**: `instructor@example.com`
- **Senha**: `Senha123!`
- **Funcionalidades**:
  - Criar e gerenciar cursos
  - Adicionar módulos e aulas
  - Upload de imagens de capa
  - Visualizar dashboard com estatísticas
  - Gerenciar alunos

### Admin (Administrador)
- **Email**: `admin@example.com`
- **Senha**: `Admin123!`
- **Funcionalidades**:
  - Aprovar/rejeitar cursos
  - Gerenciar instrutores
  - Gerenciar assinaturas
  - Visualizar relatórios
  - Acesso completo ao sistema

### Aluno (Estudante) - Assinatura Ativa
- **Email**: `student@example.com`
- **Senha**: `Student123!`
- **Status**: ✅ Assinatura ativa até 22/11/2026
- **Funcionalidades**:
  - Visualizar cursos disponíveis
  - Inscrever-se em cursos
  - **Acessar conteúdo das aulas** ✅
  - Acompanhar progresso
  - Fazer avaliações
  - Obter certificados

### Aluno (Estudante) - Assinatura Vencida
- **Email**: `expired@example.com`
- **Senha**: `Expired123!`
- **Status**: ❌ Assinatura vencida (expirou há 30 dias)
- **Uso**: Testar avisos de assinatura vencida
- **Comportamento Esperado**:
  - ⚠️ Vê aviso amarelo no topo das páginas
  - ✅ Pode ver catálogo de cursos
  - ❌ Não pode acessar conteúdo das aulas (erro 403)
  - ❌ Não pode fazer avaliações

## Como Iniciar o Sistema

### 1. Iniciar o Banco de Dados PostgreSQL
```bash
# Certifique-se de que o PostgreSQL está rodando
# Porta padrão: 5432
```

### 2. Backend já está tentando iniciar
O backend está configurado para rodar automaticamente quando o banco estiver disponível.

### 3. Frontend
✅ Já está rodando em http://localhost:5173

## Funcionalidades Testadas Recentemente

### ✅ Correções Implementadas
1. **Imagens de Cursos**: Agora aparecem corretamente nos cards
2. **Títulos no Dashboard**: Dashboard do instrutor mostra títulos corretos
3. **Rotas de Módulos/Aulas**: Corrigidas para usar prefixo `/courses`
4. **Aulas na Lista**: Aulas aparecem após serem criadas

### 🎯 Fluxo de Teste Sugerido

#### Como Instrutor:
1. Fazer login com `instructor@example.com`
2. Acessar "Dashboard" para ver estatísticas
3. Clicar em "Criar Novo Curso"
4. Preencher dados do curso e fazer upload de imagem
5. Salvar o curso
6. Acessar "Gerenciar Módulos" do curso criado
7. Adicionar um módulo
8. Adicionar aulas ao módulo
9. Verificar se as aulas aparecem na lista

#### Como Admin:
1. Fazer login com `admin@example.com`
2. Acessar "Dashboard Admin"
3. Ver cursos pendentes de aprovação
4. Gerenciar instrutores
5. Visualizar relatórios

#### Como Aluno:
1. Fazer login com `student@example.com`
2. Explorar cursos disponíveis
3. Inscrever-se em um curso
4. Acompanhar progresso

## Observações Importantes

### Cache do Navegador
Se algo não aparecer após uma mudança:
1. Limpar cache (Ctrl+Shift+Delete)
2. Fazer hard refresh (Ctrl+F5)
3. Ou abrir em aba anônima

### Banco de Dados
O sistema precisa do PostgreSQL rodando para funcionar completamente.
- **Host**: localhost
- **Porta**: 5432
- **Database**: Configurado no .env

### Imagens
As imagens são armazenadas no Cloudflare R2:
- **CDN URL**: https://pub-b67f028d705042b2854ddf5ad2cae8a9.r2.dev/

## Suporte

Se encontrar algum problema:
1. Verificar se o banco de dados está rodando
2. Verificar logs do backend no terminal
3. Verificar console do navegador (F12)
4. Limpar cache do navegador

## Status dos Serviços

- ✅ Frontend: Rodando em http://localhost:5173
- ✅ Backend: Rodando em http://localhost:3000
- ✅ PostgreSQL: Conectado com sucesso
- ✅ Redis: Conectado com sucesso
