# Documento de Design - Plataforma EAD

## Visão Geral

A Plataforma EAD será desenvolvida como uma aplicação web moderna baseada em arquitetura de três camadas (apresentação, lógica de negócio e dados), com separação clara de responsabilidades e foco em escalabilidade, segurança e experiência do usuário.

### Objetivos do Design

- Criar uma arquitetura modular que permita crescimento incremental
- Garantir segurança em todas as camadas da aplicação
- Proporcionar experiência responsiva e fluida em todos os dispositivos
- Facilitar integração com serviços externos (pagamento, armazenamento, e-mail)
- Permitir manutenção e evolução contínua do sistema

### Princípios de Design

1. **Separação de Responsabilidades**: Cada módulo tem uma responsabilidade clara e bem definida
2. **Segurança por Design**: Autenticação, autorização e criptografia em todas as camadas
3. **Escalabilidade Horizontal**: Arquitetura que permite adicionar recursos conforme demanda
4. **API-First**: Backend expõe APIs RESTful para consumo do frontend
5. **Mobile-First**: Interface projetada primeiro para dispositivos móveis

## Arquitetura

### Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                     CAMADA DE APRESENTAÇÃO                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile Web  │  │    Admin     │      │
│  │  (React/Vue) │  │  (Responsive)│  │   Dashboard  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTPS / REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                   CAMADA DE APLICAÇÃO                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Gateway / Load Balancer             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   Auth   │ │  Courses │ │  Users   │ │ Payments │      │
│  │  Service │ │  Service │ │  Service │ │  Service │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │  Reports │ │  Certif. │ │  Notif.  │                      │
│  │  Service │ │  Service │ │  Service │                      │
│  └──────────┘ └──────────┘ └──────────┘                      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     CAMADA DE DADOS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Database   │  │  File Storage│  │     Cache    │      │
│  │ (PostgreSQL) │  │   (S3/R2)    │  │    (Redis)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   SERVIÇOS EXTERNOS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Payment    │  │    Email     │  │     CDN      │      │
│  │   Gateway    │  │   Service    │  │   (Videos)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológica Recomendada

**Frontend:**
- Framework: React ou Vue.js
- UI Library: Tailwind CSS ou Material-UI
- State Management: Redux/Zustand ou Pinia
- Video Player: Video.js ou Plyr

**Backend:**
- Runtime: Node.js (Express/Fastify) ou Python (FastAPI/Django)
- ORM: Prisma, TypeORM ou SQLAlchemy
- Autenticação: JWT + Refresh Tokens
- Validação: Zod, Joi ou Pydantic

**Banco de Dados:**
- Principal: PostgreSQL (dados relacionais)
- Cache: Redis (sessões, cache de queries)
- Busca: Elasticsearch (opcional, para busca avançada de cursos)

**Armazenamento:**
- Arquivos: AWS S3, Cloudflare R2 ou MinIO
- CDN: CloudFront, Cloudflare ou similar

**Infraestrutura:**
- Containerização: Docker
- Orquestração: Kubernetes ou Docker Compose
- CI/CD: GitHub Actions, GitLab CI ou Jenkins
- Monitoramento: Prometheus + Grafana

## Componentes e Interfaces

### 1. Módulo de Autenticação e Autorização

**Responsabilidades:**
- Gerenciar cadastro, login e logout de usuários
- Emitir e validar tokens JWT
- Controlar permissões baseadas em perfis (RBAC)
- Gerenciar redefinição de senhas
- Registrar logs de acesso

**Componentes:**

- `AuthController`: Endpoints de autenticação
- `AuthService`: Lógica de negócio de autenticação
- `TokenService`: Geração e validação de JWT
- `PasswordService`: Hash e validação de senhas (bcrypt)
- `PermissionMiddleware`: Verificação de permissões por rota

**Interfaces Principais:**

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
  passwordHash: string;
  isActive: boolean;
  lastAccessAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  gdprConsent: boolean;
}
```

**Endpoints:**
- `POST /api/auth/register` - Cadastro de aluno
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Solicitar redefinição
- `POST /api/auth/reset-password` - Redefinir senha

### 2. Módulo de Gestão de Usuários

**Responsabilidades:**
- CRUD de administradores e instrutores
- Gerenciar perfis de alunos
- Controlar suspensões e ativações
- Manter histórico de ações

**Componentes:**
- `UserController`: Endpoints de gestão de usuários
- `UserService`: Lógica de negócio de usuários
- `InstructorService`: Lógica específica de instrutores
- `StudentService`: Lógica específica de alunos

**Interfaces Principais:**

```typescript
interface Instructor extends User {
  bio?: string;
  expertise?: string[];
  isSuspended: boolean;
  suspendedAt?: Date;
  suspendedBy?: string;
}

