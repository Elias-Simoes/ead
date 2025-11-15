# Correção - Aulas Não Aparecem na Lista

## Problema
Após adicionar uma aula, ela não aparece na lista de aulas do módulo.

## Causa Raiz
O serviço de módulos no backend não estava buscando as aulas associadas aos módulos. Quando a API retornava os módulos, eles vinham sem a propriedade `lessons`.

## Investigação

### 1. Verificação no Banco de Dados
```bash
node check-lessons.js
```
Resultado: ✅ Aula foi salva corretamente no banco de dados

### 2. Verificação da API
```bash
node test-modules-with-lessons.js
```
Resultado antes da correção: ❌ Módulos retornados sem aulas

## Correção Aplicada

### Backend - module.service.ts

Modificado o método `getModulesByCourse` para buscar as aulas de cada módulo:

```typescript
// ANTES
async getModulesByCourse(courseId: string): Promise<Module[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index ASC',
      [courseId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Failed to get modules', error);
    throw error;
  }
}

// DEPOIS
async getModulesByCourse(courseId: string): Promise<any[]> {
  try {
    // Get modules
    const modulesResult = await pool.query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index ASC',
      [courseId]
    );

    const modules = modulesResult.rows;

    // Get lessons for each module
    for (const module of modules) {
      const lessonsResult = await pool.query(
        'SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index ASC',
        [module.id]
      );
      module.lessons = lessonsResult.rows;
    }

    return modules;
  } catch (error) {
    logger.error('Failed to get modules', error);
    throw error;
  }
}
```

## Teste de Validação

Após a correção, o teste retorna:

```
✓ Módulos encontrados: 1

Módulo 1: Teste
  Aulas (3):
    1. Aula de Teste
       Tipo: video
       Duração: 30 min
    2. Teste
       Tipo: video
       Duração: 60 min
    3. Aula 1
       Tipo: video
       Duração: 60 min
```

## Como Testar no Frontend

1. **Limpar cache do navegador** (Ctrl+Shift+Delete)
2. **Recarregar a página** com hard refresh (Ctrl+F5)
3. **Fazer login como instrutor**:
   - Email: `instructor@example.com`
   - Senha: `Senha123!`
4. **Acessar "Gerenciar Módulos"** de um curso
5. **Verificar** se as aulas aparecem na lista

## Arquivos Modificados

- `src/modules/courses/services/module.service.ts`

## Resultado

### Antes
- ❌ Aulas não apareciam na lista
- ❌ API retornava módulos sem a propriedade `lessons`

### Depois
- ✅ Aulas aparecem corretamente
- ✅ API retorna módulos com array de `lessons`
- ✅ Aulas ordenadas por `order_index`

## Observação sobre Cache

Se as aulas ainda não aparecerem após a correção:
1. O navegador pode estar usando cache (status 304)
2. Solução: Limpar cache do navegador e fazer hard refresh
3. Ou: Abrir em aba anônima para testar sem cache
