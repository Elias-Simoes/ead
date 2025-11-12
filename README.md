# Plataforma EAD - Backend

Sistema de ensino a distância (EAD) com modelo de assinatura mensal.

## Estrutura do Projeto

```
├── src/
│   ├── config/           # Configurações (env, database, redis)
│   ├── modules/          # Módulos da aplicação
│   │   ├── auth/         # Autenticação e autorização
│   │   ├── users/        # Gestão de usuários
│   │   ├── courses/      # Gestão de cursos
│   │   └── subscriptions/# Gestão de assinaturas
│   ├── shared/           # Código compartilhado
│   │   ├── middleware/   # Middlewares Express
│   │   ├── types/        # Tipos TypeScript
│   │   └── utils/        # Utilitários
│   └── server.ts         # Ponto de entrada da aplicação
├── docker-compose.yml    # Configuração Docker
├── .env.example          # Exemplo de variáveis de ambiente
└── package.json          # Dependências do projeto
```

## Pré-requisitos

- Node.js 18+ ou 20+
- Docker e Docker Compose
- PostgreSQL 15+ (ou via Docker)
- Redis 7+ (ou via Docker)

## Configuração

1. Clone o repositório
2. Copie o arquivo de exemplo de variáveis de ambiente:
   ```bash
   copy .env.example .env
   ```
3. Edite o arquivo `.env` com suas configurações

## Instalação

```bash
npm install
```

## Desenvolvimento

### Pré-requisito: Iniciar Docker Desktop

Antes de começar, você precisa:
1. Instalar o Docker Desktop (se ainda não tiver): https://www.docker.com/products/docker-desktop
2. Iniciar o Docker Desktop
3. Aguardar até que o Docker esteja completamente iniciado (ícone na bandeja do sistema)

### Iniciar serviços com Docker

Após o Docker Desktop estar rodando, execute:

```bash
docker-compose up -d
```

Isso iniciará:
- PostgreSQL na porta 5432
- Redis na porta 6379

Para verificar se os serviços estão rodando:

```bash
docker-compose ps
```

### Iniciar servidor de desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

### Verificar saúde da aplicação

```bash
curl http://localhost:3000/health
```

Ou abra no navegador: http://localhost:3000/health

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento com hot reload
- `npm run build` - Compila o TypeScript para JavaScript
- `npm start` - Inicia o servidor em modo produção
- `npm run lint` - Executa o linter
- `npm run lint:fix` - Corrige problemas de lint automaticamente
- `npm run format` - Formata o código com Prettier
- `npm run format:check` - Verifica formatação do código

## Tecnologias

- **Runtime**: Node.js
- **Framework**: Express
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis
- **Autenticação**: JWT
- **Validação**: Zod
- **Linting**: ESLint
- **Formatação**: Prettier

## Variáveis de Ambiente

Consulte o arquivo `.env.example` para ver todas as variáveis de ambiente disponíveis.

### Principais variáveis:

- `NODE_ENV` - Ambiente de execução (development, production)
- `PORT` - Porta do servidor
- `DATABASE_URL` - URL de conexão com PostgreSQL
- `REDIS_URL` - URL de conexão com Redis
- `JWT_SECRET` - Chave secreta para JWT

## Docker

### Serviços disponíveis

- **postgres**: Banco de dados PostgreSQL
- **redis**: Cache Redis

### Comandos úteis do Docker

```bash
# Iniciar serviços
docker-compose up -d

# Ver logs dos serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f postgres
docker-compose logs -f redis

# Verificar status dos serviços
docker-compose ps

# Parar serviços
docker-compose down

# Parar e remover volumes (apaga dados do banco)
docker-compose down -v

# Reiniciar um serviço específico
docker-compose restart postgres
docker-compose restart redis
```

### Solução de Problemas

**Erro: "docker daemon is not running"**
- Certifique-se de que o Docker Desktop está instalado e iniciado
- Verifique o ícone do Docker na bandeja do sistema (deve estar verde)
- Aguarde alguns segundos após iniciar o Docker Desktop antes de executar comandos

**Porta já em uso (5432 ou 6379)**
- Verifique se já existe PostgreSQL ou Redis rodando localmente
- Pare os serviços locais ou altere as portas no `docker-compose.yml`

## Próximos Passos

Este é o setup inicial do projeto. Os próximos passos incluem:

1. Implementar módulo de autenticação (Task 2)
2. Implementar gestão de usuários (Task 3)
3. Implementar gestão de cursos (Task 4)
4. Implementar sistema de assinaturas (Task 5)

Consulte o arquivo `.kiro/specs/plataforma-ead/tasks.md` para ver o plano completo de implementação.
