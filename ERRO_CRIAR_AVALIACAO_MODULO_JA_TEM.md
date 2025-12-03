# Erro ao Criar Avaliação: Módulo Já Possui Avaliação

## Problema Identificado

Ao tentar criar uma nova avaliação, o sistema retorna o erro:
```
Failed to create assessment for module
```

## Causa

O sistema está configurado para permitir **apenas uma avaliação por módulo**. Quando você tenta criar uma avaliação para um módulo que já possui uma, o backend rejeita a requisição.

## Verificação

Executamos um teste que confirmou:
- ✅ Login funcionando corretamente
- ✅ Busca de cursos funcionando
- ✅ Busca de módulos sem avaliação funcionando
- ❌ **Nenhum módulo disponível** - todos os módulos já têm avaliações

## Soluções

### Opção 1: Criar um Novo Módulo

1. Acesse o curso desejado
2. Vá em "Gerenciar Módulos"
3. Clique em "Adicionar Módulo"
4. Preencha os dados do novo módulo
5. Salve o módulo
6. Agora você poderá criar uma avaliação para este novo módulo

### Opção 2: Editar a Avaliação Existente

Se você quer modificar uma avaliação existente:

1. Acesse "Avaliações" do curso
2. Clique em "Editar" na avaliação que deseja modificar
3. Faça as alterações necessárias
4. Salve as mudanças

### Opção 3: Excluir a Avaliação Existente (Cuidado!)

⚠️ **ATENÇÃO**: Isso apagará todos os dados da avaliação, incluindo questões e respostas de alunos!

1. Acesse "Avaliações" do curso
2. Clique em "Excluir" na avaliação que deseja remover
3. Confirme a exclusão
4. Agora você poderá criar uma nova avaliação para aquele módulo

## Regra de Negócio

O sistema implementa a regra: **1 módulo = 1 avaliação**

Isso garante:
- ✅ Organização clara do conteúdo
- ✅ Facilita o acompanhamento do progresso do aluno
- ✅ Simplifica o cálculo de notas e certificados
- ✅ Evita confusão sobre qual avaliação fazer

## Como Verificar Quais Módulos Têm Avaliações

Você pode verificar no frontend:
1. Acesse o curso
2. Vá em "Avaliações"
3. A lista mostrará todas as avaliações e seus respectivos módulos

Ou use o script de teste:
```bash
node test-create-assessment-debug.js
```

Este script mostrará quantos módulos estão disponíveis para criar avaliações.

## Mensagem de Erro no Frontend

O frontend deveria mostrar uma mensagem mais clara quando não há módulos disponíveis. A mensagem atual é:

```
ℹ️ Todos os módulos já possuem avaliações

Não é possível criar novas avaliações pois todos os módulos do curso já possuem suas avaliações.
```

Esta mensagem aparece quando você tenta criar uma nova avaliação e não há módulos disponíveis.

## Próximos Passos

Para criar uma nova avaliação, você precisa:

1. **Criar um novo módulo** no curso, OU
2. **Excluir uma avaliação existente** (se realmente necessário)

Depois disso, o módulo ficará disponível para receber uma nova avaliação.

## Data do Diagnóstico

25 de novembro de 2025
