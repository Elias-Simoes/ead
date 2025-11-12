# Guia de Testes - API de Autenticação

## 🚀 Passo a Passo para Testar

### 1. Iniciar os Serviços

Primeiro, inicie o PostgreSQL e Redis usando Docker:

```bash
docker-compose up -d
```

Aguarde alguns segundos para os serviços iniciarem.

### 2. Executar as Migrações

```bash
npm run migrate
```

Isso criará todas as tabelas necessárias no banco de dados.

### 3. Iniciar o Servidor

```bash
npm run dev
```

O servidor deve iniciar em `http://localhost:3000`

### 4. Verificar se o Servidor Está Rodando

Abra outro terminal e execute:

```bash
curl http://localhost:3000/health
```

Você deve ver uma resposta como:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 1.234
}
```

## 🧪 Métodos de Teste

### Opção 1: Script Automatizado (Recomendado)

Execute o script de teste que criei:

```bash
node test-auth.js
```

Este script testará automaticamente todos os endpoints e mostrará os resultados coloridos no console.

### Opção 2: REST Client (VS Code)

1. Instale a extensão "REST Client" no VS Code
2. Abra o arquivo `test-api.http`
3. Clique em "Send Request" acima de cada requisição
4. Veja os resultados no painel lateral

### Opção 3: cURL (Manual)

#### Teste 1: Registrar um Novo Aluno

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aluno@example.com",
    "name": "João Silva",
    "password": "SecurePass123!",
    "gdprConsent": true
  }'
```

**Resposta esperada (201):**
```json
{
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

#### Teste 2: Fazer Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aluno@example.com",
    "password": "SecurePass123!"
  }'
```

**Resposta esperada (200):**
```json
{
  "message": "Login successful",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    },
    "user": {
      "id": "uuid-here",
      "email": "aluno@example.com",
      "name": "João Silva",
      "role": "student",
      "isActive": true
    }
  }
}
```

**Salve o accessToken e refreshToken para os próximos testes!**

#### Teste 3: Login com Admin Padrão

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@plataforma-ead.com",
    "password": "Admin@123"
  }'
```

#### Teste 4: Renovar Access Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "SEU_REFRESH_TOKEN_AQUI"
  }'
```

#### Teste 5: Solicitar Reset de Senha

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aluno@example.com"
  }'
```

**Nota:** Em desenvolvimento, o token de reset seria retornado na resposta ou nos logs. Em produção, seria enviado por email.

#### Teste 6: Resetar Senha

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_DE_RESET_AQUI",
    "password": "NovaSecurePass123!"
  }'
```

#### Teste 7: Fazer Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "SEU_REFRESH_TOKEN_AQUI"
  }'
```

#### Teste 8: Acessar Rota Protegida (Exemplo)

```bash
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI"
```

### Opção 4: Postman/Insomnia

1. Importe o arquivo `test-api.http` ou crie as requisições manualmente
2. Configure a variável `baseUrl` como `http://localhost:3000`
3. Execute as requisições na ordem
4. Salve os tokens retornados para usar nas próximas requisições

## 🧪 Testes de Validação

### Teste de Senha Fraca (Deve Falhar)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "senhafraca@example.com",
    "name": "Senha Fraca",
    "password": "123456",
    "gdprConsent": true
  }'
```

**Resposta esperada (400):** Erro de validação

### Teste de Email Duplicado (Deve Falhar)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aluno@example.com",
    "name": "Duplicado",
    "password": "SecurePass123!",
    "gdprConsent": true
  }'
```

**Resposta esperada (409):** EMAIL_ALREADY_EXISTS

### Teste de Credenciais Inválidas (Deve Falhar)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aluno@example.com",
    "password": "SenhaErrada123!"
  }'
```

**Resposta esperada (401):** INVALID_CREDENTIALS

### Teste de Rate Limiting

Execute o mesmo comando de login com senha errada 6 vezes seguidas:

```bash
for i in {1..6}; do
  echo "Tentativa $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "aluno@example.com",
      "password": "SenhaErrada123!"
    }'
  echo -e "\n"
done
```

**Resultado esperado:** Após 5 tentativas, deve retornar erro 429 (RATE_LIMIT_EXCEEDED)

## 📊 Verificar Dados no Banco

### Conectar ao PostgreSQL

```bash
docker-compose exec db psql -U user -d plataforma_ead
```

### Consultas Úteis

```sql
-- Ver todos os usuários
SELECT id, email, name, role, is_active, created_at FROM users;

-- Ver tokens de refresh ativos
SELECT user_id, expires_at, created_at, revoked_at 
FROM refresh_tokens 
WHERE revoked_at IS NULL;

-- Ver alunos com consentimento GDPR
SELECT u.email, u.name, s.gdpr_consent, s.gdpr_consent_at
FROM users u
JOIN students s ON u.id = s.id;

-- Ver tokens de reset de senha
SELECT user_id, expires_at, created_at, used_at
FROM password_reset_tokens
WHERE used_at IS NULL;
```

## 🔍 Verificar Logs

Os logs do servidor mostrarão todas as requisições e erros:

```bash
# No terminal onde o servidor está rodando, você verá:
[2024-01-01T00:00:00.000Z] [INFO] POST /api/auth/register
[2024-01-01T00:00:00.000Z] [INFO] User registered successfully {"email":"aluno@example.com"}
```

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Reiniciar serviços
docker-compose restart db
```

### Erro: "Cannot connect to Redis"

```bash
# Verificar se Redis está rodando
docker-compose ps

# Reiniciar Redis
docker-compose restart redis

# Testar conexão
redis-cli ping
```

### Erro: "Port 3000 already in use"

```bash
# Encontrar processo usando a porta
# Windows:
netstat -ano | findstr :3000

# Linux/Mac:
lsof -i :3000

# Matar o processo ou mudar a porta no .env
```

### Erro: "Table does not exist"

```bash
# Executar migrações novamente
npm run migrate
```

## ✅ Checklist de Testes

- [ ] Health check retorna 200
- [ ] Registro de novo aluno funciona
- [ ] Registro com email duplicado falha (409)
- [ ] Registro com senha fraca falha (400)
- [ ] Login com credenciais válidas funciona
- [ ] Login com credenciais inválidas falha (401)
- [ ] Login com admin padrão funciona
- [ ] Refresh token funciona
- [ ] Forgot password retorna sucesso
- [ ] Reset password funciona
- [ ] Logout funciona
- [ ] Rate limiting funciona após 5 tentativas
- [ ] Token expirado retorna 401
- [ ] Token inválido retorna 401

## 📝 Próximos Passos

Após validar que todos os endpoints estão funcionando:

1. Testar integração com frontend
2. Implementar próximo módulo (Gestão de Usuários - Task 3)
3. Configurar testes automatizados com Jest/Vitest
4. Configurar CI/CD
5. Preparar para produção

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Verifique os logs do Docker: `docker-compose logs`
3. Consulte a documentação: `src/modules/auth/README.md`
4. Verifique o arquivo de design: `.kiro/specs/plataforma-ead/design.md`
