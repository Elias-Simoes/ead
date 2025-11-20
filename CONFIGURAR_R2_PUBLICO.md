# Como Configurar o Bucket R2 como Público

## Problema
As imagens não aparecem porque o bucket R2 não está configurado para acesso público.

## Solução

### Opção 1: Configurar Domínio Público no Cloudflare (Recomendado)

1. **Acesse o Dashboard do Cloudflare R2**:
   - Vá para https://dash.cloudflare.com
   - Selecione sua conta
   - Vá em "R2" no menu lateral

2. **Selecione seu bucket**:
   - Clique no bucket que você está usando (provavelmente o nome está em `.env`)

3. **Configure o domínio público**:
   - Vá na aba "Settings"
   - Procure por "Public Access" ou "R2.dev subdomain"
   - Clique em "Allow Access" ou "Enable"
   - Isso vai gerar uma URL pública como: `https://pub-XXXXX.r2.dev`

4. **Atualize o .env**:
   ```env
   # Adicione ou atualize esta linha
   CDN_URL=https://pub-XXXXX.r2.dev
   ```

5. **Reinicie o servidor**:
   ```bash
   npm run dev
   ```

### Opção 2: Usar Domínio Customizado (Produção)

1. **Configure um domínio customizado**:
   - No dashboard do R2, vá em "Settings"
   - Adicione um domínio customizado (ex: `cdn.seudominio.com`)
   - Configure o DNS conforme instruções

2. **Atualize o .env**:
   ```env
   CDN_URL=https://cdn.seudominio.com
   ```

## Verificar se Funcionou

Após configurar, teste acessando diretamente uma URL de imagem no navegador:

```
https://pub-XXXXX.r2.dev/courses/1763153961070-43870fdef7b232b7
```

Se a imagem aparecer, está funcionando!

## Estrutura Atual

### Sem CDN_URL configurado:
```
https://SEU-BUCKET.r2.dev/courses/imagem.jpg
```

### Com CDN_URL configurado:
```
https://pub-XXXXX.r2.dev/courses/imagem.jpg
```

## Código Relevante

O código já está preparado para usar o CDN_URL:

```typescript
// src/shared/services/storage.service.ts
private getPublicUrl(key: string): string {
  if (config.cdn.url) {
    return `${config.cdn.url}/${key}`;  // Usa CDN_URL se configurado
  }

  if (config.storage.provider === 'cloudflare') {
    return `https://${this.bucket}.r2.dev/${key}`;  // Fallback
  }

  return `https://${this.bucket}.s3.${config.storage.aws.region}.amazonaws.com/${key}`;
}
```

## Próximos Passos

1. Configure o domínio público no Cloudflare R2
2. Adicione `CDN_URL` no `.env`
3. Reinicie o servidor
4. Teste o upload de uma nova imagem
5. Verifique se a imagem aparece no preview
