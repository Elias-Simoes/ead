# Simple Image no EditorJS

## Mudança de Plugin

Substituímos o `@editorjs/image` pelo `@editorjs/simple-image` porque:

1. **Mais simples:** Não requer configuração complexa de uploader
2. **Aceita URLs:** Funciona com URLs de imagem diretamente
3. **Sem validações rígidas:** Não rejeita dados por formato
4. **Mais estável:** Menos propenso a erros

## Como Usar

### Adicionar Imagem por URL

1. No editor, clique no `+`
2. Selecione "Image"
3. Cole a URL da imagem
4. Pressione Enter

A imagem aparecerá imediatamente!

## Formato dos Dados

```json
{
  "type": "image",
  "data": {
    "url": "https://exemplo.com/imagem.jpg"
  }
}
```

## Próximos Passos

Para adicionar upload de arquivos locais, precisaremos:

1. Criar um campo de upload separado
2. Fazer upload para R2
3. Obter a URL
4. Colar a URL no Simple Image

Ou implementar um plugin customizado que combine Simple Image com upload.

## Vantagens

✅ **Funciona imediatamente:** Sem erros de validação
✅ **Simples:** Apenas cole a URL
✅ **Compatível:** Funciona com qualquer URL de imagem
✅ **Leve:** Menos código, menos bugs

## Limitações

❌ **Sem upload direto:** Não tem botão de "selecionar arquivo"
❌ **Sem legenda:** Não suporta legendas
❌ **Sem ferramentas:** Não tem opções de borda, esticar, etc.

## Solução Temporária

Por enquanto, use URLs de imagens externas ou:

1. Faça upload manual para um serviço de imagens
2. Copie a URL
3. Cole no editor

Depois implementaremos upload integrado.
