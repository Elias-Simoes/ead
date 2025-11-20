# Resumo: Problemas com Criação/Edição de Aulas

## 🔍 Problemas Identificados

### 1. Conteúdo de Texto (EditorJS) Não Salva
**Sintoma**: Ao criar/editar uma aula com texto, o conteúdo não aparece ao editar novamente.

**Causa**: O `textContent` está no estado do React mas chega NULL no banco de dados.

**Evidência**:
- Console mostra: `textContent no estado: Object {time: ..., blocks: Array(2)}`
- Banco de dados mostra: `text_content: NULL`

**Possível causa raiz**: O EditorJS `onChange` não está sendo disparado ou o estado está sendo perdido antes do submit.

### 2. Recursos (PDFs, Imagens) Não Salvam
**Sintoma**: Ao adicionar recursos (PDF, imagens), eles não são salvos.

**Causa**: O array `resources` está vazio no momento do submit.

**Evidência**:
- Console mostra: `⚠️ Nenhum recurso para salvar`
- Banco de dados: 0 registros na tabela `lesson_resources`
- Logs do backend: Nenhuma requisição POST para `/lessons/{id}/resources`

**Possível causa raiz**: O componente `LessonResourcesManager` não está atualizando o estado `resources` do componente pai.

### 3. Edição Não Carrega Dados
**Sintoma**: Ao editar uma aula, o editor e recursos aparecem vazios.

**Status**: ✅ PARCIALMENTE RESOLVIDO
- Backend agora normaliza `text_content` para formato EditorJS
- Frontend força recriação do editor quando dados mudam
- **MAS** como não há dados salvos, continua vazio

## 🎯 Soluções Necessárias

### Solução 1: Garantir que EditorJS Salva Conteúdo

**Opção A - Verificar se onChange está funcionando**:
```typescript
// Adicionar mais logs no EditorJS
onChange={(data) => {
  console.log('🔄 EditorJS onChange:', data);
  console.log('🔄 Blocos:', data.blocks?.length);
  setLessonForm((prev) => {
    const updated = { ...prev, textContent: data };
    console.log('📝 Estado atualizado:', updated.textContent);
    return updated;
  });
}}
```

**Opção B - Forçar salvamento antes do submit**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Forçar salvamento do EditorJS
  if (editorRef.current) {
    const currentData = await editorRef.current.save();
    setLessonForm(prev => ({ ...prev, textContent: currentData }));
  }
  
  // Aguardar estado atualizar
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Continuar com o salvamento...
}
```

### Solução 2: Garantir que Recursos São Salvos

**Problema**: O `LessonResourcesManager` não está atualizando o estado do pai.

**Verificar**:
1. Se o `onChange` do `LessonResourcesManager` está sendo chamado
2. Se o estado `resources` está sendo atualizado corretamente

**Solução temporária**: Adicionar logs:
```typescript
<LessonResourcesManager
  lessonId={lessonId}
  resources={resources}
  onChange={(newResources) => {
    console.log('📎 Recursos atualizados:', newResources);
    setResources(newResources);
  }}
/>
```

## 📊 Status Atual

| Funcionalidade | Status | Observação |
|---|---|---|
| Criar aula | ✅ Funciona | Aula é criada no banco |
| Salvar título/descrição | ✅ Funciona | Dados básicos salvam |
| Salvar texto (EditorJS) | ❌ NÃO funciona | `text_content` fica NULL |
| Salvar recursos | ❌ NÃO funciona | Recursos não são salvos |
| Editar aula | ⚠️ Parcial | Carrega dados básicos, mas não texto/recursos |
| Backend normaliza dados | ✅ Funciona | Converte dados antigos para EditorJS |

## 🔧 Próximos Passos

1. **Investigar EditorJS onChange**
   - Adicionar logs detalhados
   - Verificar se está sendo disparado
   - Verificar se estado está sendo atualizado

2. **Investigar LessonResourcesManager**
   - Verificar se onChange está sendo chamado
   - Verificar se recursos estão no estado antes do submit

3. **Teste Completo**
   - Criar aula com texto
   - Adicionar recurso
   - Verificar console para ver logs
   - Verificar banco de dados

## 💡 Solução Rápida (Workaround)

Enquanto investigamos, você pode:
1. Usar apenas o campo de descrição para texto simples
2. Adicionar recursos após criar a aula (se houver rota separada)
3. Ou aguardar a correção completa

## 📝 Logs Úteis para Debug

Ao criar/editar uma aula, observe no console:
- `🔄 EditorJS onChange disparado` - EditorJS detectou mudança
- `📝 Atualizando lessonForm.textContent` - Estado sendo atualizado
- `💾 Salvando aula` - Momento do submit
- `textContent no estado:` - Valor no momento do submit
- `📎 Salvando recursos:` - Recursos no momento do submit

Se algum desses logs não aparecer, sabemos onde está o problema.
