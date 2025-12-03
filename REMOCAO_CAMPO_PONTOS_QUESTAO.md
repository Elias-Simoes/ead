# Remoção do Campo "Pontos" do Formulário de Questões

## Problema
O formulário de criação/edição de questões tinha um campo "Pontos" que permitia ao usuário definir manualmente quantos pontos cada questão valia. Isso não fazia sentido porque:

1. **Sistema de recálculo automático**: O backend já implementa um sistema que recalcula automaticamente os pontos de todas as questões
2. **Pontuação fixa**: Cada avaliação tem 10 pontos totais, divididos igualmente entre todas as questões
3. **Confusão para o usuário**: Permitir entrada manual de pontos criava expectativas falsas, já que os valores seriam sobrescritos

## Solução Aplicada

### Arquivo: `frontend/src/components/QuestionEditor.tsx`

#### 1. Removido campo "Pontos" do estado do formulário
```typescript
// ANTES
const [formData, setFormData] = useState({
  text: question?.text || '',
  type: question?.type || 'multiple_choice' as const,
  options: question?.options || ['', '', '', ''],
  correct_answer: question?.correctAnswer ?? 0,
  points: question?.points || 10, // ❌ Removido
});

// DEPOIS
const [formData, setFormData] = useState({
  text: question?.text || '',
  type: question?.type || 'multiple_choice' as const,
  options: question?.options || ['', '', '', ''],
  correct_answer: question?.correctAnswer ?? 0,
});
```

#### 2. Removida validação de pontos
```typescript
// REMOVIDO:
if (formData.points <= 0) {
  newErrors.push('Os pontos devem ser maiores que zero');
}
```

#### 3. Removido campo visual do formulário
```tsx
// REMOVIDO:
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Pontos
  </label>
  <input
    type="number"
    value={formData.points}
    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    min="1"
  />
</div>
```

#### 4. Pontos definidos como 0 (serão recalculados pelo backend)
```typescript
const data: CreateQuestionData | UpdateQuestionData = {
  text: formData.text.trim(),
  type: formData.type,
  points: 0, // Será recalculado automaticamente pelo backend
  order_index: question?.order || questionNumber,
};
```

## Como Funciona Agora

1. **Usuário cria/edita questão**: Não precisa se preocupar com pontos
2. **Backend recebe a questão**: Com `points: 0`
3. **Backend recalcula automaticamente**: Divide 10 pontos igualmente entre todas as questões
4. **Exemplo**:
   - 2 questões = 5 pontos cada
   - 3 questões = 3.33 pontos cada
   - 4 questões = 2.5 pontos cada
   - 5 questões = 2 pontos cada

## Benefícios

✅ Interface mais simples e intuitiva  
✅ Elimina confusão sobre pontuação  
✅ Garante que todas as avaliações tenham 10 pontos totais  
✅ Pontuação sempre justa e equilibrada  
✅ Menos campos para o usuário preencher

## Nota Técnica

O backend já tinha o sistema de recálculo implementado nos métodos:
- `createQuestionWithRecalculation()`
- `deleteQuestionWithRecalculation()`
- `recalculateQuestionPoints()`

Agora o frontend está alinhado com essa lógica, não tentando mais controlar manualmente algo que é gerenciado automaticamente pelo sistema.
