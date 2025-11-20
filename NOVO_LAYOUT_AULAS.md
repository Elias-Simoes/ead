# Novo Layout de Criação/Edição de Aulas

## Mudanças Implementadas

### Antes
- Layout com dropdown para selecionar tipo de conteúdo
- Apenas um tipo de conteúdo por aula
- Interface menos intuitiva

### Depois
- Layout com seções separadas e expansíveis
- Múltiplas opções de conteúdo visíveis simultaneamente
- Interface mais rica e intuitiva

## Novo Layout

### 1. Informações Básicas
- **Título da Aula** (obrigatório)
- **Descrição** (opcional)
- **Duração Estimada** (em minutos)

### 2. Seção de Vídeo 🎥
- **Link do Vídeo**: Cole URL do YouTube, Vimeo, etc.
- **OU Upload de Vídeo**: Arraste e solte ou selecione arquivo
  - Formatos: MP4, MOV, AVI
  - Tamanho máximo: 500MB
  - Status do arquivo selecionado

### 3. Seção de Texto 📝
- **Editor de Texto**: Área grande para conteúdo textual
- Suporte para Markdown (futuro)
- Ideal para explicações, código, tutoriais escritos

### 4. Seção de PDF 📄
- **Upload de Materiais de Apoio**
- Arraste e solte ou selecione arquivo PDF
- Tamanho máximo: 50MB
- Ideal para slides, apostilas, documentos complementares

### 5. Seção de Link Externo 🔗
- **URL de Recurso Externo**
- Links para documentação, exercícios online, etc.

## Lógica de Prioridade

Quando o instrutor salva a aula, o sistema verifica qual conteúdo foi preenchido na seguinte ordem:

1. **Vídeo** (URL ou arquivo)
2. **Texto** (conteúdo textual)
3. **PDF** (arquivo)
4. **Link Externo** (URL)

O primeiro conteúdo encontrado será salvo como o conteúdo principal da aula.

## Funcionalidades Futuras

### Upload de Arquivos
- [ ] Implementar upload de vídeo para R2
- [ ] Implementar upload de PDF para R2
- [ ] Barra de progresso durante upload
- [ ] Validação de tamanho e formato

### Múltiplos Conteúdos
- [ ] Permitir múltiplos tipos de conteúdo em uma única aula
- [ ] Modificar backend para suportar array de conteúdos
- [ ] Atualizar player de aula para exibir todos os conteúdos

### Editor de Texto Rico
- [ ] Implementar editor Markdown
- [ ] Preview em tempo real
- [ ] Suporte para imagens inline
- [ ] Syntax highlighting para código

## Benefícios do Novo Layout

### UX Melhorada
- Todas as opções visíveis de uma vez
- Não precisa alternar entre tipos
- Mais espaço para cada seção
- Visual mais limpo e organizado

### Flexibilidade
- Instrutor pode ver todas as opções disponíveis
- Facilita planejamento do conteúdo
- Preparação para suporte a múltiplos conteúdos

### Profissionalismo
- Interface mais moderna
- Áreas de upload com drag & drop
- Feedback visual claro
- Ícones intuitivos para cada seção

## Compatibilidade

O novo layout mantém compatibilidade com o backend atual:
- Salva apenas um tipo de conteúdo por vez
- Usa a mesma estrutura de dados
- Funciona com as rotas existentes

## Como Testar

1. Acesse a página de gerenciamento de módulos
2. Clique em "+ Adicionar Aula"
3. Preencha as informações básicas
4. Adicione conteúdo em uma ou mais seções:
   - Cole um link do YouTube na seção de vídeo
   - OU escreva texto na seção de texto
   - OU adicione um link externo
5. Clique em "Criar Aula"

## Observações

- Upload de vídeo e PDF ainda não está implementado (mostra mensagem)
- Por enquanto, use links para vídeos (YouTube, Vimeo)
- O sistema salva apenas o primeiro conteúdo encontrado
- Futuras versões suportarão múltiplos conteúdos por aula

## Arquivos Modificados

- `frontend/src/pages/instructor/LessonFormPage.tsx`
  - Novo estado do formulário
  - Novo layout com seções separadas
  - Lógica de prioridade de conteúdo
  - Validação melhorada
  - Áreas de upload com drag & drop