interface Student extends User {
  subscriptionId?: string;
  subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  subscriptionExpiresAt?: Date;
  totalStudyTime: number;
}

interface CreateInstructorRequest {
  email: string;
  name: string;
  bio?: string;
  expertise?: string[];
}
```

**Endpoints:**
- `POST /api/admin/instructors` - Criar instrutor (admin)
- `GET /api/admin/instructors` - Listar instrutores (admin)
- `PATCH /api/admin/instructors/:id/suspend` - Suspender instrutor (admin)
- `GET /api/students/profile` - Perfil do aluno
- `PATCH /api/students/profile` - Atualizar perfil

### 3. Módulo de Cursos

**Responsabilidades:**
- CRUD de cursos, módulos e aulas
- Gerenciar publicação e versionamento
- Controlar acesso baseado em assinatura
- Registrar progresso dos alunos

**Componentes:**
- `CourseController`: Endpoints de cursos
- `CourseService`: Lógica de negócio de cursos
- `ModuleService`: Gerenciamento de módulos
- `LessonService`: Gerenciamento de aulas
- `ProgressService`: Rastreamento de progresso

**Interfaces Principais:**

```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  workload: number; // em horas
  instructorId: string;
  status: 'draft' | 'pending_approval' | 'published' | 'archived';
  version: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  createdAt: Date;
}

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'text' | 'external_link';
  content: string; // URL ou conteúdo
  duration?: number; // em minutos
  order: number;
  createdAt: Date;
}

interface StudentProgress {
  id: string;
  studentId: string;
  courseId: string;
  completedLessons: string[]; // IDs das aulas
  progressPercentage: number;
  lastAccessedAt: Date;
  startedAt: Date;
  completedAt?: Date;
  isFavorite: boolean;
}
```

**Endpoints:**
- `POST /api/courses` - Criar curso (instrutor)
- `GET /api/courses` - Listar cursos publicados
- `GET /api/courses/:id` - Detalhes do curso
- `PATCH /api/courses/:id` - Atualizar curso (instrutor)
- `POST /api/courses/:id/modules` - Adicionar módulo
- `POST /api/modules/:id/lessons` - Adicionar aula
- `POST /api/courses/:id/submit` - Enviar para aprovação
- `PATCH /api/admin/courses/:id/approve` - Aprovar curso (admin)
- `POST /api/courses/:id/progress` - Registrar progresso
- `GET /api/students/courses/progress` - Progresso do aluno

### 4. Módulo de Avaliações

**Responsabilidades:**
- Criar e gerenciar avaliações
- Processar respostas de alunos
- Calcular notas automaticamente (múltipla escolha)
- Permitir correção manual (dissertativas)

**Componentes:**
- `AssessmentController`: Endpoints de avaliações
- `AssessmentService`: Lógica de avaliações
- `GradingService`: Cálculo e atribuição de notas

**Interfaces Principais:**

```typescript
interface Assessment {
  id: string;
  courseId: string;
  title: string;
  type: 'multiple_choice' | 'essay';
  passingScore: number; // 0-100
  questions: Question[];
  createdAt: Date;
}

interface Question {
  id: string;
  assessmentId: string;
  text: string;
  type: 'multiple_choice' | 'essay';
  options?: string[]; // para múltipla escolha
  correctAnswer?: number; // índice da resposta correta
  points: number;
  order: number;
}

interface StudentAssessment {
  id: string;
  studentId: string;
  assessmentId: string;
  answers: Answer[];
  score?: number;
  status: 'pending' | 'graded';
  submittedAt: Date;
  gradedAt?: Date;
  gradedBy?: string;
}

