# Correção - Migração 023 Não Executada

## Problema
Ao tentar salvar uma aula, estava ocorrendo erro 500 (Internal Server Error) com a mensagem:
```
column "video_url" of relation "lessons" does not exist
```

## Causa
A migração 023 que adiciona as novas colunas à tabela `lessons` não havia sido executada no banco de dados.

### Colunas que faltavam:
- `video_url` - URL do vídeo (YouTube, Vimeo, etc.)
- `video_file_key` - Chave R2 para vídeo uploadado
- `text_content` - Conteúdo em texto (JSON do EditorJS)
- `pdf_file_key` - Chave R2 para PDF uploadado
- `pdf_url` - URL do PDF (se hospedado externamente)
- `external_link` - Link externo para recursos adicionais

## Solução
Executada a migração 023 manualmente:

```bash
node scripts/run-migration-023.js
```

### O que a migração faz:

1. **Adiciona novas colunas** à tabela `lessons`:
   ```sql
   ALTER TABLE lessons 
     ADD COLUMN IF NOT EXISTS video_url TEXT,
     ADD COLUMN IF NOT EXISTS video_file_key TEXT,
     ADD COLUMN IF NOT EXISTS text_content TEXT,
     ADD COLUMN IF NOT EXISTS pdf_file_key TEXT,
     ADD COLUMN IF NOT EXISTS pdf_url TEXT,
     ADD COLUMN IF NOT EXISTS external_link TEXT;
   ```

2. **Migra dados existentes** do formato antigo para o novo:
   ```sql
   UPDATE lessons 
   SET 
     video_url = CASE WHEN type = 'video' THEN content ELSE NULL END,
     text_content = CASE WHEN type = 'text' THEN content ELSE NULL END,
     pdf_url = CASE WHEN type = 'pdf' THEN content ELSE NULL END,
     external_link = CASE WHEN type = 'external_link' THEN content ELSE NULL END
   WHERE content IS NOT NULL;
   ```

3. **Mantém colunas antigas** (`type` e `content`) para compatibilidade

## Estrutura da Tabela Lessons Agora

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Old format (backward compatibility)
  type VARCHAR(20),
  content TEXT,
  
  -- New format (multiple content types)
  video_url TEXT,
  video_file_key TEXT,
  text_content TEXT,
  pdf_file_key TEXT,
  pdf_url TEXT,
  external_link TEXT,
  
  duration INTEGER,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Migrações Executadas

✅ Migração 023 - Adiciona campos de múltiplos conteúdos
✅ Migração 024 - Cria tabela `lesson_resources`

## Teste
1. Preencha título e descrição da aula
2. Adicione conteúdo no EditorJS
3. Clique em "Criar Aula"
4. ✅ Deve salvar com sucesso!

## Status
✅ Migração 023 executada
✅ Banco de dados atualizado
✅ Backend funcionando
✅ Pronto para criar aulas

## Nota Importante
Se você clonar o projeto ou resetar o banco de dados, lembre-se de executar TODAS as migrações na ordem:
```bash
node scripts/run-migration-001.js
node scripts/run-migration-002.js
...
node scripts/run-migration-023.js
node scripts/run-migration-024.js
```

Ou criar um script que execute todas de uma vez.
