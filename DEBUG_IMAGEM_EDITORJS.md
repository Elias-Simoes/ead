# Debug: Imagem não aparece no EditorJS

## Problema
A imagem não está aparecendo no editor após ser selecionada.

## Checklist de Debug

### 1. Verificar Console do Navegador (F12)
Abra o console e procure por:
- ❌ Erros em vermelho
- ⚠️ Warnings em amarelo
- 📝 Logs de "Erro ao processar imagem"

### 2. Verificar Network (Rede)
- A imagem NÃO deve fazer requisição HTTP (está em base64)
- Não deve aparecer chamada para `/api/upload` ao adicionar imagem

### 3. Testar Passo a Passo

#### Teste 1: Adicionar Imagem Pequena
```
1. Selecione uma imagem pequena (< 1MB)
2. Formato: JPG ou PNG
3. Observe o console
4. A imagem deve aparecer imediatamente
```

#### Teste 2: Verificar Base64
```
1. Adicione uma imagem
2. Abra DevTools (F12)
3. Na aba Console, digite:
   localStorage.getItem('editorjs-data')
4. Procure por "data:image" na resposta
5. Deve ter uma string base64 longa
```

### 4. Possíveis Causas

#### Causa 1: Erro de CORS
- Improvável, pois não há requisição HTTP

#### Causa 2: Tamanho da Imagem
- Imagem muito grande pode travar o navegador
- Teste com imagem < 500KB primeiro

#### Causa 3: Formato Inválido
- Teste apenas com JPG ou PNG
- Evite GIF animado ou WebP por enquanto

#### Causa 4: EditorJS não inicializado
- Recarregue a página (F5)
- Limpe o cache (Ctrl+Shift+Del)

### 5. Teste Manual

Copie e cole no console do navegador:

```javascript
// Teste se a função de redimensionamento funciona
const testImage = async () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    console.log('Arquivo selecionado:', file.name, file.size, file.type)
    
    // Simular redimensionamento
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        console.log('Dimensões originais:', img.width, 'x', img.height)
        
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        if (width > 1200) {
          height = (height * 1200) / width
          width = 1200
        }
        if (height > 800) {
          width = (width * 800) / height
          height = 800
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        const base64 = canvas.toDataURL(file.type, 0.85)
        console.log('Base64 gerado:', base64.substring(0, 50) + '...')
        console.log('Tamanho base64:', base64.length, 'caracteres')
        console.log('Novas dimensões:', width, 'x', height)
      }
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

testImage()
```

## Solução Rápida

Se a imagem não aparecer, tente:

1. **Recarregar a página** (F5)
2. **Limpar cache** do navegador
3. **Testar com imagem diferente** (JPG pequeno)
4. **Verificar se há erros** no console

## Próximos Passos

Se ainda não funcionar, me envie:
- Screenshot do console (F12)
- Screenshot da aba Network
- Tamanho e formato da imagem testada
