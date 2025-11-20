# Plugin de Imagem do EditorJS

## Status: ✅ Implementado e Configurado

O plugin de imagem foi instalado e configurado com redimensionamento automático, validação completa e integração com Cloudflare R2.

## Funcionalidades Implementadas

### 1. Upload de Imagens
- Upload por arquivo (arrastar e soltar ou selecionar)
- Upload por URL
- Validação de tipo e tamanho
- Redimensionamento automático
- Armazenamento temporário em base64 durante edição
- Upload para Cloudflare R2 apenas ao salvar a aula

### 2. Padronização Automática de Imagens

Todas as imagens são automaticamente otimizadas antes do upload:

- **Largura máxima:** 1200px
- **Altura máxima:** 800px
- **Qualidade:** 85%
- **Proporção:** Mantida automaticamente (aspect ratio preservado)
- **Tamanho máximo:** 5MB

### 3. Validações

- **Formatos aceitos:** JPG, PNG, GIF, WebP
- **Tamanho máximo:** 5MB (antes do redimensionamento)
- **Autenticação:** Bearer token obrigatório

## Benefícios da Implementação

✅ **Performance:** Imagens otimizadas carregam mais rápido
✅ **Storage:** Reduz uso de espaço no Cloudflare R2 (economia de custos)
✅ **Responsividade:** Funciona bem em todos os dispositivos
✅ **Qualidade:** Mantém qualidade visual adequada para conteúdo educacional
✅ **UX:** Melhor experiência em dispositivos móveis
✅ **Consistência:** Todas as imagens seguem o mesmo padrão
✅ **Eficiência:** Upload apenas ao salvar, não durante edição
✅ **Preview Instantâneo:** Imagens aparecem imediatamente no editor

## Como Usar

### Adicionar Imagem

1. No editor, clique no botão `+` na lateral
2. Selecione "Image" na lista de ferramentas
3. Escolha uma opção:
   - **Upload from computer:** Selecione arquivo local
   - **Paste image URL:** Cole URL de imagem externa
4. Adicione uma legenda opcional

### Editar Imagem

1. Clique na imagem inserida
2. Use os botões de configuração:
   - 🖼️ Adicionar borda
   - ↔️ Esticar imagem (largura total)
   - 🎨 Adicionar fundo colorido
3. Edite a legenda se necessário

## Fluxo de Upload

```
DURANTE A EDIÇÃO:
1. Usuário seleciona imagem
   ↓
2. Validação de tipo (JPG, PNG, GIF, WebP)
   ↓
3. Validação de tamanho (máx 5MB)
   ↓
4. Redimensionamento automático
   - Largura máx: 1200px
   - Altura máx: 800px
   - Qualidade: 85%
   - Mantém proporção
   ↓
5. Conversão para base64 (temporário)
   ↓
6. Imagem exibida no editor

AO CLICAR EM "CRIAR AULA":
1. Sistema detecta imagens em base64
   ↓
2. Converte base64 para blob
   ↓
3. Faz upload para Cloudflare R2
   ↓
4. Substitui base64 pela URL do R2
   ↓
5. Salva aula com URLs permanentes
```

## Configurações Técnicas

### Constantes de Configuração

```typescript
const IMAGE_CONFIG = {
  maxWidth: 1200,        // Largura máxima em pixels
  maxHeight: 800,        // Altura máxima em pixels
  quality: 0.85,         // Qualidade de compressão (0-1)
  maxSize: 5 * 1024 * 1024, // 5MB em bytes
  validTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
}
```

### Endpoint Utilizado

- **URL:** `http://localhost:3000/api/upload`
- **Método:** POST
- **Headers:** Authorization Bearer token
- **Body:** FormData com arquivo redimensionado
- **Quando é chamado:** Apenas ao clicar em "Criar Aula" ou "Salvar"
- **Resposta esperada:**
```json
{
  "data": {
    "url": "https://seu-bucket.r2.cloudflarestorage.com/imagem.jpg"
  }
}
```

### Armazenamento Temporário

