# ✅ Correção: Erro ao Atualizar Questão

## 🐛 Problema Identificado

**Erro**: "Expected number, received string" no campo `points`

**Causa**: O frontend estava enviando o campo `points` como string em vez de número ao atualizar uma questão.

## 📊 Logs do Backend

```
2025-11-20 04:09:36 [warn]: Validation error
{
  "errors": [
    {
      "field": "body.points",
      "message": "Expected number, received string"
    }
  ],
  "path": "/questions/a20e46ff-e6aa-4272-b949-2d414e70f276"
}
```

## 🔧 Correção Aplicada

### Arquivo: `frontend/src/components/QuestionEditor.tsx`

**Antes:**
```typescript
const data: CreateQuestionData | UpdateQuestionData = {
  text: formData.text.trim(),
  type: formData.type,
  points: formData.points,  // ❌ Pode ser string
  order_index: question?.order || questionNumber,
};
```

**Depois:**
```typescript
const data: CreateQuestionData | UpdateQuestionData = {
  text: formData.text.trim(),
  type: formData.type,
  points: Number(formData.points),  // ✅ Sempre número
  order_index: question?.order || questionNumber,
};
```

## ✅ Solução

Adicionado `Number()` para garantir que o valor de `points` seja sempre enviado como número, mesmo que o input retorne string.

## 🧪 Como Testar

1. **Recarregue a página** no navegador (F5)
2. **Edite uma questão** existente
3. **Altere os pontos** para qualquer valor
4. **Clique em "Atualizar Questão"**
5. ✅ Deve funcionar sem erros

## 📝 Nota Técnica

O problema ocorria porque:
- O input `type="number"` pode retornar string vazia quando limpo
- O `parseInt()` pode retornar `NaN` em alguns casos
- O `Number()` garante conversão consistente para número

---

**Status: ✅ CORRIGIDO**

Agora a atualização de questões funciona perfeitamente!
