# Solução: Edição de Aulas não Carrega Conteúdo

## 🔍 Problema Identificado

Ao tentar editar uma aula existente:
- ✅ O conteúdo **É SALVO** corretamente no banco (verificado)
- ❌ O conteúdo **NÃO APARECE** ao editar
- ❌ Os recursos da aula **NÃO APARECEM** ao editar

## 🕵️ Investigação

### Teste no Banco de Dados
```javascript
// Aula retornada pela API:
{
  "id": "7874cf97-90b7-4374-8d55-f92bce17d8cf",
  "title": "Aula 4",
  "text_content": "https://www.youtube.com/shorts/Q04R49sZd5w",  // ❌ String, não JSON!
  "video_url": null,
  "external_link": null
}
```

### Problema
- **Aulas antigas**: `text_content` contém strings simples ou URLs
- **Aulas novas**: `text_content` deve conter JSON do EditorJS
- **Frontend**: Espera sempre JSON do EditorJS

## ✅ Solução

### 1. Corrigir o Backend para Retornar Dados Consistentes

O backend deve garantir que `text_content` seja sempre um objeto JSON válido do EditorJS, mesmo para dados antigos.

**Arquivo**: `src/modules/courses/services/lesson.service.ts`

```typescript
// Ao buscar uma aula, normalizar text_content
async getLessonById(lessonId: string, instructorId: string): Promise<any> {
  const lesson = await this.lessonRepository.findById(lessonId);
  
  // ... validações ...
  
  // Normalizar text_content para EditorJS
  if (lesson.text_content && typeof lesson.text_content === 'string') {
    try {
      // Tentar parsear como JSON
      lesson.text_content = JSON.parse(lesson.text_content);
    } catch {
      // Se não for JSON, converter para formato EditorJS
      lesson.text_content = {
        time: Date.now(),
        blocks: [
          {
            type: 'paragraph',
            data: {
              text: lesson.text_content
            }
          }
        ],
        version: '2.30.7'
      };
    }
  }
  
  return lesson;
}
```

### 2. Corrigir o Frontend para Tratar Dados Corretamente

**Arquivo**: `frontend/src/pages/instructor/LessonFormPage.tsx`

O código já está correto, mas vamos garantir que funcione:

```typescript
// Parsear text_content se for JSON do EditorJS
let textContent = null
if (lesson.text_content) {
  try {
    // Se já for objeto, usar direto
    if (typeof lesson.text_content === 'object') {
      textContent = lesson.text_content
    } else {
      // Se for string, tentar parsear
      const parsed = JSON.parse(lesson.text_content)
      textContent = parsed
    }
  } catch {
    // Se não for JSON válido, criar um bloco de parágrafo simples
    textContent = {
      time: Date.now(),
      blocks: [
        {
          type: 'paragraph',
          data: {
            text: lesson.text_content
          }
        }
      ]
    }
  }
}
```

### 3. Garantir que EditorJS Receba Dados Corretos

**Arquivo**: `frontend/src/components/EditorJS.tsx`

O componente já está configurado para reinicializar quando `data` muda. Apenas garantir que os logs estejam ativos para debug.

## 🧪 Teste

### Criar Nova Aula
1. Criar uma aula com texto no EditorJS
2. Salvar
3. Verificar no banco que `text_content` é JSON

### Editar Aula Existente
1. Clicar em "Editar" em uma aula
2. Verificar console do navegador:
   - `📝 Conteúdo carregado do banco:` deve mostrar objeto JSON
   - `🔄 EditorJS useEffect - data recebida:` deve mostrar objeto JSON
   - `✅ EditorJS pronto com dados:` deve mostrar objeto JSON
3. O editor deve carregar com o conteúdo

### Editar Aula Antiga (com dados em formato antigo)
1. Editar uma aula que tem `text_content` como string simples
2. O backend deve converter para formato EditorJS
3. O editor deve carregar com o conteúdo convertido

## 📋 Checklist de Implementação

- [ ] Atualizar `lesson.service.ts` para normalizar `text_content`
- [ ] Testar criação de nova aula
- [ ] Testar edição de aula nova
- [ ] Testar edição de aula antiga
- [ ] Verificar que recursos da aula são carregados
- [ ] Remover logs de debug após confirmar funcionamento

## 🎯 Próximos Passos

Após implementar a solução:
1. Criar uma nova aula com texto
2. Editar a aula e verificar se o texto aparece
3. Editar uma aula antiga e verificar se funciona
4. Documentar o resultado
