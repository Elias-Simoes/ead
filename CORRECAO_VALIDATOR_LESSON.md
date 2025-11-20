# Correção - Validator de Lesson

## Problema
Ao tentar salvar uma aula, estava ocorrendo erro 422 (Unprocessable Entity) porque o validator ainda estava exigindo os campos antigos do formato de aula.

## Causa
O validator `lesson.validator.ts` estava configurado para o formato antigo:
- ❌ Exigia `type` (obrigatório)
- ❌ Exigia `content` (obrigatório)
- ❌ Não aceitava os novos campos: `video_url`, `text_content`, `external_link`

## Solução Aplicada

### 1. Atualizado `createLessonSchema`
```typescript
body: z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  
  // Old format (backward compatibility)
  type: z.enum(['video', 'pdf', 'text', 'external_link']).optional(),
  content: z.string().optional(),
  
  // New format (multiple content types)
  video_url: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  video_file_key: z.string().nullable().optional(),
  text_content: z.string().nullable().optional(),
  pdf_file_key: z.string().nullable().optional(),
  pdf_url: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  external_link: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  
  duration: z.number().int().positive().optional(),
  order_index: z.number().int().nonnegative().optional(),
})
.refine(
  (data) => {
    // At least one content type must be provided
    return (
      data.content ||
      (data.video_url && data.video_url !== '') ||
      data.text_content ||
      (data.external_link && data.external_link !== '') ||
      (data.pdf_url && data.pdf_url !== '')
    );
  },
  {
    message: 'At least one content type must be provided',
  }
)
```

### 2. Atualizado `updateLessonSchema`
Mesma lógica, mas todos os campos opcionais (sem o refine).

## Mudanças Principais

1. **Campos Antigos Opcionais**
   - `type` e `content` agora são opcionais
   - Mantidos para compatibilidade com aulas antigas

2. **Novos Campos Adicionados**
   - `video_url`: URL do vídeo (YouTube, Vimeo, etc.)
   - `text_content`: Conteúdo em texto (JSON do EditorJS)
   - `external_link`: Link externo
   - `pdf_url`: URL do PDF
   - `video_file_key` e `pdf_file_key`: Chaves R2 para arquivos

3. **Validação de URLs**
   - Aceita URL válida, string vazia ou null
   - Usa `z.union([z.string().url(), z.literal(''), z.null()])`

4. **Validação de Conteúdo**
   - Pelo menos um tipo de conteúdo deve ser fornecido
   - Verifica se há `content` OU `video_url` OU `text_content` OU `external_link` OU `pdf_url`

## Formato Aceito Agora

### Criar Aula (POST)
```json
{
  "title": "Introdução ao React",
  "description": "Primeira aula do curso",
  "duration": 30,
  "video_url": "https://youtube.com/watch?v=...",
  "text_content": "{\"blocks\":[...]}",
  "external_link": null
}
```

### Atualizar Aula (PATCH)
```json
{
  "title": "Introdução ao React - Atualizado",
  "text_content": "{\"blocks\":[...]}"
}
```

## Teste

1. Acesse a página de criação de aula
2. Preencha título e descrição
3. Adicione conteúdo em texto usando o EditorJS
4. Clique em "Criar Aula"
5. ✅ Deve salvar com sucesso

## Status
✅ Validator atualizado
✅ Backend recarregado
✅ Pronto para teste

## Próximos Passos
- Testar criação de aula com diferentes tipos de conteúdo
- Testar edição de aula existente
- Testar validação (tentar salvar sem nenhum conteúdo)
