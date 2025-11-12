# Como Fazer Push para Repositório Remoto

## ✅ Status Atual

- Git inicializado: ✅
- Commit criado: ✅ (39b1df9)
- Repositório remoto: ❌ (precisa configurar)

## Opção 1: GitHub

### Passo 1: Criar Repositório no GitHub
1. Acesse https://github.com/new
2. Nome do repositório: `plataforma-ead-backend` (ou outro nome)
3. Deixe como **privado** (recomendado)
4. **NÃO** inicialize com README, .gitignore ou licença
5. Clique em "Create repository"

### Passo 2: Adicionar Remote e Fazer Push
```bash
# Adicionar remote
git remote add origin https://github.com/SEU-USUARIO/plataforma-ead-backend.git

# Renomear branch para main (opcional, GitHub usa 'main' por padrão)
git branch -M main

# Fazer push
git push -u origin main
```

## Opção 2: GitLab

### Passo 1: Criar Repositório no GitLab
1. Acesse https://gitlab.com/projects/new
2. Nome do projeto: `plataforma-ead-backend`
3. Visibilidade: **Private**
4. **NÃO** inicialize com README
5. Clique em "Create project"

### Passo 2: Adicionar Remote e Fazer Push
```bash
# Adicionar remote
git remote add origin https://gitlab.com/SEU-USUARIO/plataforma-ead-backend.git

# Renomear branch para main (opcional)
git branch -M main

# Fazer push
git push -u origin main
```

## Opção 3: Bitbucket

### Passo 1: Criar Repositório no Bitbucket
1. Acesse https://bitbucket.org/repo/create
2. Nome do repositório: `plataforma-ead-backend`
3. Acesso: **Private**
4. Clique em "Create repository"

### Passo 2: Adicionar Remote e Fazer Push
```bash
# Adicionar remote
git remote add origin https://bitbucket.org/SEU-USUARIO/plataforma-ead-backend.git

# Fazer push
git push -u origin master
```

## Verificar Configuração

Após adicionar o remote, verifique:

```bash
# Ver remotes configurados
git remote -v

# Deve mostrar algo como:
# origin  https://github.com/seu-usuario/plataforma-ead-backend.git (fetch)
# origin  https://github.com/seu-usuario/plataforma-ead-backend.git (push)
```

## Fazer Push

```bash
# Push inicial (primeira vez)
git push -u origin main

# Ou se manteve master:
git push -u origin master

# Próximos pushes (depois do primeiro)
git push
```

## Autenticação

### GitHub/GitLab (Token de Acesso Pessoal)

Se pedir senha, você precisa usar um **Personal Access Token**:

**GitHub:**
1. Vá em Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Selecione: `repo` (acesso completo)
4. Copie o token
5. Use o token como senha quando fazer push

**GitLab:**
1. Vá em Preferences → Access Tokens
2. Crie um token com escopo `write_repository`
3. Use o token como senha

### SSH (Alternativa Recomendada)

Para não precisar digitar senha toda vez:

```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "seu-email@example.com"

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub/GitLab:
# GitHub: Settings → SSH and GPG keys → New SSH key
# GitLab: Preferences → SSH Keys

# Mudar remote para SSH
git remote set-url origin git@github.com:SEU-USUARIO/plataforma-ead-backend.git
```

## Comandos Úteis

```bash
# Ver status
git status

# Ver histórico
git log --oneline

# Ver remotes
git remote -v

# Adicionar remote
git remote add origin <URL>

# Mudar URL do remote
git remote set-url origin <NOVA-URL>

# Remover remote
git remote remove origin

# Fazer push
git push

# Fazer push forçado (cuidado!)
git push -f
```

## Troubleshooting

### Erro: "remote origin already exists"
```bash
# Remover remote existente
git remote remove origin

# Adicionar novamente
git remote add origin <URL>
```

### Erro: "failed to push some refs"
```bash
# Pull primeiro (se o remoto tiver commits)
git pull origin main --rebase

# Depois push
git push origin main
```

### Erro: "Authentication failed"
- Use Personal Access Token em vez de senha
- Ou configure SSH

## Próximos Commits

Depois do primeiro push, para commits futuros:

```bash
# 1. Fazer alterações nos arquivos

# 2. Adicionar arquivos
git add .

# 3. Fazer commit
git commit -m "feat: descrição da alteração"

# 4. Fazer push
git push
```

## Boas Práticas

1. **Commits frequentes**: Faça commits pequenos e frequentes
2. **Mensagens claras**: Use mensagens descritivas
3. **Convenção de commits**: Use prefixos como:
   - `feat:` - Nova funcionalidade
   - `fix:` - Correção de bug
   - `docs:` - Documentação
   - `test:` - Testes
   - `refactor:` - Refatoração
   - `chore:` - Tarefas de manutenção

4. **Branches**: Para features grandes, crie branches:
   ```bash
   git checkout -b feature/nova-funcionalidade
   git push -u origin feature/nova-funcionalidade
   ```

## Arquivo .gitignore

Já incluído no projeto, ignora:
- `node_modules/`
- `.env`
- `dist/`
- Arquivos de log
- Arquivos temporários

---

**Pronto!** Agora você pode fazer push do seu código para um repositório remoto! 🚀
