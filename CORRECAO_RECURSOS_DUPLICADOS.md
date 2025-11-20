# Correção: Recursos Duplicando ao Editar Aula

## Problema

Ao editar uma aula (mesmo sem alterar os recursos), os recursos existentes eram duplicados no banco de dados.

## Causa

O código estava enviando TODOS os recursos para a API ao salvar, incluindo os que já existiam no banco de dados. A API então criava novos registros para todos eles, resultando em duplicatas.

### Código Problemático

```typescript
// frontend/src/pages/instructor/LessonFormPage.tsx
// Salvar recursos
if (resources.length > 0 && savedLessonId) {
  // ❌ Envia TODOS os recursos, incluindo os existentes
  const resourcesResponse = await api.post(
    `/courses/lessons/${savedLessonId}/resources`, 
    { resources }
  );
}
```

## Solução

Modificado o código para enviar apenas recursos NOVOS (que não têm `id`):

```typescript
// Salvar apenas recursos NOVOS (que não têm id)
const newResources = resources.filter(r => !r.id);
console.log('📎 Recursos totais:', resources.length, '| Novos:', newResources.length);

if (newResources.length > 0 && savedLessonId) {
  console.log(`📤 Enviando ${newResources.length} recursos novos para aula ${savedLessonId}`);
  const resourcesResponse = await api.post(
    `/courses/lessons/${savedLessonId}/resources`, 
    { resources: newResources }
  );
  console.log('✅ Recursos salvos:', resourcesResponse.data);
} else {
  console.log('⚠️ Nenhum recurso novo para salvar');
}
```

## Como Funciona Agora

1. **Recursos Existentes**: Têm `id` → Não são enviados novamente
2. **Recursos Novos**: Não têm `id` → São enviados para a API
3. **Ao Editar Aula**: Apenas novos recursos são salvos, existentes permanecem intactos

## Limpeza de Duplicatas

Criado script `fix-duplicate-resources.js` para:
- ✅ Detectar recursos duplicados
- ✅ Remover duplicatas (mantém apenas a mais recente)

### Uso:

```bash
# Verificar duplicatas
node fix-duplicate-resources.js

# Limpar duplicatas
node fix-duplicate-resources.js --clean
```

## Teste

1. Edite uma aula existente que já tem recursos
2. Altere apenas o texto (não mexa nos recursos)
3. Salve a aula
4. Verifique que os recursos NÃO duplicaram

## Logs de Debug

O console agora mostra:
```
📎 Recursos totais: 1 | Novos: 0
⚠️ Nenhum recurso novo para salvar
```

Isso confirma que recursos existentes não são reenviados.

## Arquivos Modificados

- `frontend/src/pages/instructor/LessonFormPage.tsx`
- `fix-duplicate-resources.js` (novo script de limpeza)

## Status

✅ Correção aplicada
✅ Duplicatas existentes removidas
✅ Logs de debug adicionados
✅ Script de limpeza criado
✅ Pronto para uso