interface Answer {
  questionId: string;
  answer: string | number; // texto ou índice
  points?: number;
}
```

**Endpoints:**
- `POST /api/courses/:id/assessments` - Criar avaliação (instrutor)
- `GET /api/assessments/:id` - Detalhes da avaliação
- `POST /api/assessments/:id/submit` - Submeter respostas (aluno)
- `GET /api/instructor/assessments/pending` - Avaliações pendentes de correção
- `PATCH /api/assessments/:id/grade` - Corrigir avaliação (instrutor)

### 5. Módulo de Assinaturas e Pagamentos

**Responsabilidades:**
- Integrar com gateway de pagamento
- Gerenciar ciclo de vida das assinaturas
- Processar webhooks de pagamento
- Controlar acesso baseado em status de pagamento

**Componentes:**
- `SubscriptionController`: Endpoints de assinaturas
- `SubscriptionService`: Lógica de assinaturas
- `PaymentGatewayService`: Integração com gateway (Stripe, Mercado Pago, etc.)
- `WebhookHandler`: Processamento de eventos de pagamento

**Interfaces Principais:**

```typescript
interface Subscription {
  id: string;
  studentId: string;
  planId: string;
  status: 'active' | 'suspended' | 'cancelled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  gatewaySubscriptionId: string;
  createdAt: Date;
}

interface Payment {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  gatewayPaymentId: string;
  paidAt?: Date;
  createdAt: Date;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  isActive: boolean;
}
```

**Endpoints:**
- `POST /api/subscriptions` - Criar assinatura (aluno)
- `GET /api/subscriptions/current` - Assinatura atual (aluno)
- `POST /api/subscriptions/cancel` - Cancelar assinatura (aluno)
- `POST /api/subscriptions/reactivate` - Reativar assinatura (aluno)
- `POST /api/webhooks/payment` - Webhook do gateway
- `GET /api/admin/subscriptions` - Listar assinaturas (admin)

**Fluxo de Pagamento:**

```
1. Aluno clica em "Assinar"
2. Frontend redireciona para checkout do gateway
3. Aluno completa pagamento no gateway
4. Gateway envia webhook para backend
5. Backend processa webhook e ativa assinatura
6. Backend concede acesso aos cursos
7. Backend envia e-mail de confirmação
```

### 6. Módulo de Certificados

**Responsabilidades:**
- Gerar certificados em PDF
- Criar códigos únicos de verificação
- Disponibilizar links públicos de validação
- Armazenar certificados emitidos

**Componentes:**
- `CertificateController`: Endpoints de certificados
- `CertificateService`: Lógica de geração
- `PDFGenerator`: Geração de PDF (usando bibliotecas como PDFKit ou Puppeteer)
- `VerificationService`: Validação de certificados

**Interfaces Principais:**

```typescript
interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  verificationCode: string;
  issuedAt: Date;
  pdfUrl: string;
  publicUrl: string;
}
```

**Endpoints:**
- `GET /api/certificates` - Listar certificados do aluno
- `GET /api/certificates/:id/download` - Download do PDF
- `GET /api/public/certificates/verify/:code` - Validar certificado

**Template do Certificado:**
- Logo da plataforma
- Nome do aluno
- Nome do curso
- Carga horária
- Data de conclusão
- Assinatura digital (hash)
- Código de verificação (UUID)
- QR Code com link de validação

### 7. Módulo de Notificações

**Responsabilidades:**
- Enviar e-mails transacionais
- Notificar sobre eventos importantes
- Gerenciar preferências de notificação

**Componentes:**
- `NotificationService`: Lógica de notificações
- `EmailService`: Integração com serviço de e-mail (SendGrid, AWS SES, etc.)
- `NotificationQueue`: Fila de processamento assíncrono

**Tipos de Notificações:**
- Boas-vindas ao cadastrar
- Credenciais de instrutor criado
- Curso enviado para aprovação
- Curso aprovado/rejeitado
- Novo curso publicado
- Assinatura confirmada
- Assinatura próxima do vencimento
- Assinatura suspensa
- Certificado emitido
- Redefinição de senha

### 8. Módulo de Relatórios e Analytics

**Responsabilidades:**
- Gerar relatórios administrativos
- Calcular métricas de negócio
- Exportar dados em CSV/PDF
- Integrar dados financeiros do gateway

**Componentes:**
- `ReportController`: Endpoints de relatórios
- `ReportService`: Lógica de geração de relatórios
- `MetricsService`: Cálculo de métricas
- `ExportService`: Exportação de dados

**Métricas Principais:**
- Total de assinantes ativos
- Novos assinantes no período
- Taxa de cancelamento (churn rate)
- Taxa de retenção
- Receita mensal recorrente (MRR)
- Cursos mais acessados
- Cursos com maior taxa de conclusão
- Tempo médio de conclusão por curso
- Instrutores mais populares

**Endpoints:**
- `GET /api/admin/reports/overview` - Visão geral
- `GET /api/admin/reports/subscriptions` - Relatório de assinaturas
- `GET /api/admin/reports/courses` - Relatório de cursos
- `GET /api/admin/reports/financial` - Relatório financeiro
- `GET /api/admin/reports/export` - Exportar relatório

## Modelos de Dados

### Diagrama de Relacionamento de Entidades (ERD)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Course    │       │   Module    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ email       │       │ title       │       │ courseId(FK)│
│ name        │◄──┐   │ description │   ┌──►│ title       │
│ role        │   │   │ instructorId│───┘   │ order       │
│ passwordHash│   │   │ status      │       └─────────────┘
└─────────────┘   │   │ version     │              │
                  │   └─────────────┘              │
                  │          │                     │
                  │          │                     ▼
                  │          │            ┌─────────────┐
                  │          │            │   Lesson    │
                  │          │            ├─────────────┤
                  │          │            │ id (PK)     │
                  │          │            │ moduleId(FK)│
                  │          │            │ title       │
                  │          │            │ type        │
                  │          │            │ content     │
                  │          │            └─────────────┘
                  │          │
                  │          ▼
                  │   ┌─────────────┐
                  │   │ Assessment  │
                  │   ├─────────────┤
                  │   │ id (PK)     │
                  │   │ courseId(FK)│
                  │   │ title       │
                  │   │ passingScore│
                  │   └─────────────┘
                  │
                  ├──────────────────────┐
                  │                      │
                  ▼                      ▼
         ┌─────────────┐        ┌─────────────┐
         │Subscription │        │  Progress   │
         ├─────────────┤        ├─────────────┤
         │ id (PK)     │        │ id (PK)     │
         │ studentId   │        │ studentId   │
         │ status      │        │ courseId(FK)│
         │ expiresAt   │        │ percentage  │
         └─────────────┘        └─────────────┘
                │
                ▼
         ┌─────────────┐
         │   Payment   │
         ├─────────────┤
         │ id (PK)     │
         │ subscrip.(FK)│
         │ amount      │
         │ status      │
         └─────────────┘
```

