# Limpeza de Dados - Avaliações

## 🎯 Objetivo

Garantir que não existam avaliações inconsistentes no banco de dados que possam comprometer:
- Cálculo de certificados
- Integridade referencial
- Lógica de negócio

## 🔍 Problemas Verificados

### 1. Avaliações com course_id E module_id
**Problema**: Violação da constraint que exige OU um OU outro
**Impacto**: Dados redundantes e potencialmente inconsistentes
**Solução**: Remover `course_id`, manter apenas `module_id`

### 2. Avaliações Órfãs (Módulo Inexistente)
**Problema**: `module_id` aponta para módulo que não existe
**Impacto**: Dados órfãos, impossível calcular certificado
**Solução**: Deletar avaliação e suas questões

### 3. Avaliações Órfãs (Curso Inexistente)
**Problema**: `course_id` aponta para curso que não existe
**Impacto**: Dados órfãos, impossível calcular certificado
**Solução**: Deletar avaliação e suas questões

### 4. Inconsistência Módulo → Curso
**Problema**: `course_id` da avaliação ≠ `course_id` do módulo
**Impacto**: Avaliação associada ao curso errado
**Solução**: Remover `course_id` inconsistente

### 5. Módulos com Múltiplas Avaliações
**Problema**: Módulo tem mais de uma avaliação
**Impacto**: Violação da regra "1 avaliação por módulo"
**Solução**: Manter apenas a mais recente, deletar as outras

## 📊 Scripts Criados

### 1. Script de Limpeza
**Arquivo**: `cleanup-invalid-assessments.js`

**O que faz**:
- Identifica todos os problemas listados acima
- Corrige automaticamente os dados
- Usa transação (COMMIT ou ROLLBACK)
- Gera relatório detalhado

**Como executar**:
```bash
node cleanup-invalid-assessments.js
```

**Segurança**:
- ✅ Usa transação (tudo ou nada)
- ✅ Faz ROLLBACK se encontrar erros
- ✅ Mostra o que será feito antes de aplicar
- ✅ Gera relatório final

### 2. Script de Verificação
**Arquivo**: `verify-assessments-integrity.js`

**O que faz**:
- Verifica integridade dos dados
- Não modifica nada (apenas leitura)
- Gera relatório de problemas
- Mostra estatísticas

**Como executar**:
```bash
node verify-assessments-integrity.js
```

**Quando usar**:
- Antes de fazer limpeza (para ver o que tem)
- Depois de fazer limpeza (para confirmar)
- Periodicamente (para monitorar)
- Antes de deploy (para garantir integridade)

## ✅ Resultado da Limpeza

### Execução Realizada
```
Data: 26 de novembro de 2025
Status: ✅ Sucesso
```

### Problemas Encontrados
- ✅ Nenhuma avaliação com ambos os campos
- ✅ Nenhuma avaliação órfã (módulo)
- ✅ Nenhuma avaliação órfã (curso)
- ✅ Nenhuma inconsistência módulo → curso
- ✅ Nenhum módulo com múltiplas avaliações

### Estatísticas Finais
```
Total de avaliações: 41
Por curso (legado): 3
Por módulo (novo): 38
Ambos (erro): 0
Nenhum (erro): 0

Total de módulos: 78
Módulos com avaliação: 38
Módulos sem avaliação: 40
Total de cursos: 87
```

### Conclusão
✅ **DADOS LIMPOS E CONSISTENTES**

Não havia dados inconsistentes no banco. Todas as avaliações estão corretas.

## 🔄 Manutenção Contínua

### Quando Executar Verificação

1. **Antes de Deploy**
   ```bash
   node verify-assessments-integrity.js
   ```

2. **Após Migrações**
   ```bash
   node verify-assessments-integrity.js
   ```

3. **Periodicamente (Semanal)**
   - Adicionar ao cron job
   - Monitorar logs

4. **Após Correções de Bugs**
   - Verificar se correção funcionou
   - Garantir que não criou novos problemas

### Quando Executar Limpeza

1. **Se Verificação Encontrar Problemas**
   ```bash
   node cleanup-invalid-assessments.js
   ```

2. **Após Importação de Dados**
   - Dados externos podem estar inconsistentes
   - Limpar antes de usar

3. **Após Rollback de Migrações**
   - Pode ter deixado dados órfãos
   - Limpar para garantir integridade

## 🚨 Alertas

### Antes de Executar Limpeza

⚠️ **IMPORTANTE**:
1. Fazer backup do banco de dados
2. Executar em ambiente de teste primeiro
3. Revisar o que será deletado
4. Ter plano de rollback

### Dados que Serão Deletados

O script de limpeza pode deletar:
- ❌ Avaliações órfãs (sem módulo/curso válido)
- ❌ Questões de avaliações órfãs
- ❌ Avaliações duplicadas (mantém apenas 1 por módulo)

O script de limpeza NÃO deleta:
- ✅ Avaliações válidas
- ✅ Questões de avaliações válidas
- ✅ Módulos ou cursos

## 📝 Logs e Monitoramento

### Logs Gerados

Ambos os scripts geram logs detalhados:
- 📊 Estatísticas gerais
- ⚠️ Problemas encontrados
- ✅ Ações executadas
- ❌ Erros (se houver)

### Exemplo de Log (Limpeza)
```
🔍 LIMPEZA: Avaliações Inválidas
======================================================================

1️⃣ Identificando avaliações com course_id E module_id...
✅ Nenhuma avaliação com ambos os campos

2️⃣ Identificando avaliações órfãs (módulo inexistente)...
✅ Nenhuma avaliação órfã encontrada

...

📊 Estatísticas:
   Total de avaliações: 41
   Por curso (legado): 3
   Por módulo (novo): 38
   Ambos (erro): 0
   Nenhum (erro): 0

✅ Limpeza concluída com sucesso!
```

### Exemplo de Log (Verificação)
```
🔍 VERIFICAÇÃO: Integridade de Avaliações
======================================================================

1️⃣ Verificando constraint (OU course_id OU module_id)...
✅ Todas as avaliações respeitam a constraint

...

======================================================================
✅ INTEGRIDADE OK!
✅ Todos os dados estão consistentes
```

## 🎯 Checklist de Integridade

Use este checklist para validar manualmente:

- [ ] Todas as avaliações têm OU `course_id` OU `module_id`
- [ ] Nenhuma avaliação tem ambos os campos
- [ ] Nenhuma avaliação tem nenhum dos campos
- [ ] Todos os `module_id` apontam para módulos existentes
- [ ] Todos os `course_id` apontam para cursos existentes
- [ ] Se avaliação tem `course_id` e `module_id`, são do mesmo curso
- [ ] Cada módulo tem no máximo 1 avaliação
- [ ] Todas as questões pertencem a avaliações existentes

## 📚 Documentação Relacionada

1. `CORRECAO_BUG_CRIACAO_AVALIACAO.md` - Correção da constraint
2. `CORRECAO_COMPLETA_SEGURANCA_AVALIACOES.md` - Correção de segurança
3. `RESUMO_FINAL_CORRECOES_AVALIACOES.md` - Resumo das correções
4. `LIMPEZA_DADOS_AVALIACOES.md` - Este arquivo

## 🚀 Próximos Passos

1. ✅ Scripts de limpeza criados
2. ✅ Scripts de verificação criados
3. ✅ Dados verificados e limpos
4. ✅ Documentação completa
5. ⏭️ Adicionar verificação ao CI/CD
6. ⏭️ Adicionar monitoramento periódico
7. ⏭️ Criar alertas automáticos
