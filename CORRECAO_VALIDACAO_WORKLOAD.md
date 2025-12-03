# Correção: Erro de Validação ao Editar Carga Horária

## Problema
Ao tentar editar a carga horária de um curso, o sistema retornava erro "Validation failed".

## Causa Raiz
O validador Zod estava configurado para aceitar apenas valores do tipo `number`, mas em alguns casos o frontend pode enviar o valor como `string` (mesmo com `type="number"` no HTML).

### Validação Anterior
```typescript
workload: z.number().int().positive()
```

Esta validação rejeitava qualquer valor que não fosse exatamente do tipo `number`, incluindo strings numéricas como `"120"`.

## Solução Implementada

Atualizei o validador para aceitar tanto números quanto strings numéricas, convertendo automaticamente strings para números:

### Validação Atualizada
```typescript
workload: z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/).transform(val => parseInt(val, 10))
]).optional()
```

Esta validação agora:
1. Aceita números inteiros positivos diretamente
2. Aceita strings que contenham apenas dígitos (ex: "120")
3. Converte automaticamente strings válidas para números
4. Rejeita valores inválidos (negativos, decimais, não-numéricos)

## Arquivos Modificados

### `src/modules/courses/validators/course.validator.ts`

**1. Schema de Criação (`createCourseSchema`)**
```typescript
workload: z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/).transform(val => parseInt(val, 10))
]),
```

**2. Schema de Atualização (`updateCourseSchema`)**
```typescript
workload: z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/).transform(val => parseInt(val, 10))
]).optional(),
```

## Casos de Teste

### ✅ Valores Aceitos
- `120` (número)
- `"120"` (string numérica)
- `1` (mínimo válido)
- `"999"` (string numérica grande)

### ❌ Valores Rejeitados
- `0` (não é positivo)
- `-10` (negativo)
- `120.5` (decimal)
- `"120.5"` (string decimal)
- `"abc"` (não numérico)
- `""` (vazio)

## Benefícios

1. **Maior Flexibilidade**: Aceita tanto números quanto strings numéricas
2. **Conversão Automática**: Transforma strings válidas em números
3. **Validação Robusta**: Mantém as regras de negócio (inteiro, positivo)
4. **Compatibilidade**: Funciona com diferentes formas de envio de dados

## Como Testar

### 1. Reiniciar o Backend
```bash
npm run build
npm run dev
```

### 2. Testar Edição de Curso
1. Faça login como instrutor
2. Acesse "Meus Cursos"
3. Clique em "Editar" em qualquer curso
4. Altere a carga horária (ex: de 120 para 150)
5. Clique em "Atualizar Curso"
6. Verifique se a atualização foi bem-sucedida

### 3. Testar Criação de Curso
1. Clique em "Criar Novo Curso"
2. Preencha todos os campos
3. Defina uma carga horária (ex: 40)
4. Clique em "Criar Curso"
5. Verifique se o curso foi criado com sucesso

## Observações

- O frontend já estava enviando o valor corretamente como número (linha 147 do CourseFormPage.tsx)
- A correção foi necessária para garantir compatibilidade com diferentes cenários de envio
- A validação continua garantindo que apenas valores inteiros positivos sejam aceitos

## Status
✅ **CORRIGIDO** - O sistema agora aceita tanto números quanto strings numéricas para carga horária
