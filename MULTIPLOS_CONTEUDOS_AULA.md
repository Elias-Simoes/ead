# Suporte a Múltiplos Conteúdos por Aula

## Mudança Implementada

O sistema agora suporta **múltiplos tipos de conteúdo em uma única aula**. O instrutor pode adicionar:
- ✅ Vídeo (link do YouTube/Vimeo)
- ✅ Texto (conteúdo escrito/markdown)
- ✅ Link Externo (recursos adicionais)
- 🔄 PDF (upload - em desenvolvimento)
- 🔄 Vídeo (upload - em desenvolvimento)

## Arquitetura

### Backend

#### Migration: `023_add_multiple_content_to_lessons.sql`
Adiciona novos campos à tabela `lessons`:
- `video_url` - URL de vídeo externo
- `video_file_key` - Chave R2 para vídeo enviado
- `text_content` - Conteúdo textual
- `pdf_file_key` - Chave R2 para PDF enviado
- `pdf_url` - URL de PDF externo
- `external_link` - Link para recurso externo

Os campos antigos (`type` e `content`) são mantidos para compatibilidade.

#### Service: `lesson.service.ts`
- **Interfaces atualizadas** para suportar múltiplos campos
- **createLesson()** - Salva todos os conteúdos preenchidos
- **updateLesson()** - Atualiza todos os campos de conteúdo
- **Backward compatibility** - Mantém suporte ao formato antigo

### Frontend

#### Formulário: `LessonFormPage.tsx`
- **Estado do formulário** inclui todos os tipos de conteúdo
- **Validação** - Requer pelo menos um tipo de conteúdo
- **Submit** - Envia TODOS os conteúdos preenchidos ao backend
- **Layout em seções** - Cada tipo de conteúdo tem sua própria seção

## Como Funciona

### Criação de Aula

1. Instrutor preenche informações básicas (título, descrição, duração)
2. Instrutor adiciona conteúdo em uma ou mais seções:
   - **Vídeo**: Cola URL do YouTube/Vimeo
   - **Texto**: Escreve conteúdo textual
   - **Link Externo**: Adiciona URL de recurso
3. Sistema valida que pelo menos um conteúdo foi preenchido
4. Backend salva TODOS os conteúdos preenchidos

### Exemplo de Payload

```json
{
  "title": "Introdução ao React",
  "description": "Aprenda os conceitos básicos",
  "duration": 45,
  "video_url": "https://www.youtube.com/watch?v=abc123",
  "text_content": "# Conceitos Básicos\n\nReact é uma biblioteca...",
  "external_link": "https://react.dev/learn"
}
```

### Banco de Dados

```sql
-- Uma aula pode ter múltiplos conteúdos
INSERT INTO lessons (
  title, description, duration,
  video_url, text_content, external_link
) VALUES (
  'Introdução ao React',
  'Aprenda os conceitos básicos',
  45,
  'https://youtube.com/watch?v=abc',
  '# Conceitos\n\nReact é...',
  'https://react.dev/learn'
);
```

## Benefícios

### Para Instrutores
- ✅ Aulas mais ricas e completas
- ✅ Flexibilidade para combinar diferentes mídias
- ✅ Não precisa escolher apenas um tipo
- ✅ Pode adicionar materiais complementares

### Para Alunos
- ✅ Múltiplas formas de aprender (vídeo + texto)
- ✅ Materiais de apoio na mesma aula
- ✅ Links para recursos externos
- ✅ Experiência de aprendizado mais completa

### Exemplos de Uso

#### Aula Completa
- **Vídeo**: Explicação em vídeo do conceito
- **Texto**: Resumo escrito e código de exemplo
- **Link**: Documentação oficial para referência

#### Aula Teórica
- **Texto**: Conteúdo teórico detalhado
- **Link**: Artigos e papers relacionados

#### Aula Prática
- **Vídeo**: Demonstração prática
- **Texto**: Passo a passo escrito
- **Link**: Repositório GitHub com código

## Compatibilidade

### Backward Compatibility
- ✅ Aulas antigas continuam funcionando
- ✅ Campos `type` e `content` mantidos
- ✅ Migration migra dados antigos automaticamente

### Forward Compatibility
- ✅ Preparado para uploads de arquivo
- ✅ Estrutura extensível para novos tipos
- ✅ Player de aula pode ser atualizado gradualmente

## Próximos Passos

### Upload de Arquivos
- [ ] Implementar upload de vídeo para R2
- [ ] Implementar upload de PDF para R2
- [ ] Barra de progresso durante upload
- [ ] Validação de tamanho e formato

### Player de Aula
- [ ] Atualizar player para exibir múltiplos conteúdos
- [ ] Tabs ou seções para cada tipo de conteúdo
- [ ] Navegação entre conteúdos
- [ ] Marcação de progresso por conteúdo

### Editor de Texto
- [ ] Implementar editor Markdown
- [ ] Preview em tempo real
- [ ] Suporte para imagens inline
- [ ] Syntax highlighting para código

## Migração Manual

Se o psql não estiver disponível, execute a migration manualmente:

```sql
-- Conecte ao banco de dados e execute:
ALTER TABLE lessons 
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_file_key TEXT,
  ADD COLUMN IF NOT EXISTS text_content TEXT,
  ADD COLUMN IF NOT EXISTS pdf_file_key TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Migrar dados existentes
UPDATE lessons 
SET 
  video_url = CASE WHEN type = 'video' THEN content ELSE NULL END,
  text_content = CASE WHEN type = 'text' THEN content ELSE NULL END,
  pdf_url = CASE WHEN type = 'pdf' THEN content ELSE NULL END,
  external_link = CASE WHEN type = 'external_link' THEN content ELSE NULL END
WHERE content IS NOT NULL;
```

## Testando

1. Acesse a página de gerenciamento de módulos
2. Clique em "+ Adicionar Aula"
3. Preencha título e descrição
4. Adicione conteúdo em múltiplas seções:
   - Cole um link do YouTube
   - Escreva algum texto
   - Adicione um link externo
5. Clique em "Criar Aula"
6. Verifique que todos os conteúdos foram salvos

## Arquivos Modificados

### Backend
- `scripts/migrations/023_add_multiple_content_to_lessons.sql` (novo)
- `src/modules/courses/services/lesson.service.ts` (atualizado)

### Frontend
- `frontend/src/pages/instructor/LessonFormPage.tsx` (atualizado)

## Status

✅ Backend atualizado e rodando
✅ Frontend atualizado
✅ Migration criada
⚠️ Migration precisa ser executada manualmente (psql não encontrado)
🔄 Upload de arquivos em desenvolvimento
🔄 Player de aula precisa ser atualizado

## Observações Importantes

- O sistema agora salva **TODOS** os conteúdos preenchidos
- Não há mais prioridade - todos são salvos simultaneamente
- O instrutor decide quais conteúdos adicionar
- Pelo menos um conteúdo é obrigatório
- Upload de arquivos mostra mensagem informativa
