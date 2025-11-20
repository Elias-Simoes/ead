# Implementação de Recursos da Aula

## Resumo das Mudanças

Implementamos um sistema completo de gerenciamento de recursos para aulas, removendo os plugins de imagem do EditorJS e criando uma seção dedicada para CRUD de recursos.

### Backend

1. **Nova Migração (024)**
   - Criada tabela `lesson_resources` para armazenar recursos da aula
   - Suporta tipos: image, pdf, video, link
   - Campos: title, description, file_key, url, file_size, mime_type, order_index

2. **Novo Service: LessonResourceService**
   - `createResources()` - Criar múltiplos recursos
   - `getResourcesByLessonId()` - Listar recursos de uma aula
   - `getResourceById()` - Buscar recurso específico
   - `updateResource()` - Atualizar recurso
   - `deleteResource()` - Deletar recurso

3. **Novo Controller: LessonResourceController**
   - Endpoints para CRUD completo de recursos
   - Verificação de permissões (apenas instrutor dono do curso)

4. **Novas Rotas**
   - POST `/api/courses/lessons/:lessonId/resources` - Criar recursos
   - GET `/api/courses/lessons/:lessonId/resources` - Listar recursos
   - GET `/api/courses/resources/:resourceId` - Buscar recurso
   - PATCH `/api/courses/resources/:resourceId` - Atualizar recurso
   - DELETE `/api/courses/resources/:resourceId` - Deletar recurso

5. **Atualização no LessonService**
   - Método `getLessonById()` agora retorna `instructor_id` via JOIN

### Frontend

1. **EditorJS Simplificado**
   - Removido plugin `SimpleImage`
   - Removida função `uploadBase64ImagesToR2`
   - Editor focado apenas em texto rico (títulos, listas, código, citações, links)

2. **Novo Componente: LessonResourcesManager**
   - Interface para adicionar/remover recursos
   - Suporta 4 tipos: Imagem, PDF, Vídeo, Link
   - Upload automático para R2 (exceto links)
   - Preview de recursos adicionados
   - Drag and drop para arquivos

3. **LessonFormPage Atualizado**
   - Removidas seções de upload de vídeo e PDF inline
   - Nova seção "Recursos da Aula" com o componente LessonResourcesManager
   - Mantido: Vídeo URL, Texto (EditorJS), Link Externo
   - Adicionado: Gerenciamento de recursos separado

## Estrutura da Aula Agora

Uma aula pode ter:
- ✅ **Vídeo** (URL do YouTube/Vimeo)
- ✅ **Texto Rico** (EditorJS sem imagens)
- ✅ **Link Externo** (URL de recurso externo)
- ✅ **Recursos** (lista separada):
  - 🖼️ Imagens
  - 📄 PDFs
  - 🎥 Vídeos (upload)
  - 🔗 Links adicionais

## Benefícios

1. **Separação de Responsabilidades**
   - EditorJS focado em texto
   - Recursos gerenciados separadamente

2. **Melhor UX**
   - Interface clara para cada tipo de conteúdo
   - Upload mais confiável (sem base64)
   - Preview de recursos

3. **Escalabilidade**
   - Fácil adicionar novos tipos de recursos
   - Recursos podem ser reordenados
   - Metadados completos (tamanho, tipo MIME, etc.)

4. **Performance**
   - Uploads diretos para R2
   - Sem conversões base64
   - Carregamento otimizado

## Próximos Passos

1. Testar criação de aula com recursos
2. Testar edição de aula existente
3. Implementar visualização de recursos no player da aula
4. Adicionar reordenação de recursos (drag and drop)
5. Implementar preview de PDFs e vídeos

## Como Testar

1. Acesse a página de criação/edição de aula
2. Preencha título e descrição
3. Adicione conteúdo em texto usando o EditorJS
4. Na seção "Recursos da Aula", clique em "Adicionar Recurso"
5. Escolha o tipo (Imagem, PDF, Vídeo ou Link)
6. Preencha título e descrição
7. Faça upload do arquivo ou cole a URL
8. Clique em "Adicionar"
9. Salve a aula

Os recursos serão salvos separadamente e associados à aula.
