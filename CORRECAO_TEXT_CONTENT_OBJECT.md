# Correção: text_content aparecendo como [object Object]

## Problema

O conteúdo em texto da aula estava aparecendo como `[object Object]` no textarea ao editar uma aula.

## Causa

O backend estava convertendo o `text_content` para o formato EditorJS (objeto) ao buscar a aula, mas o frontend agora usa um textarea simples que espera uma string.

### Código Problemático no Backend

```typescript
// lesson.service.ts - getLessonById
if (lesson.text_content) {
  try {
    if (typeof lesson.text_content === 'string') {
      const parsed = JSON.parse(lesson.text_content);
      if (parsed && typeof parsed === 'object' && parsed.blocks) {
        lesson.text_content = parsed; // ❌ Convertendo para objeto
      }
    }
  } catch {
    // ...
  }
}
```

Isso fazia com que o backend retornasse:
```json
{
  "text_content": {
    "time": 1234567890,
    "blocks": [
      {
        "type": "paragraph",
        "data": { "text": "Conteúdo da aula" }
      }
    ],
    "version": "2.30.7"
  }
}
```

Quando o frontend esperava:
```json
{
  "text_content": "Conteúdo da aula"
}
```

## Solução

### 1. Backend - Removida conversão para EditorJS

**Arquivo**: `src/modules/courses/services/lesson.service.ts`

**Método `getLessonById`**:
```typescript
const lesson = result.rows[0];

// text_content agora é uma string simples, não precisa de conversão
// Apenas retornar como está

return lesson;
```

**Método `getLessonsByModule`**:
```typescript
const result = await pool.query(
  'SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index ASC',
  [moduleId]
);

// text_content agora é uma string simples, retornar como está
return result.rows;
```

### 2. Frontend - Adicionada conversão de segurança

**Arquivo**: `frontend/src/pages/instructor/LessonFormPage.tsx`

Adicionada conversão para garantir que `text_content` seja sempre string, mesmo se vier como objeto:

```typescript
// Converter text_content para string se for objeto
let textContent = lesson.text_content || lesson.content || ''
if (typeof textContent === 'object') {
  // Se for objeto EditorJS, extrair o texto dos blocos
  if (textContent.blocks && Array.isArray(textContent.blocks)) {
    textContent = textContent.blocks
      .map((block: any) => block.data?.text || '')
      .join('\n\n')
  } else {
    // Se for outro tipo de objeto, converter para string vazia
    textContent = ''
  }
}
```

Isso garante compatibilidade com:
- ✅ Aulas novas (text_content como string)
- ✅ Aulas antigas que possam ter EditorJS no banco (converte para string)

## Resultado

Agora o `text_content` é sempre tratado como string:
- ✅ Backend retorna string
- ✅ Frontend recebe string
- ✅ Textarea exibe o texto corretamente
- ✅ Salvamento funciona normalmente

## Teste

1. Edite uma aula existente
2. O texto deve aparecer corretamente no textarea
3. Você pode editar o texto normalmente
4. Ao salvar, o texto é mantido como string no banco

## Arquivos Modificados

- `src/modules/courses/services/lesson.service.ts`
- `frontend/src/pages/instructor/LessonFormPage.tsx`

## Status

✅ Correção aplicada
✅ Backend simplificado (removida conversão desnecessária)
✅ Frontend com fallback para compatibilidade
✅ Pronto para uso