### Schema do Banco de Dados (PostgreSQL)

**Tabela: users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_access_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Tabela: instructors**
```sql
CREATE TABLE instructors (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  expertise TEXT[],
  is_suspended BOOLEAN DEFAULT false,
  suspended_at TIMESTAMP,
  suspended_by UUID REFERENCES users(id)
);
```

**Tabela: students**
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  subscription_status VARCHAR(20) DEFAULT 'inactive',
  subscription_expires_at TIMESTAMP,
  total_study_time INTEGER DEFAULT 0,
  gdpr_consent BOOLEAN NOT NULL,
  gdpr_consent_at TIMESTAMP
);
```

**Tabela: courses**
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image VARCHAR(500),
  category VARCHAR(100),
  workload INTEGER NOT NULL,
  instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_status ON courses(status);
```

**Tabela: modules**
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_modules_course ON modules(course_id);
```

**Tabela: lessons**
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'pdf', 'text', 'external_link')),
  content TEXT NOT NULL,
  duration INTEGER,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lessons_module ON lessons(module_id);
```

**Tabela: student_progress**
```sql
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  completed_lessons UUID[],
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  last_accessed_at TIMESTAMP,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_course ON student_progress(course_id);
```

**Tabela: subscriptions**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  status VARCHAR(20) NOT NULL,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  gateway_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_student ON subscriptions(student_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

**Tabela: payments**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL,
  gateway_payment_id VARCHAR(255),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_subscription ON payments(subscription_id);
```

**Tabela: certificates**
```sql
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  verification_code VARCHAR(100) UNIQUE NOT NULL,
  pdf_url VARCHAR(500) NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_certificates_verification ON certificates(verification_code);
```

## Tratamento de Erros

### Estratégia de Tratamento de Erros

**Códigos de Status HTTP:**
- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: e-mail já cadastrado)
- `422 Unprocessable Entity` - Validação falhou
- `429 Too Many Requests` - Rate limit excedido
- `500 Internal Server Error` - Erro do servidor

**Formato de Resposta de Erro:**

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
  };
}
```

**Exemplo:**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "E-mail ou senha incorretos",
    "timestamp": "2025-11-11T10:30:00Z",
    "path": "/api/auth/login"
  }
}
```

### Categorias de Erros

**Erros de Validação:**
- Campos obrigatórios ausentes
- Formato de dados inválido
- Valores fora do intervalo permitido

**Erros de Autenticação:**
- Token inválido ou expirado
- Credenciais incorretas
- Sessão expirada

**Erros de Autorização:**
- Permissão insuficiente
- Recurso não pertence ao usuário
- Ação não permitida para o perfil

**Erros de Negócio:**
- Assinatura inativa
- Curso não publicado
- Avaliação já submetida
- Certificado já emitido

**Erros de Integração:**
- Falha no gateway de pagamento
- Erro ao enviar e-mail
- Falha no upload de arquivo

### Logging e Monitoramento

**Níveis de Log:**
- `ERROR` - Erros que impedem operação
- `WARN` - Situações anormais mas recuperáveis
- `INFO` - Eventos importantes do sistema
- `DEBUG` - Informações detalhadas para debug

**Informações Registradas:**
- Timestamp
- Nível de log
- Mensagem
- Stack trace (para erros)
- User ID (quando aplicável)
- Request ID (para rastreamento)
- Contexto adicional

**Ferramentas de Monitoramento:**
- Logs centralizados (ELK Stack ou similar)
- APM (Application Performance Monitoring)
- Alertas automáticos para erros críticos
- Dashboards de métricas em tempo real

## Estratégia de Testes

### Pirâmide de Testes

```
        ┌─────────────┐
        │   E2E Tests │  (10%)
        └─────────────┘
      ┌─────────────────┐
      │ Integration Tests│ (30%)
      └─────────────────┘
    ┌─────────────────────┐
    │    Unit Tests       │ (60%)
    └─────────────────────┘
