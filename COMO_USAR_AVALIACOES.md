# 🚀 Como Usar o Sistema de Avaliações

## ⚡ Início Rápido

### 1. Iniciar o Sistema
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Acessar como Instrutor
```
URL: http://localhost:5173/login
Email: instructor@example.com
Senha: Senha123!
```

### 3. Criar Avaliação
1. Dashboard → Selecionar Curso → **Avaliações**
2. Clicar em **"+ Criar Avaliação"**
3. Preencher:
   - Título: "Avaliação Final"
   - Nota de Corte: 70%
4. Clicar em **"Criar Avaliação"**

### 4. Adicionar Questões
1. Clicar em **"+ Nova Questão"**
2. Preencher:
   - Texto da questão
   - Pontos (ex: 25)
   - Opções de resposta
3. **Marcar o círculo** da resposta correta
4. Clicar em **"Adicionar Questão"**

### 5. Gerenciar Questões
- **Editar**: Clicar em "Editar" → Modificar → "Atualizar Questão"
- **Excluir**: Clicar em "Excluir" → Confirmar
- **Adicionar Opção**: Clicar em "+ Adicionar opção"
- **Remover Opção**: Clicar no "✕" ao lado da opção

## 📋 Exemplo Prático

### Criar Avaliação de JavaScript

**Avaliação:**
- Título: "Avaliação - Fundamentos JavaScript"
- Nota de Corte: 70%

**Questão 1:**
- Texto: "O que é uma variável const?"
- Pontos: 25
- Opções:
  - [ ] Pode ser reatribuída
  - [x] Não pode ser reatribuída (CORRETA)
  - [ ] É igual a var
  - [ ] Não existe em JavaScript

**Questão 2:**
- Texto: "Qual é o resultado de typeof []?"
- Pontos: 25
- Opções:
  - [ ] "array"
  - [x] "object" (CORRETA)
  - [ ] "list"
  - [ ] "undefined"

**Questão 3:**
- Texto: "O que é arrow function?"
- Pontos: 25
- Opções:
  - [x] Sintaxe curta para funções (CORRETA)
  - [ ] Um tipo de loop
  - [ ] Uma variável especial
  - [ ] Um operador

**Questão 4:**
- Texto: "O que faz o método map()?"
- Pontos: 25
- Opções:
  - [ ] Remove elementos
  - [x] Transforma cada elemento (CORRETA)
  - [ ] Filtra elementos
  - [ ] Ordena elementos

**Total: 100 pontos**

## 💡 Dicas

### Boas Práticas
- ✅ Use títulos descritivos
- ✅ Distribua pontos proporcionalmente
- ✅ Mínimo 2 opções por questão
- ✅ Máximo 6 opções por questão
- ✅ Marque sempre a resposta correta
- ✅ Revise antes de publicar

### Validações Automáticas
- ❌ Não permite questão sem texto
- ❌ Não permite menos de 2 opções
- ❌ Não permite pontos zero
- ❌ Não permite resposta correta vazia

### Atalhos
- **Adicionar opção**: Clicar em "+ Adicionar opção"
- **Remover opção**: Clicar no "✕"
- **Cancelar edição**: Clicar em "Cancelar"
- **Voltar**: Clicar em "← Voltar"

## 🎯 Casos de Uso

### Caso 1: Avaliação Rápida (4 questões)
- 4 questões × 25 pontos = 100 pontos
- Nota de corte: 70%
- Tempo estimado: 5 minutos

### Caso 2: Avaliação Completa (10 questões)
- 10 questões × 10 pontos = 100 pontos
- Nota de corte: 60%
- Tempo estimado: 15 minutos

### Caso 3: Avaliação Difícil (20 questões)
- 20 questões × 5 pontos = 100 pontos
- Nota de corte: 80%
- Tempo estimado: 30 minutos

## 🔧 Solução de Problemas

### Problema: Não consigo criar avaliação
**Solução**: Verifique se preencheu título e nota de corte

### Problema: Não consigo adicionar questão
**Solução**: Salve a avaliação primeiro

### Problema: Resposta correta não está marcada
**Solução**: Clique no círculo (radio button) ao lado da opção correta

### Problema: Não consigo remover opção
**Solução**: Mínimo de 2 opções é obrigatório

### Problema: Total de pontos não bate
**Solução**: Verifique os pontos de cada questão

## 📞 Suporte

### Logs do Backend
```bash
# Ver logs em tempo real
npm run dev
```

### Logs do Frontend
```bash
# Abrir console do navegador
F12 → Console
```

### Testar API Diretamente
```bash
# Usar o script de teste
node test-assessments-backend.js
```

## 🎓 Recursos Adicionais

### Documentação
- `FRONTEND_AVALIACOES_IMPLEMENTADO.md` - Documentação técnica
- `test-frontend-assessments.md` - Guia de testes
- `SESSAO_FRONTEND_CONCLUIDA.md` - Resumo da implementação

### Arquivos de Teste
- `test-assessments-backend.js` - Teste do backend
- `find-instructor-course.js` - Buscar cursos do instrutor

### Credenciais
- Ver `CREDENCIAIS_TESTE.md` para todas as credenciais

## ✨ Funcionalidades Disponíveis

- [x] Criar avaliação
- [x] Editar avaliação
- [x] Excluir avaliação
- [x] Adicionar questões
- [x] Editar questões
- [x] Excluir questões
- [x] Marcar resposta correta
- [x] Definir pontos
- [x] Adicionar/remover opções
- [x] Visualizar avaliação completa
- [x] Ver total de pontos
- [x] Ver contador de questões

## 🚀 Próximas Features

- [ ] Visualização do aluno
- [ ] Submissão de respostas
- [ ] Correção automática
- [ ] Histórico de tentativas
- [ ] Estatísticas de desempenho
- [ ] Banco de questões
- [ ] Importar questões

---

**🎉 Pronto! Agora você pode criar avaliações completas!**

Qualquer dúvida, consulte os arquivos de documentação ou os scripts de teste.
