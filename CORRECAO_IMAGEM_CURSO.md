# Correção: Imagem do Curso Não Aparece na Edição

## Problema
Ao editar um curso, a imagem de capa não aparece no preview, mesmo que esteja salva no banco de dados.

## Causa Raiz
O sistema foi ajustado para salvar apenas a `key` (identificador) da imagem no banco, mas o frontend precisa da URL completa para exibir a imagem.

## Solução Implementada

### 1. Backend - Storage Service
Adicionado método `buildPublicUrl()` para construir URLs a partir de keys:

```typescript
buildPublicUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  
  // Se já for uma URL completa, retorna como está
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  
  // Caso contrário, constrói a URL
  return this.getPublicUrl(key);
}
```

### 2. Backend - Course Service
Adicionado método `enrichCourseWithUrls()` que adiciona `cover_image_url` aos cursos:

```typescript
private enrichCourseWithUrls(course: any): any {
  if (!course) return null;
  
  return {
    ...course,
    cover_image_url: storageService.buildPublicUrl(course.cover_image),
  };
}
```

Este método é aplicado em:
- `getCourseById()`
- `getCourseWithDetails()`

### 3. Frontend - CourseFormPage
Ajustado para usar `cover_image_url` para preview:

```typescript
const fetchCourse = async () => {
  const course = response.data.data.course
  
  const coverImageKey = course.cover_image || ''
  const coverImageUrl = course.cover_image_url || ''
  
  setFormData({
    ...
    coverImage: coverImageKey, // Salva a key
  })
  
  // Usa a URL completa para preview
  if (coverImageUrl) {
    setImagePreview(coverImageUrl)
  }
}
```

## Estrutura de Dados

### No Banco de Dados
```
cover_image: "courses/1763153961070-43870fdef7b232b7"
```

### Na API Response
```json
{
  "cover_image": "courses/1763153961070-43870fdef7b232b7",
  "cover_image_url": "https://pub-d85f6bf87ccfacad1b6c275635ecdce.r2.dev/courses/1763153961070-43870fdef7b232b7"
}
```

## Debug
Para verificar se está funcionando:

```bash
node test-image-key-system.js
```

Ou no navegador, abra o Console (F12) e verifique os logs:
- `Course data:`
- `Cover image key:`
- `Cover image URL:`

## Status
✅ Backend configurado
✅ Frontend ajustado
⚠️  Aguardando teste no navegador