```

### Testes Unitários

**Escopo:**
- Funções de validação
- Lógica de negócio isolada
- Cálculos (progresso, notas, etc.)
- Formatação de dados

**Ferramentas:**
- Jest (Node.js) ou Pytest (Python)
- Mocks para dependências externas

**Exemplo de Casos de Teste:**
- Validação de e-mail
- Hash de senha
- Cálculo de percentual de progresso
- Geração de código de verificação

### Testes de Integração

**Escopo:**
- Endpoints da API
- Integração com banco de dados
- Fluxos completos de funcionalidades
- Integração com serviços externos (mocked)

**Ferramentas:**
- Supertest (Node.js) ou TestClient (FastAPI)
- Banco de dados de teste
- Mocks para serviços externos

**Exemplo de Casos de Teste:**
- Fluxo completo de cadastro e login
- Criação de curso com módulos e aulas
- Processo de assinatura
- Emissão de certificado

### Testes End-to-End (E2E)

**Escopo:**
- Fluxos críticos do usuário
- Interação completa frontend-backend
- Cenários de uso real

**Ferramentas:**
- Playwright ou Cypress

**Exemplo de Casos de Teste:**
- Aluno assina, acessa curso e conclui aula
- Instrutor cria curso e envia para aprovação
- Admin aprova curso e ele fica disponível

### Testes de Performance

**Métricas:**
- Tempo de resposta das APIs (< 2s em 95% dos casos)
- Throughput (requisições por segundo)
- Uso de memória e CPU
- Tempo de carregamento de páginas

**Ferramentas:**
- Apache JMeter ou k6
- Lighthouse (para frontend)

**Cenários de Teste:**
- 100 usuários simultâneos assistindo aulas
- 1000 requisições por minuto na API
- Upload de vídeos grandes
- Geração de relatórios complexos

### Testes de Segurança

**Verificações:**
- Injeção SQL
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Autenticação e autorização
- Rate limiting
- Validação de entrada

**Ferramentas:**
- OWASP ZAP
- Snyk (análise de dependências)
- SonarQube (qualidade de código)

## Segurança

### Autenticação e Autorização

**JWT (JSON Web Tokens):**
- Access Token: curta duração (15 minutos)
- Refresh Token: longa duração (7 dias), armazenado em httpOnly cookie
- Rotação de refresh tokens a cada uso

**RBAC (Role-Based Access Control):**
```typescript
const permissions = {
  admin: ['*'], // todas as permissões
  instructor: [
    'courses:create',
    'courses:update:own',
    'courses:delete:own',
    'assessments:grade',
    'students:view:enrolled'
  ],
  student: [
    'courses:view:published',
    'lessons:view',
    'assessments:submit',
    'certificates:view:own'
  ]
};
```

### Proteções Implementadas

**Rate Limiting:**
- Login: 5 tentativas por 15 minutos
- API geral: 100 requisições por minuto por IP
- Upload de arquivos: 10 por hora

**Validação de Entrada:**
- Sanitização de todos os inputs
- Validação de tipos e formatos
- Whitelist de caracteres permitidos
- Limite de tamanho de payloads

**Proteção de Dados:**
- Senhas: bcrypt com salt rounds = 12
- Dados sensíveis: criptografia AES-256
- Comunicação: TLS 1.3
- Headers de segurança: HSTS, CSP, X-Frame-Options

**Proteção contra Ataques:**
- SQL Injection: uso de ORM com prepared statements
- XSS: sanitização de HTML, CSP headers
- CSRF: tokens CSRF em formulários
- Clickjacking: X-Frame-Options header

### Conformidade LGPD

**Consentimento:**
- Checkbox explícito no cadastro
- Registro de data/hora do consentimento
- Possibilidade de revogar consentimento

**Direitos do Titular:**
- Acesso aos dados pessoais
- Correção de dados
- Exclusão de dados (direito ao esquecimento)
- Portabilidade de dados

**Implementação:**
```typescript
// Endpoint para solicitar dados
GET /api/gdpr/my-data
Response: JSON com todos os dados do usuário

