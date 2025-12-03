# Simplificação do Formulário de Questões

## Problema
O modal de "Nova Questão" exibia campos desnecessários:
1. **Campo "Tipo"** - Dropdown com opções "Múltipla Escolha" e "Dissertativa"
2. **Campo "Pontos"** - Input numérico para definir pontos manualmente

Esses campos não fazem sentido porque:
- O sistema só suporta questões de múltipla escolha
- Os pontos são calculados automaticamente (10 pontos divididos igualmente entre todas as questões)

## Solução Implementada

### 1. Removido Campo "Tipo"
O tipo agora é fixo como `'multiple_choice'` e não aparece mais no formulário.

**Antes:**
```tsx
<div>
  <label>Tipo *</label>
  <select value={questionForm.type}>
    <option value="multiple_choice">Múltipla Escolha</option>
    <option value="essay">Dissertativa</option>
  </select>
</div>
```

**Depois:**
```tsx
// Campo removido - tipo fixo como 'multiple_choice'
```

### 2. Removido Campo "Pontos"
Os pontos não são mais editáveis pelo usuário, pois são calculados automaticamente pelo backend.

**Antes:**
```tsx
<div>
  <label>Pontos *</label>
  <input
    type="number"
    value={questionForm.points}
    onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
    required
    min="1"
  />
</div>
```

**Depois:**
```tsx
// Campo removido - pontos calculados automaticamente
```

### 3. Atualizado Estado do Formulário

**Antes:**
```typescript
const [questionForm, setQuestionForm] = useState({
  text: '',
  type: 'multiple_choice' as 'multiple_choice' | 'essay',
  options: ['', '', '', ''],
  correctAnswer: 0,
  points: 10, // ❌ Removido
})
```

**Depois:**
```typescript
const [questionForm, setQuestionForm] = useState({
  text: '',
  type: 'multiple_choice' as 'multiple_choice' | 'essay',
  options: ['', '', '', ''],
  correctAnswer: 0,
  // points removido
})
```

### 4. Atualizado Envio de Dados

**Antes:**
```typescript
const questionData = {
  ...questionForm,
  options: questionForm.options.filter(o => o.trim()),
  correctAnswer: questionForm.correctAnswer,
}
```

**Depois:**
```typescript
const questionData = {
  text: questionForm.text,
  type: questionForm.type,
  options: questionForm.options.filter(o => o.trim()),
  correct_answer: questionForm.correctAnswer,
  points: 0, // Será recalculado automaticamente pelo backend
  order_index: 0, // Será ajustado pelo backend
}
```

## Resultado

### Formulário Simplificado
Agora o modal "Nova Questão" contém apenas:
1. **Pergunta** - Textarea para o texto da questão
2. **Opções** - 4 campos de texto com radio buttons para marcar a resposta correta

### Benefícios
- ✅ Interface mais limpa e intuitiva
- ✅ Menos campos para o usuário preencher
- ✅ Elimina confusão sobre pontos (que são automáticos)
- ✅ Remove opção de tipo "Dissertativa" que não é suportada
- ✅ Experiência mais focada e direta

## Arquivos Modificados
1. `frontend/src/pages/instructor/AssessmentsManagementPage.tsx`
   - Removido campo "Tipo" do formulário
   - Removido campo "Pontos" do formulário
   - Atualizado estado `questionForm`
   - Atualizado `handleQuestionSubmit`

## Como Testar

1. Acesse o painel do instrutor
2. Vá em "Gerenciar Avaliações"
3. Clique em "+ Adicionar Questão" em qualquer avaliação
4. Verifique que o modal agora mostra apenas:
   - Campo "Pergunta"
   - Campo "Opções" (com 4 opções e radio buttons)
   - Botões "Cancelar" e "Adicionar"

## Observações
- O backend já estava preparado para recalcular os pontos automaticamente
- O tipo 'multiple_choice' continua sendo enviado ao backend
- A funcionalidade de questões dissertativas pode ser implementada no futuro se necessário
