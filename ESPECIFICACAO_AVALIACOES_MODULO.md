# Especificação: Sistema de Avaliações por Módulo

## Requisitos

### 1. Estrutura de Avaliações

- **Cada módulo deve ter UMA avaliação**
- **Cada avaliação vale 10 pontos no total**
- **Pontos são divididos automaticamente entre as questões**
  - Exemplo: 10 questões = 1 ponto cada
  - Exemplo: 5 questões = 2 pontos cada
  - Exemplo: 4 questões = 2.5 pontos cada

### 2. Cálculo de Nota Final

- **Nota final = média de todas as avaliações dos módulos**
- **Certificado é emitido se nota final >= nota de corte do curso**

### 3. Fluxo

```
Curso
  └─ Módulo 1
      ├─ Aulas
      └─ Avaliação 1 (10 pontos)
          ├─ Questão 1 (pontos automáticos)
          ├─ Questão 2 (pontos automáticos)
          └─ Questão N (pontos automáticos)
  └─ Módulo 2
      ├─ Aulas
      └─ Avaliação 2 (10 pontos)
          └─ Questões...
  
Nota Final = (Avaliação 1 + Avaliação 2 + ... + Avaliação N) / N
Certificado = Nota Final >= Nota de Corte
```

## Mudanças Necessárias

### 1. Banco de Dados

#### Tabela: assessments
- Adicionar campo `module_id` (UUID, FK para modules)
- Remover campo `course_id` (avaliação agora é do módulo, não do curso)
- Campo `total_points` sempre será 10

#### Tabela: questions
- Adicionar campo `points` (DECIMAL) - calculado automaticamente
- Pontos = 10 / número de questões da avaliação

#### Tabela: student_assessments
- Manter `score` (nota obtida de 0 a 10)
- Manter `passed` (se passou na avaliação individual)

### 2. Backend

#### Assessment Service
- Método para calcular pontos por questão automaticamente
- Método para recalcular pontos quando questões são adicionadas/removidas
- Método para calcular nota final do curso (média das avaliações)

#### Certificate Service
- Verificar se aluno completou TODAS as avaliações
- Calcular nota final (média)
- Comparar com nota de corte do curso
- Emitir certificado se aprovado

### 3. Frontend

#### Criar Avaliação
- Associar avaliação a um módulo específico
- Mostrar que cada avaliação vale 10 pontos
- Mostrar pontos por questão (calculado automaticamente)

#### Visualizar Avaliação
- Mostrar pontos de cada questão
- Mostrar total de pontos da avaliação (sempre 10)

#### Fazer Avaliação (Aluno)
- Mostrar pontos de cada questão
- Calcular nota automaticamente
- Mostrar se passou na avaliação

#### Progresso do Aluno
- Mostrar notas de cada avaliação (por módulo)
- Mostrar nota final (média)
- Mostrar se está apto a receber certificado

## Exemplos de Cálculo

### Exemplo 1: 10 Questões
```
Total: 10 pontos
Questões: 10
Pontos por questão: 10 / 10 = 1.0 ponto

Aluno acertou 8 questões:
Nota = 8 × 1.0 = 8.0 pontos
```

### Exemplo 2: 5 Questões
```
Total: 10 pontos
Questões: 5
Pontos por questão: 10 / 5 = 2.0 pontos

Aluno acertou 4 questões:
Nota = 4 × 2.0 = 8.0 pontos
```

### Exemplo 3: 4 Questões
```
Total: 10 pontos
Questões: 4
Pontos por questão: 10 / 4 = 2.5 pontos

Aluno acertou 3 questões:
Nota = 3 × 2.5 = 7.5 pontos
```

### Exemplo 4: Nota Final do Curso
```
Curso com 3 módulos:
- Módulo 1: Avaliação = 8.0 pontos
- Módulo 2: Avaliação = 7.5 pontos
- Módulo 3: Avaliação = 9.0 pontos

Nota Final = (8.0 + 7.5 + 9.0) / 3 = 8.17 pontos

Se nota de corte = 7.0:
  ✅ Aluno aprovado, recebe certificado

Se nota de corte = 8.5:
  ❌ Aluno reprovado, não recebe certificado
```

## Implementação

### Fase 1: Migração do Banco
1. Adicionar `module_id` em assessments
2. Adicionar `points` em questions
3. Migrar dados existentes (se houver)

### Fase 2: Backend
1. Atualizar service para calcular pontos automaticamente
2. Atualizar service para calcular nota final
3. Atualizar certificate service para usar nota final

### Fase 3: Frontend
1. Atualizar formulário de criação de avaliação
2. Atualizar visualização de avaliação
3. Atualizar página de fazer avaliação
4. Atualizar dashboard de progresso

### Fase 4: Testes
1. Testar criação de avaliação por módulo
2. Testar cálculo automático de pontos
3. Testar submissão de avaliação
4. Testar cálculo de nota final
5. Testar emissão de certificado

## Próximos Passos

1. Confirmar especificação com você
2. Criar migração do banco de dados
3. Implementar backend
4. Implementar frontend
5. Testar tudo

## Respostas Confirmadas

1. ✅ Cada módulo tem exatamente UMA avaliação
2. ✅ Avaliação sempre vale 10 pontos
3. ✅ Pontos divididos igualmente entre questões
4. ✅ Nota final é média simples de todas as avaliações
5. ✅ **Módulo sem avaliação = curso não pode ser submetido para aprovação**
6. ✅ **Aluno pode refazer quantas vezes quiser** (última nota conta)
7. ✅ **Apenas nota final importa** (não há nota mínima por avaliação individual)
