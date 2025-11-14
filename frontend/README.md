# Plataforma EAD - Frontend

Frontend da Plataforma EAD desenvolvido com React, TypeScript, Vite e Tailwind CSS.

## Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **Zustand** - Gerenciamento de estado
- **Tailwind CSS** - Framework CSS

## Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── contexts/        # React Contexts
│   ├── pages/           # Páginas da aplicação
│   ├── services/        # Serviços e API
│   ├── stores/          # Zustand stores
│   ├── types/           # TypeScript types
│   ├── utils/           # Funções utilitárias
│   ├── App.tsx          # Componente principal
│   ├── main.tsx         # Entry point
│   └── index.css        # Estilos globais
├── public/              # Assets estáticos
├── index.html           # HTML template
├── vite.config.ts       # Configuração do Vite
├── tailwind.config.js   # Configuração do Tailwind
└── package.json         # Dependências
```

## Instalação

```bash
cd frontend
npm install
```

## Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento estará disponível em `http://localhost:5173`

## Build

```bash
npm run build
```

Os arquivos de produção serão gerados na pasta `dist/`

## Preview

```bash
npm run preview
```

Visualiza a build de produção localmente

## Lint

```bash
npm run lint
```

## Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```
VITE_API_URL=http://localhost:3000/api
```

## Funcionalidades Implementadas

### Configuração Inicial (Task 15.1) ✅
- [x] Projeto React com Vite
- [x] Configuração do Tailwind CSS
- [x] Configuração do React Router
- [x] Configuração do Axios para chamadas à API
- [x] Configuração do Zustand para gerenciamento de estado
- [x] Interceptors para autenticação e refresh de tokens
- [x] Tipos TypeScript para entidades do sistema

### Próximas Implementações

- [ ] Páginas de autenticação (login, cadastro, redefinição de senha)
- [ ] Páginas do aluno (cursos, player, perfil, certificados)
- [ ] Páginas do instrutor (dashboard, criação de cursos, avaliações)
- [ ] Páginas do administrador (dashboard, gestão, relatórios)
- [ ] Componentes responsivos
- [ ] Acessibilidade (WCAG 2.1)
- [ ] Testes E2E

## Convenções de Código

- Componentes em PascalCase
- Arquivos de componentes com extensão `.tsx`
- Hooks customizados começam com `use`
- Tipos e interfaces em PascalCase
- Constantes em UPPER_SNAKE_CASE
- Funções e variáveis em camelCase

## Autenticação

O sistema utiliza JWT com refresh tokens:

1. Access Token: armazenado em `localStorage`, duração curta (15 min)
2. Refresh Token: armazenado em `localStorage`, duração longa (7 dias)
3. Renovação automática via interceptor do Axios
4. Redirecionamento para login em caso de falha na renovação

## Rotas

- `/` - Home page
- `/login` - Login
- `/register` - Cadastro
- `/forgot-password` - Redefinição de senha
- `/courses` - Lista de cursos
- `/courses/:id` - Detalhes do curso
- `/courses/:id/watch` - Player de vídeo
- `/profile` - Perfil do usuário
- `/certificates` - Certificados
- `/instructor/dashboard` - Dashboard do instrutor
- `/instructor/courses` - Cursos do instrutor
- `/admin/dashboard` - Dashboard administrativo
- `/admin/instructors` - Gestão de instrutores
- `/admin/courses` - Aprovação de cursos
- `/admin/subscriptions` - Gestão de assinaturas
- `/admin/reports` - Relatórios

## Contribuindo

1. Crie uma branch para sua feature
2. Faça commit das mudanças
3. Abra um Pull Request
