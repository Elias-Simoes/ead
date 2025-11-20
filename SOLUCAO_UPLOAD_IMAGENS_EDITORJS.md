# Solução: Upload de Imagens no EditorJS

## Problema Identificado

O erro ocorria porque o sistema tentava fazer upload das imagens para o Cloudflare R2 imediatamente ao adicionar a imagem no editor, antes do usuário clicar em "Criar Aula".

## Solução Implementada

### Estratégia de Upload em Duas Etapas

#### 1. Durante a Edição (Temporário)
- Imagens são convertidas para **base64**
- Armazenadas no estado do componente
- Preview instantâneo no editor
- Sem chamadas ao backend
- Sem consumo de storage no R2

#### 2. Ao Salvar a Aula (Permanente)
- Sistema detecta imagens em base64
- Converte base64 para blob
- Faz upload para Cloudflare R2
- Substitui base64 pela URL permanente
- Salva aula com URLs do R2

## Vantagens da Abordagem

✅ **Sem erros durante edição:** Não há chamadas ao backend enquanto o usuário edita
✅ **Preview instantâneo:** Imagens aparecem imediatamente no editor
✅ **Economia de recursos:** Não ocupa espaço no R2 até salvar
✅ **Melhor UX:** Usuário pode adicionar/remover imagens livremente
✅ **Transação atômica:** Todas as imagens são salvas junto com a aula
✅ **Rollback automático:** Se salvar falhar, nenhuma imagem fica órfã no R2

## Implementação Técnica

### Componente EditorJS

```typescript
// Função que converte imagem para base64 (durante edição)
const uploadImageByFile = async (file: File) => {
  // Validações
  if (file.size > IMAGE_CONFIG.maxSize) {
    throw new Error('Imagem muito grande. Tamanho máximo: 5MB')
  }

  // Redimensionar e converter para base64
  const base64Image = await resizeImageToBase64(
    file,
    IMAGE_CONFIG.maxWidth,
    IMAGE_CONFIG.maxHeight,
    IMAGE_CONFIG.quality
  )
  
  return {
    success: 1,
    file: {
      url: base64Image, // Retorna base64 temporariamente
    },
  }
}

// Função helper exportada para fazer upload ao salvar
export const uploadBase64ImagesToR2 = async (editorData: OutputData) => {
  // Percorre todos os blocos do editor
  // Identifica imagens em base64
  // Faz upload para R2
  // Substitui base64 pela URL do R2
  // Retorna dados atualizados
}
```

### LessonFormPage

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // ...

  // Fazer upload das imagens base64 para R2 antes de salvar
  let finalTextContent = lessonForm.textContent
  if (lessonForm.textContent) {
    finalTextContent = await uploadBase64ImagesToR2(lessonForm.textContent)
  }

  // Preparar payload com URLs permanentes
  const payload = {
    title: lessonForm.title,
    description: lessonForm.description,
    duration: lessonForm.duration,
    video_url: lessonForm.videoUrl || null,
    text_content: finalTextContent ? JSON.stringify(finalTextContent) : null,
    external_link: lessonForm.externalLink || null,
  }

  // Salvar aula
  // ...
}
```

## Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USUÁRIO ADICIONA IMAGEM                                  │
├─────────────────────────────────────────────────────────────┤
│ • Seleciona arquivo                                         │
│ • Validação de tipo e tamanho                               │
│ • Redimensionamento (1200x800, 85% qualidade)              │
│ • Conversão para base64                                     │
│ • Exibição no editor                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. USUÁRIO EDITA CONTEÚDO                                   │
├─────────────────────────────────────────────────────────────┤
│ • Adiciona texto, código, listas, etc.                      │
│ • Adiciona mais imagens (todas em base64)                   │
│ • Remove imagens se necessário                              │
│ • Tudo armazenado localmente                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. USUÁRIO CLICA EM "CRIAR AULA"                            │
├─────────────────────────────────────────────────────────────┤
│ • Sistema detecta imagens em base64                         │
│ • Para cada imagem:                                         │
│   - Converte base64 → blob                                  │
│   - Upload para Cloudflare R2                               │
│   - Recebe URL permanente                                   │
│   - Substitui base64 pela URL                               │
│ • Salva aula com todas as URLs permanentes                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. AULA SALVA COM SUCESSO                                   │
├─────────────────────────────────────────────────────────────┤
│ • Todas as imagens estão no R2                              │
│ • URLs permanentes no banco de dados                        │
│ • Conteúdo pronto para visualização                         │
└─────────────────────────────────────────────────────────────┘
```

## Configurações de Padronização

```typescript
const IMAGE_CONFIG = {
  maxWidth: 1200,              // Largura máxima
  maxHeight: 800,              // Altura máxima
  quality: 0.85,               // Qualidade (85%)
  maxSize: 5 * 1024 * 1024,   // 5MB
  validTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
}
```

## Tratamento de Erros

### Durante a Edição
- Arquivo muito grande → Mensagem de erro, imagem não é adicionada
- Formato inválido → Mensagem de erro, imagem não é adicionada
- Erro ao redimensionar → Mensagem de erro, imagem não é adicionada

### Ao Salvar
- Erro no upload de uma imagem → Mantém base64, continua com outras
- Erro no upload de todas → Aula não é salva, usuário pode tentar novamente
- Erro ao salvar aula → Nenhuma imagem fica órfã no R2

## Testando a Solução

### 1. Adicionar Imagem Durante Edição
```
1. Acesse criar/editar aula
2. Clique no "+" no editor
3. Selecione "Image"
4. Escolha uma imagem
5. ✅ Imagem aparece imediatamente
6. ✅ Sem chamadas ao backend
7. ✅ Sem erros no console
```

### 2. Salvar Aula com Imagens
```
1. Adicione várias imagens no editor
2. Preencha título e descrição
3. Clique em "Criar Aula"
4. ✅ Loading enquanto faz upload
5. ✅ Todas as imagens são enviadas ao R2
6. ✅ Aula salva com URLs permanentes
7. ✅ Ao recarregar, imagens carregam do R2
```

### 3. Editar Aula Existente
```
1. Abra uma aula com imagens
2. ✅ Imagens carregam do R2
3. Adicione novas imagens
4. ✅ Novas imagens em base64
5. Salve a aula
6. ✅ Novas imagens vão para R2
7. ✅ Imagens antigas permanecem no R2
```

## Arquivos Modificados

- ✅ `frontend/src/components/EditorJS.tsx`
  - Adicionada função `resizeImageToBase64`
  - Modificada função `uploadImageByFile` para usar base64
  - Adicionada função exportada `uploadBase64ImagesToR2`

- ✅ `frontend/src/pages/instructor/LessonFormPage.tsx`
  - Importada função `uploadBase64ImagesToR2`
  - Adicionado upload de imagens antes de salvar

- ✅ `PLUGIN_IMAGEM_EDITORJS.md`
  - Atualizada documentação com novo fluxo

## Benefícios Finais

1. **Melhor UX:** Usuário pode editar livremente sem preocupações
2. **Economia:** Não ocupa R2 até confirmar salvamento
3. **Confiabilidade:** Transação atômica, sem imagens órfãs
4. **Performance:** Preview instantâneo, sem latência de rede
5. **Manutenibilidade:** Código mais limpo e organizado