Durante a edição, as imagens são armazenadas como **base64** no estado do componente:
- Não consome espaço no R2
- Preview instantâneo no editor
- Sem necessidade de autenticação durante edição
- Upload real apenas ao salvar

## Formato de Dados Salvos

### Durante a Edição (temporário)
```json
{
  "type": "image",
  "data": {
    "file": {
      "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    },
    "caption": "Legenda da imagem (opcional)",
    "withBorder": false,
    "stretched": false,
    "withBackground": false
  }
}
```

### Após Salvar (permanente)
```json
{
  "type": "image",
  "data": {
    "file": {
      "url": "https://seu-bucket.r2.cloudflarestorage.com/imagem.jpg"
    },
    "caption": "Legenda da imagem (opcional)",
    "withBorder": false,
    "stretched": false,
    "withBackground": false
  }
}
```

## Exemplos de Uso

### Exemplo 1: Diagrama Explicativo
```
[Imagem: Diagrama mostrando arquitetura do sistema]
Legenda: "Arquitetura do sistema de autenticação"
```

### Exemplo 2: Screenshot de Código
```
[Imagem: Screenshot de código]
Legenda: "Exemplo de implementação do padrão Observer"
```

### Exemplo 3: Gráfico
```
[Imagem: Gráfico de performance]
Legenda: "Comparação de performance antes e depois da otimização"
```

## Testando

### 1. Teste de Upload Básico

1. Acesse a página de criar/editar aula
2. No editor, clique no `+`
3. Selecione "Image"
4. Faça upload de uma imagem grande (ex: 3000x2000px)
5. Verifique que a imagem foi redimensionada automaticamente
6. Adicione uma legenda
7. Salve a aula

### 2. Teste de Validação

1. Tente fazer upload de arquivo muito grande (>5MB)
   - Deve mostrar erro: "Imagem muito grande. Tamanho máximo: 5MB"
2. Tente fazer upload de arquivo inválido (ex: .pdf)
   - Deve mostrar erro: "Formato inválido. Use: JPG, PNG, GIF ou WebP"

### 3. Teste de URL Externa

1. Clique em "Image"
2. Cole uma URL de imagem externa
3. Verifique se a imagem carrega corretamente

### 4. Teste de Ferramentas de Edição

1. Clique na imagem inserida
2. Teste cada ferramenta:
   - Adicionar borda
   - Esticar imagem
   - Adicionar fundo
3. Salve e recarregue para verificar persistência

## Troubleshooting

### Imagem não faz upload

**Possíveis causas:**
- Token JWT inválido ou expirado
- Endpoint do Cloudflare R2 não configurado
- CORS bloqueando requisição
- Arquivo muito grande (>5MB)

**Solução:**
1. Abra o console do navegador (F12)
2. Verifique mensagens de erro
3. Confirme que o token está válido
4. Verifique configuração do R2

### Imagem não aparece após salvar

**Possíveis causas:**
- URL da imagem incorreta
- Bucket R2 não está público
- Imagem não foi salva corretamente

**Solução:**
1. Verifique o JSON salvo no banco de dados
2. Teste a URL da imagem diretamente no navegador
3. Confirme configuração de acesso público do R2

### Erro "Erro ao redimensionar imagem"

**Possíveis causas:**
- Arquivo corrompido
- Formato de imagem não suportado pelo canvas
- Memória insuficiente

**Solução:**
1. Tente com outra imagem
2. Verifique se o formato é válido
3. Reduza o tamanho da imagem original

## Arquivos Modificados

- ✅ `frontend/src/components/EditorJS.tsx` - Adicionado redimensionamento e validação
- ✅ `frontend/src/styles/editorjs.css` - Estilos para imagens
- ✅ `frontend/package.json` - Dependência @editorjs/image

## Recursos

- **Documentação EditorJS Image:** https://github.com/editor-js/image
- **Demo Online:** https://editorjs.io/image-tool
- **Cloudflare R2 Docs:** https://developers.cloudflare.com/r2/