// Endpoint para solicitar exclusão
POST /api/gdpr/delete-account
- Anonimiza dados obrigatórios (pagamentos, certificados)
- Remove dados pessoais identificáveis
- Mantém dados agregados para relatórios
```

## Escalabilidade e Performance

### Estratégias de Cache

**Redis Cache:**
```typescript
// Cache de sessões de usuário
Key: `session:${userId}`
TTL: 30 minutos

// Cache de cursos publicados
Key: `course:${courseId}`
TTL: 1 hora

// Cache de lista de cursos
Key: `courses:published`
TTL: 15 minutos

// Cache de progresso do aluno
Key: `progress:${studentId}:${courseId}`
TTL: 5 minutos
```

**CDN para Conteúdo Estático:**
- Vídeos servidos via CDN
- Imagens de capa otimizadas
- Assets do frontend (JS, CSS)
- Certificados em PDF

**Database Query Optimization:**
- Índices em colunas frequentemente consultadas
- Paginação de resultados
- Eager loading de relacionamentos
- Query caching para relatórios

### Arquitetura de Escalabilidade

**Horizontal Scaling:**
- Múltiplas instâncias da API atrás de load balancer
- Stateless API (sessões no Redis)
- Database read replicas para consultas

**Vertical Scaling:**
- Aumento de recursos conforme necessário
- Otimização de queries antes de escalar

**Microserviços (Futuro):**
- Separar serviços por domínio
- Comunicação via message queue
- Escalabilidade independente por serviço

### Otimizações de Performance

**Backend:**
- Compressão gzip/brotli de respostas
- Connection pooling para banco de dados
- Processamento assíncrono de tarefas pesadas
- Lazy loading de dados relacionados

**Frontend:**
- Code splitting
- Lazy loading de componentes
- Otimização de imagens (WebP, lazy loading)
- Service Workers para cache offline
- Debouncing de requisições

**Vídeos:**
- Streaming adaptativo (HLS ou DASH)
- Múltiplas resoluções (360p, 720p, 1080p)
- Thumbnails para preview
- Compressão otimizada

## Backup e Recuperação

### Estratégia de Backup

**Backup Diário Automático:**
- Horário: 03:00 AM (horário de menor uso)
- Tipo: Incremental diário, full semanal
- Retenção: 30 dias
- Localização: Região geográfica diferente

**Dados Incluídos:**
- Banco de dados completo
- Arquivos de configuração
- Logs dos últimos 7 dias
- Metadados de arquivos em storage

**Processo de Restauração:**
1. Identificar ponto de restauração
2. Provisionar ambiente de recuperação
3. Restaurar banco de dados
4. Restaurar arquivos de configuração
5. Validar integridade dos dados
6. Testar funcionalidades críticas
7. Redirecionar tráfego

**RTO (Recovery Time Objective):** 4 horas
**RPO (Recovery Point Objective):** 24 horas

## Deployment e DevOps

### Pipeline CI/CD

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Git    │───►│  Build   │───►│   Test   │───►│  Deploy  │
│   Push   │    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │               │               │
                     ▼               ▼               ▼
                 Compile         Unit Tests      Staging
                 Lint            Integration     Production
                 Bundle          E2E Tests
```

