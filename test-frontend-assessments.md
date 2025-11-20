# 🧪 Guia de Teste - Frontend de Avaliações

## 📋 Pré-requisitos

1. Backend rodando: `npm run dev` (na raiz do projeto)
2. Frontend rodando: `cd frontend && npm run dev`
3. Usuário instrutor criado (use as credenciais do CREDENCIAIS_TESTE.md)

## 🎯 Roteiro de Teste

### 1. Login como Instrutor
```
Email: instructor@example.com
Senha: Senha123!
```

### 2. Acessar Dashboard do Instrutor
- URL: `http://localhost:5173/instructor/dashboard`
- Verificar se aparece a lista de cursos

### 3. Acessar Gerenciamento de Avaliações
- Clicar em um curso (ex: "Curso de JavaScript Avançado")
- Clicar no botão "Avaliações" ou acessar:
  - URL: `http://localhost:5173/instructor/courses/8f2e1d3c-4b5a-6789-0123-456789abcdef/assessments`

### 4. Criar Nova Avaliação
- Clicar em "+ Criar Avaliação"
- Preencher:
  - **Título**: "Avaliação Final - Módulo 1"
  - **Nota de Corte**: 70
- Clicar em "Criar Avaliação"
- ✅ Deve aparecer mensagem de sucesso

### 5. Adicionar Primeira Questão
- Clicar em "+ Nova Questão"
- Preencher:
  - **Texto**: "Qual é a diferença entre let e var em JavaScript?"
  - **Pontos**: 25
  - **Opções**:
    - Opção 1: "Não há diferença"
    - Opção 2: "let tem escopo de bloco, var tem escopo de função" ✓ (marcar)
    - Opção 3: "var é mais moderno que let"
    - Opção 4: "let não pode ser reatribuído"
- Marcar o radio button da Opção 2
- Clicar em "Adicionar Questão"
- ✅ Questão deve aparecer na lista

### 6. Adicionar Segunda Questão
- Clicar em "+ Nova Questão"
- Preencher:
  - **Texto**: "O que é hoisting em JavaScript?"
  - **Pontos**: 25
  - **Opções**:
    - Opção 1: "Elevação de declarações para o topo do escopo" ✓ (marcar)
    - Opção 2: "Um tipo de loop"
    - Opção 3: "Uma função nativa"
- Clicar em "Adicionar Questão"
- ✅ Questão deve aparecer na lista

### 7. Adicionar Terceira Questão com Mais Opções
- Clicar em "+ Nova Questão"
- Preencher:
  - **Texto**: "Qual método NÃO existe em arrays JavaScript?"
  - **Pontos**: 25
- Clicar em "+ Adicionar opção" para ter 5 opções
- Preencher:
  - Opção 1: "map"
  - Opção 2: "filter"
  - Opção 3: "reduce"
  - Opção 4: "find"
  - Opção 5: "search" ✓ (marcar)
- Clicar em "Adicionar Questão"
- ✅ Questão deve aparecer com 5 opções

### 8. Adicionar Quarta Questão
- Clicar em "+ Nova Questão"
- Preencher:
  - **Texto**: "O que retorna typeof null em JavaScript?"
  - **Pontos**: 25
  - **Opções**:
    - Opção 1: "null"
    - Opção 2: "undefined"
    - Opção 3: "object" ✓ (marcar)
    - Opção 4: "number"
- Clicar em "Adicionar Questão"
- ✅ Total de pontos deve ser 100

### 9. Editar uma Questão
- Clicar em "Editar" na primeira questão
- Alterar:
  - **Pontos**: 30
- Clicar em "Atualizar Questão"
- ✅ Questão deve ser atualizada
- ✅ Total de pontos deve ser 105

### 10. Excluir uma Opção
- Clicar em "Editar" na terceira questão (5 opções)
- Clicar no "✕" da última opção
- ✅ Deve ficar com 4 opções
- Clicar em "Cancelar" (não salvar)

### 11. Excluir uma Questão
- Clicar em "Excluir" na quarta questão
- Confirmar exclusão
- ✅ Questão deve ser removida
- ✅ Total de pontos deve ser 80

### 12. Atualizar Informações da Avaliação
- Alterar:
  - **Título**: "Avaliação Final - Módulo 1 (Atualizada)"
  - **Nota de Corte**: 75
- Clicar em "Atualizar Avaliação"
- ✅ Deve aparecer mensagem de sucesso

### 13. Visualizar Avaliação Completa
- Verificar se todas as questões estão listadas
- Verificar se as respostas corretas estão destacadas em verde
- Verificar se o total de pontos está correto
- ✅ Tudo deve estar visível e correto

### 14. Voltar para Lista de Avaliações
- Clicar em "← Voltar para avaliações"
- ✅ Deve aparecer a avaliação criada na lista
- ✅ Deve mostrar tipo e nota de corte

### 15. Editar Avaliação Existente
- Clicar em "Editar" na avaliação
- ✅ Deve carregar todas as informações
- ✅ Deve mostrar todas as questões

## ✅ Checklist de Validação

### Funcionalidades Básicas
- [ ] Criar avaliação
- [ ] Definir título e nota de corte
- [ ] Adicionar questões
- [ ] Definir pontos por questão
- [ ] Adicionar opções de resposta
- [ ] Marcar resposta correta
- [ ] Editar questão
- [ ] Excluir questão
- [ ] Atualizar avaliação
- [ ] Voltar para lista

### Validações
- [ ] Não permite salvar questão sem texto
- [ ] Não permite menos de 2 opções
- [ ] Não permite pontos zero ou negativos
- [ ] Resposta correta não pode estar vazia
- [ ] Confirmação antes de excluir

### Interface
- [ ] Mensagens de sucesso aparecem
- [ ] Mensagens de erro aparecem
- [ ] Loading states funcionam
- [ ] Resposta correta destacada em verde
- [ ] Total de pontos atualiza automaticamente
- [ ] Contador de questões correto
- [ ] Navegação funciona corretamente

### Integração com API
- [ ] Criar avaliação chama API corretamente
- [ ] Adicionar questão chama API corretamente
- [ ] Editar questão chama API corretamente
- [ ] Excluir questão chama API corretamente
- [ ] Carregar avaliação traz todas as questões
- [ ] Erros da API são exibidos

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento.

## 📝 Notas

- O backend já foi testado e está 100% funcional
- Todas as rotas da API estão funcionando
- O frontend está integrado com o backend
- A interface é responsiva e intuitiva

## 🎉 Resultado Esperado

Ao final dos testes, você deve ter:
- ✅ Uma avaliação criada
- ✅ 3 questões adicionadas
- ✅ Total de 80 pontos
- ✅ Todas as respostas corretas marcadas
- ✅ Interface funcionando perfeitamente

## 🚀 Próximo Passo

Após validar o frontend, você pode:
1. Criar mais avaliações para outros cursos
2. Testar a visualização do aluno (próxima feature)
3. Implementar a submissão de respostas
4. Implementar a correção automática