**Stages:**

1. **Build:**
   - Instalar dependências
   - Compilar código
   - Lint e formatação
   - Build de assets

2. **Test:**
   - Testes unitários
   - Testes de integração
   - Análise de cobertura (mínimo 80%)
   - Testes de segurança

3. **Deploy Staging:**
   - Deploy automático em ambiente de staging
   - Smoke tests
   - Testes E2E

4. **Deploy Production:**
   - Aprovação manual
   - Blue-green deployment
   - Health checks
   - Rollback automático em caso de falha

### Ambientes

**Development:**
- Ambiente local dos desenvolvedores
- Docker Compose para serviços
- Dados de teste

**Staging:**
- Réplica do ambiente de produção
- Dados anonimizados de produção
- Testes finais antes do deploy

**Production:**
- Ambiente de produção
- Alta disponibilidade
- Monitoramento 24/7

### Infraestrutura como Código

**Docker Compose (Desenvolvimento):**
```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/ead
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=ead
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Kubernetes (Produção):**
- Deployments para API (múltiplas réplicas)
- StatefulSets para banco de dados
- Services para load balancing
- Ingress para roteamento
- ConfigMaps e Secrets para configuração
- HorizontalPodAutoscaler para auto-scaling

## Considerações de UX/UI

### Design Responsivo

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Componentes Adaptativos:**
- Menu hamburguer em mobile
- Grid responsivo para lista de cursos
- Player de vídeo adaptativo
- Formulários otimizados para touch

### Acessibilidade (WCAG 2.1 Level AA)

**Implementações:**
- Navegação por teclado completa
- Labels descritivos em formulários
- Contraste adequado de cores (mínimo 4.5:1)
- Textos alternativos em imagens
- ARIA labels em componentes interativos
- Legendas em vídeos (quando disponível)
- Suporte a leitores de tela

### Fluxos de Usuário Principais

**Fluxo do Aluno:**
```
1. Cadastro → 2. Assinatura → 3. Explorar Cursos → 
4. Iniciar Curso → 5. Assistir Aulas → 6. Fazer Avaliação → 
7. Receber Certificado
```

**Fluxo do Instrutor:**
```
1. Receber Convite → 2. Ativar Conta → 3. Criar Curso → 
4. Adicionar Módulos/Aulas → 5. Criar Avaliação → 
6. Enviar para Aprovação → 7. Acompanhar Alunos
```

**Fluxo do Admin:**
```
1. Login → 2. Dashboard → 3. Gerenciar Instrutores → 
4. Revisar Cursos → 5. Aprovar/Rejeitar → 6. Visualizar Relatórios
```

### Feedback Visual

**Estados de Loading:**
- Skeleton screens para carregamento de listas
- Spinners para ações
- Progress bars para uploads

**Notificações:**
- Toast notifications para ações rápidas
- Modals para confirmações importantes
- Badges para notificações não lidas

**Validação de Formulários:**
- Validação em tempo real
- Mensagens de erro claras
- Indicadores visuais de campos obrigatórios

## Integrações Externas

### Gateway de Pagamento

**Opções Recomendadas:**
- Stripe (internacional)
- Mercado Pago (América Latina)
- PagSeguro (Brasil)

**Implementação:**
```typescript
interface PaymentGatewayService {
  createCheckoutSession(planId: string, studentId: string): Promise<string>;
  createSubscription(customerId: string, planId: string): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  handleWebhook(payload: any, signature: string): Promise<void>;
}
```

**Webhooks a Processar:**
- `subscription.created` - Nova assinatura
- `subscription.updated` - Atualização de status
- `subscription.deleted` - Cancelamento
- `payment.succeeded` - Pagamento confirmado
- `payment.failed` - Falha no pagamento

### Serviço de E-mail

**Opções Recomendadas:**
- SendGrid
- AWS SES
- Mailgun

**Templates de E-mail:**
- Boas-vindas
- Confirmação de assinatura
- Credenciais de instrutor
- Notificação de novo curso
- Certificado emitido
- Redefinição de senha
- Lembrete de vencimento

### Armazenamento de Arquivos

**AWS S3 / Cloudflare R2:**
```typescript
interface StorageService {
  uploadFile(file: Buffer, path: string): Promise<string>;
  getSignedUrl(path: string, expiresIn: number): Promise<string>;
  deleteFile(path: string): Promise<void>;
}
```

**Estrutura de Pastas:**
```
/courses/{courseId}/cover.jpg
/courses/{courseId}/lessons/{lessonId}/video.mp4
/courses/{courseId}/lessons/{lessonId}/material.pdf
/certificates/{certificateId}.pdf
/users/{userId}/avatar.jpg
```

## Decisões de Design e Justificativas

### 1. Arquitetura Monolítica Modular

**Decisão:** Iniciar com monolito modular ao invés de microserviços.

**Justificativa:**
- Menor complexidade inicial
- Mais rápido para MVP
- Facilita desenvolvimento e debug
- Possibilidade de migrar para microserviços no futuro
- Módulos bem definidos facilitam separação futura

### 2. PostgreSQL como Banco Principal

**Decisão:** Usar PostgreSQL ao invés de NoSQL.

**Justificativa:**
- Dados altamente relacionais (cursos, módulos, aulas)
- ACID compliance importante para pagamentos
- Suporte robusto a transações
- Excelente performance com índices adequados
- Maturidade e comunidade ativa

### 3. JWT para Autenticação

**Decisão:** JWT com refresh tokens ao invés de sessões no servidor.

**Justificativa:**
- Stateless, facilita escalabilidade horizontal
- Não requer consulta ao banco a cada requisição
- Suporte nativo em bibliotecas modernas
- Refresh tokens permitem revogação quando necessário

### 4. Redis para Cache

**Decisão:** Implementar camada de cache com Redis.

**Justificativa:**
- Reduz carga no banco de dados
- Melhora tempo de resposta significativamente
- Útil para sessões e dados frequentemente acessados
- Suporte a TTL automático

### 5. Armazenamento em Nuvem para Vídeos

**Decisão:** Usar S3/R2 ao invés de armazenar no servidor.

**Justificativa:**
- Vídeos são arquivos grandes
- CDN integrado para melhor performance
- Escalabilidade automática
- Custo-benefício melhor que storage local
- Backup e redundância gerenciados

### 6. Aprovação Manual de Cursos

**Decisão:** Exigir aprovação do admin antes de publicar cursos.

**Justificativa:**
- Controle de qualidade do conteúdo
- Evita conteúdo inadequado ou ilegal
- Mantém padrão da plataforma
- Proteção da marca

### 7. Modelo de Assinatura Única

**Decisão:** Um único plano de assinatura com acesso a todos os cursos.

**Justificativa:**
- Simplicidade para o usuário
- Incentiva exploração de múltiplos cursos
- Facilita gestão de acesso
- Modelo comprovado (Netflix, Spotify)
- Possibilidade de adicionar planos no futuro

### 8. Certificados Automáticos

**Decisão:** Emissão automática após conclusão e aprovação.

**Justificativa:**
- Gratificação imediata ao aluno
- Reduz carga administrativa
- Escalável
- Código de verificação garante autenticidade

## Roadmap de Implementação

### Fase 1 - MVP (2-3 meses)
- Autenticação e gestão de usuários
- CRUD de cursos, módulos e aulas
- Sistema de assinaturas básico
- Player de vídeo
- Dashboard administrativo básico

### Fase 2 - Funcionalidades Essenciais (1-2 meses)
- Sistema de avaliações
- Rastreamento de progresso
- Emissão de certificados
- Notificações por e-mail
- Relatórios básicos

### Fase 3 - Otimizações (1 mês)
- Implementação de cache
- Otimização de queries
- Melhorias de UX
- Testes de performance
- Ajustes de segurança

### Fase 4 - Funcionalidades Avançadas (Futuro)
- Sistema de busca avançada
- Recomendações personalizadas
- Gamificação (badges, pontos)
- Fórum de discussão
- Live streaming de aulas
- App mobile nativo
