# Plano de Implementação - Plataforma EAD

- [x] 1. Configurar estrutura inicial do projeto





  - Criar estrutura de pastas para backend (src/modules, src/config, src/shared)
  - Configurar TypeScript/Python com tsconfig/pyproject.toml
  - Configurar ESLint/Pylint e Prettier
  - Criar arquivo .env.example com variáveis de ambiente necessárias
  - Configurar Docker Compose para desenvolvimento local (PostgreSQL, Redis)
  - _Requisitos: Todos os requisitos dependem desta base_

- [x] 2. Implementar módulo de autenticação





  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 2.1 Criar schema do banco de dados para usuários


  - Implementar migration para tabela users com campos (id, email, name, role, password_hash, is_active, last_access_at, created_at, updated_at)
  - Adicionar índices em email e role
  - _Requisitos: 1.1, 1.4_

- [x] 2.2 Implementar serviço de hash de senhas


  - Criar PasswordService com métodos hash() e verify() usando bcrypt
  - Configurar salt rounds = 12
  - _Requisitos: 1.1, 12.2_

- [x] 2.3 Implementar serviço de tokens JWT


  - Criar TokenService para gerar access tokens (15 min) e refresh tokens (7 dias)
  - Implementar método de validação de tokens
  - Configurar assinatura com chave secreta do .env
  - _Requisitos: 1.3, 12.4_

- [x] 2.4 Criar endpoints de autenticação


  - Implementar POST /api/auth/register (cadastro de aluno com validação de email e GDPR consent)
  - Implementar POST /api/auth/login (retorna access e refresh tokens)
  - Implementar POST /api/auth/refresh (renova access token)
  - Implementar POST /api/auth/logout (invalida refresh token)
  - Adicionar validação de entrada com Zod/Joi/Pydantic
  - _Requisitos: 1.1, 1.3, 14.1_

- [x] 2.5 Implementar middleware de autenticação


  - Criar middleware que valida JWT em rotas protegidas
  - Extrair userId do token e adicionar ao contexto da requisição
  - Retornar 401 para tokens inválidos ou expirados
  - _Requisitos: 1.3, 12.4_

- [x] 2.6 Implementar funcionalidade de redefinição de senha


  - Criar endpoint POST /api/auth/forgot-password (gera token e envia email)
  - Criar endpoint POST /api/auth/reset-password (valida token e atualiza senha)
  - Implementar tokens de redefinição com expiração de 1 hora
  - _Requisitos: 1.5_

- [x] 2.7 Implementar rate limiting para login


  - Adicionar middleware de rate limiting (5 tentativas por 15 minutos)
  - Armazenar tentativas no Redis usando IP como chave
  - Retornar 429 quando limite excedido
  - _Requisitos: 12.3_

- [x] 2.8 Criar testes para módulo de autenticação


  - Testar cadastro com dados válidos e inválidos
  - Testar login com credenciais corretas e incorretas
  - Testar renovação e expiração de tokens
  - Testar rate limiting de login
  - _Requisitos: 1.1, 1.3, 1.5, 12.3_

- [ ] 3. Implementar módulo de gestão de usuários




  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Criar schemas para instrutores e alunos


  - Implementar migration para tabela instructors (id FK users, bio, expertise, is_suspended, suspended_at, suspended_by)
  - Implementar migration para tabela students (id FK users, subscription_status, subscription_expires_at, total_study_time, gdpr_consent, gdpr_consent_at)
  - _Requisitos: 2.1, 2.2, 14.1_

- [x] 3.2 Implementar middleware de autorização RBAC


  - Criar middleware que verifica permissões baseadas em role
  - Implementar verificação de ownership (ex: instrutor só edita próprios cursos)
  - Retornar 403 para acessos não autorizados
  - _Requisitos: 2.1, 2.2_

- [x] 3.3 Criar endpoints de gestão de instrutores (admin)


  - Implementar POST /api/admin/instructors (criar instrutor)
  - Implementar GET /api/admin/instructors (listar instrutores)
  - Implementar PATCH /api/admin/instructors/:id/suspend (suspender/reativar)
  - Adicionar proteção: apenas admin pode acessar
  - _Requisitos: 2.1, 2.2, 2.4, 2.5_

- [x] 3.4 Implementar serviço de notificação de criação de instrutor


  - Integrar com serviço de email (SendGrid/SES)
  - Criar template de email com credenciais
  - Enviar email automaticamente ao criar instrutor
  - _Requisitos: 2.3_

- [x] 3.5 Criar endpoints de perfil de aluno


  - Implementar GET /api/students/profile (visualizar próprio perfil)
  - Implementar PATCH /api/students/profile (atualizar nome, bio)
  - Adicionar proteção: aluno só acessa próprio perfil
  - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 3.6 Implementar registro de último acesso


  - Criar middleware que atualiza last_access_at em cada requisição autenticada
  - Usar update assíncrono para não impactar performance
  - _Requisitos: 1.4_

- [x] 3.7 Criar testes para gestão de usuários


  - Testar criação de instrutor por admin
  - Testar suspensão de instrutor
  - Testar acesso negado para não-admin
  - Testar atualização de perfil de aluno
  - _Requisitos: 2.1, 2.2, 2.4, 2.5_

- [x] 4. Implementar módulo de cursos





  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.1 Criar schemas de cursos, módulos e aulas


  - Implementar migration para tabela courses (id, title, description, cover_image, category, workload, instructor_id, status, version, created_at, updated_at, published_at)
  - Implementar migration para tabela modules (id, course_id, title, description, order_index, created_at)
  - Implementar migration para tabela lessons (id, module_id, title, description, type, content, duration, order_index, created_at)
  - Adicionar índices e foreign keys apropriados
  - _Requisitos: 3.1, 3.2, 3.3, 3.4_

- [x] 4.2 Implementar serviço de upload de arquivos


  - Integrar com S3/Cloudflare R2
  - Criar método uploadFile() que retorna URL pública
  - Implementar validação de tipo e tamanho de arquivo
  - Configurar estrutura de pastas (/courses/{courseId}/...)
  - _Requisitos: 3.4, 13.1_

- [x] 4.3 Criar endpoints CRUD de cursos (instrutor)


  - Implementar POST /api/courses (criar curso draft)
  - Implementar GET /api/courses/:id (detalhes do curso)
  - Implementar PATCH /api/courses/:id (atualizar curso)
  - Implementar DELETE /api/courses/:id (excluir curso draft)
  - Adicionar proteção: instrutor só gerencia próprios cursos
  - _Requisitos: 3.1, 3.5_

- [x] 4.4 Criar endpoints para módulos e aulas


  - Implementar POST /api/courses/:id/modules (adicionar módulo)
  - Implementar PATCH /api/modules/:id (atualizar módulo)
  - Implementar DELETE /api/modules/:id (remover módulo)
  - Implementar POST /api/modules/:id/lessons (adicionar aula)
  - Implementar PATCH /api/lessons/:id (atualizar aula)
  - Implementar DELETE /api/lessons/:id (remover aula)
  - Validar que curso tem pelo menos 1 módulo e 1 aula antes de enviar para aprovação
  - _Requisitos: 3.2, 3.3, 3.4_

- [x] 4.5 Implementar fluxo de aprovação de cursos


  - Criar endpoint POST /api/courses/:id/submit (instrutor envia para aprovação)
  - Criar endpoint PATCH /api/admin/courses/:id/approve (admin aprova)
  - Criar endpoint PATCH /api/admin/courses/:id/reject (admin rejeita com motivo)
  - Atualizar status do curso (draft → pending_approval → published)
  - Notificar instrutor sobre aprovação/rejeição
  - _Requisitos: 4.1, 4.2, 4.3, 4.5_

- [x] 4.6 Implementar versionamento de cursos


  - Criar tabela course_versions para histórico
  - Incrementar version ao publicar alterações
  - Manter snapshot do curso em cada versão
  - _Requisitos: 4.4_

- [x] 4.7 Criar endpoint de listagem de cursos publicados


  - Implementar GET /api/courses (listar cursos publicados com paginação)
  - Adicionar filtros por categoria
  - Adicionar busca por título
  - Retornar apenas cursos com status 'published'
  - _Requisitos: 7.1_



- [x] 4.8 Criar testes para módulo de cursos





  - Testar criação de curso por instrutor
  - Testar adição de módulos e aulas
  - Testar fluxo de aprovação completo
  - Testar que aluno não pode criar cursos
  - Testar listagem de cursos publicados
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [x] 5. Implementar módulo de assinaturas e pagamentos





  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_


- [x] 5.1 Criar schemas de assinaturas e pagamentos

  - Implementar migration para tabela plans (id, name, price, currency, interval, is_active)
  - Implementar migration para tabela subscriptions (id, student_id, plan_id, status, current_period_start, current_period_end, cancelled_at, gateway_subscription_id, created_at)
  - Implementar migration para tabela payments (id, subscription_id, amount, currency, status, gateway_payment_id, paid_at, created_at)
  - Adicionar índices apropriados
  - _Requisitos: 5.1, 6.1, 6.4_


- [x] 5.2 Integrar com gateway de pagamento

  - Configurar SDK do gateway (Stripe/Mercado Pago)
  - Implementar PaymentGatewayService com métodos createCheckoutSession(), createSubscription(), cancelSubscription()
  - Configurar webhooks no gateway apontando para /api/webhooks/payment
  - _Requisitos: 5.1, 5.4_


- [x] 5.3 Criar endpoints de assinatura

  - Implementar POST /api/subscriptions (criar assinatura e redirecionar para checkout)
  - Implementar GET /api/subscriptions/current (visualizar assinatura atual)
  - Implementar POST /api/subscriptions/cancel (cancelar assinatura)
  - Implementar POST /api/subscriptions/reactivate (reativar assinatura cancelada)
  - _Requisitos: 5.1, 5.4, 5.5_

- [x] 5.4 Implementar processamento de webhooks


  - Criar endpoint POST /api/webhooks/payment (validar assinatura do webhook)
  - Processar evento subscription.created (ativar assinatura)
  - Processar evento payment.succeeded (confirmar pagamento)
  - Processar evento payment.failed (suspender assinatura)
  - Processar evento subscription.deleted (cancelar assinatura)
  - Atualizar subscription_status e subscription_expires_at do aluno
  - _Requisitos: 5.2, 5.3_

- [x] 5.5 Implementar job de verificação de assinaturas expiradas


  - Criar job agendado (cron) que roda diariamente
  - Buscar assinaturas com current_period_end < hoje
  - Atualizar status para 'suspended' se não renovada
  - _Requisitos: 5.3_

- [x] 5.6 Criar endpoints administrativos de assinaturas


  - Implementar GET /api/admin/subscriptions (listar todas com filtros)
  - Implementar GET /api/admin/subscriptions/stats (métricas: total ativas, MRR, churn)
  - Adicionar proteção: apenas admin
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5.7 Criar testes para módulo de assinaturas


  - Testar criação de assinatura
  - Testar processamento de webhooks (mock do gateway)
  - Testar suspensão automática de assinatura expirada
  - Testar cancelamento e reativação
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Implementar módulo de progresso e acesso a cursos




  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6.1 Criar schema de progresso do aluno


  - Implementar migration para tabela student_progress (id, student_id, course_id, completed_lessons, progress_percentage, is_favorite, last_accessed_at, started_at, completed_at)
  - Adicionar constraint UNIQUE(student_id, course_id)
  - Adicionar índices em student_id e course_id
  - _Requisitos: 7.2, 7.3, 7.4_

- [x] 6.2 Implementar middleware de verificação de assinatura


  - Criar middleware que verifica se aluno tem assinatura ativa
  - Retornar 403 se assinatura inativa/expirada
  - Aplicar em rotas de acesso a cursos
  - _Requisitos: 7.1_

- [x] 6.3 Criar endpoints de acesso a cursos


  - Implementar GET /api/courses/:id/content (retorna curso com módulos e aulas)
  - Implementar GET /api/lessons/:id/content (retorna conteúdo da aula)
  - Adicionar proteção: apenas alunos com assinatura ativa
  - Para vídeos, retornar signed URL com expiração
  - _Requisitos: 7.1_

- [x] 6.4 Implementar registro de progresso


  - Criar endpoint POST /api/courses/:courseId/progress (marcar aula como concluída)
  - Calcular progress_percentage baseado em aulas concluídas
  - Atualizar last_accessed_at
  - Criar registro de progresso se não existir (started_at)
  - _Requisitos: 7.2, 7.3_

- [x] 6.5 Criar endpoints de gerenciamento de progresso


  - Implementar GET /api/students/courses/progress (listar progresso de todos os cursos)
  - Implementar PATCH /api/courses/:id/favorite (favoritar/desfavoritar curso)
  - Implementar GET /api/students/courses/history (histórico: iniciados, em andamento, concluídos)
  - _Requisitos: 7.4, 11.1, 11.2_

- [x] 6.6 Implementar notificação de novos cursos


  - Criar job que detecta cursos recém-publicados
  - Enviar email para todos os alunos com assinatura ativa
  - Marcar curso como notificado para não reenviar
  - _Requisitos: 7.5_

- [x] 6.7 Criar testes para módulo de progresso


  - Testar acesso negado sem assinatura ativa
  - Testar registro de progresso
  - Testar cálculo de percentual de conclusão
  - Testar favoritar curso
  - _Requisitos: 7.1, 7.2, 7.3, 7.4_

- [x] 7. Implementar módulo de avaliações





  - _Requisitos: 3.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7.1 Criar schemas de avaliações


  - Implementar migration para tabela assessments (id, course_id, title, type, passing_score, created_at)
  - Implementar migration para tabela questions (id, assessment_id, text, type, options, correct_answer, points, order_index)
  - Implementar migration para tabela student_assessments (id, student_id, assessment_id, answers, score, status, submitted_at, graded_at, graded_by)
  - _Requisitos: 3.5, 9.1, 9.2_

- [x] 7.2 Criar endpoints de criação de avaliações (instrutor)


  - Implementar POST /api/courses/:id/assessments (criar avaliação)
  - Implementar POST /api/assessments/:id/questions (adicionar questão)
  - Implementar PATCH /api/questions/:id (editar questão)
  - Implementar DELETE /api/questions/:id (remover questão)
  - Validar que avaliação tem pelo menos 1 questão
  - _Requisitos: 3.5_

- [x] 7.3 Criar endpoints de submissão de avaliações (aluno)


  - Implementar GET /api/assessments/:id (visualizar avaliação)
  - Implementar POST /api/assessments/:id/submit (submeter respostas)
  - Calcular nota automaticamente para múltipla escolha
  - Marcar como 'pending' para dissertativas
  - Impedir resubmissão de avaliação já submetida
  - _Requisitos: 9.2_

- [x] 7.4 Criar endpoints de correção (instrutor)


  - Implementar GET /api/instructor/assessments/pending (listar avaliações pendentes de correção)
  - Implementar GET /api/assessments/:id/submissions (ver submissões dos alunos)
  - Implementar PATCH /api/student-assessments/:id/grade (atribuir nota e feedback)
  - Atualizar status para 'graded' e registrar graded_by
  - _Requisitos: 9.3, 9.4_

- [x] 7.5 Implementar cálculo de nota final do curso


  - Criar método que calcula média ponderada de todas as avaliações
  - Considerar peso de cada avaliação baseado em pontos totais
  - Armazenar nota final no student_progress
  - _Requisitos: 9.5_

- [x] 7.6 Criar testes para módulo de avaliações


  - Testar criação de avaliação por instrutor
  - Testar submissão de respostas por aluno
  - Testar cálculo automático de nota (múltipla escolha)
  - Testar correção manual (dissertativa)
  - Testar que aluno não pode resubmeter
  - _Requisitos: 3.5, 9.1, 9.2, 9.3, 9.4_

- [x] 8. Implementar módulo de certificados




  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8.1 Criar schema de certificados


  - Implementar migration para tabela certificates (id, student_id, course_id, verification_code, pdf_url, issued_at)
  - Adicionar constraint UNIQUE(student_id, course_id)
  - Adicionar índice em verification_code
  - _Requisitos: 8.1, 8.2, 8.4_

- [x] 8.2 Implementar serviço de geração de PDF


  - Integrar biblioteca de geração de PDF (PDFKit/Puppeteer)
  - Criar template de certificado com logo, nome do aluno, curso, carga horária, data, código de verificação
  - Gerar QR Code com link de validação
  - Fazer upload do PDF para S3/R2 e retornar URL
  - _Requisitos: 8.2_

- [x] 8.3 Implementar lógica de emissão automática


  - Criar job que verifica cursos 100% concluídos com nota >= passing_score
  - Gerar certificado automaticamente se não existir
  - Gerar código único de verificação (UUID)
  - Enviar email com link de download
  - _Requisitos: 8.1, 8.3_

- [x] 8.4 Criar endpoints de certificados


  - Implementar GET /api/certificates (listar certificados do aluno)
  - Implementar GET /api/certificates/:id/download (download do PDF)
  - Implementar GET /api/public/certificates/verify/:code (validação pública)
  - Endpoint de validação não requer autenticação
  - _Requisitos: 8.4, 8.5, 11.4_

- [x] 8.5 Criar testes para módulo de certificados


  - Testar emissão automática após conclusão
  - Testar que certificado não é emitido se nota < passing_score
  - Testar validação pública de certificado
  - Testar que não duplica certificado
  - _Requisitos: 8.1, 8.2, 8.5_

- [x] 9. Implementar módulo de acompanhamento do instrutor




  - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9.1 Criar endpoints de visualização de alunos


  - Implementar GET /api/instructor/courses/:id/students (listar alunos matriculados)
  - Implementar GET /api/instructor/students/:id/progress/:courseId (progresso detalhado de um aluno)
  - Exibir percentual de conclusão, aulas concluídas, tempo de estudo
  - Adicionar proteção: instrutor só vê alunos dos próprios cursos
  - _Requisitos: 9.1, 9.2_

- [x] 9.2 Criar dashboard do instrutor


  - Implementar GET /api/instructor/dashboard (métricas dos cursos do instrutor)
  - Retornar: total de alunos, taxa de conclusão média, avaliações pendentes
  - Listar cursos com estatísticas individuais
  - _Requisitos: 9.1, 9.2, 9.5_

- [x] 9.3 Criar testes para acompanhamento do instrutor


  - Testar listagem de alunos matriculados
  - Testar que instrutor não vê alunos de outros cursos
  - Testar dashboard com métricas
  - _Requisitos: 9.1, 9.2_

- [x] 10. Implementar módulo de relatórios administrativos




  - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 10.1 Criar serviço de cálculo de métricas


  - Implementar método para calcular total de assinantes ativos
  - Implementar método para calcular novos assinantes no período
  - Implementar método para calcular taxa de retenção (1 - churn rate)
  - Implementar método para calcular MRR (Monthly Recurring Revenue)
  - Implementar método para calcular cursos mais acessados
  - _Requisitos: 10.1, 10.2, 10.3, 6.5_

- [x] 10.2 Criar endpoints de relatórios


  - Implementar GET /api/admin/reports/overview (visão geral com principais métricas)
  - Implementar GET /api/admin/reports/subscriptions (relatório detalhado de assinaturas)
  - Implementar GET /api/admin/reports/courses (relatório de cursos: acessos, conclusões, avaliações)
  - Implementar GET /api/admin/reports/financial (receita, MRR, projeções)
  - Adicionar filtros por período (data início, data fim)
  - Adicionar proteção: apenas admin
  - _Requisitos: 10.1, 10.2, 10.3, 10.4_

- [x] 10.3 Implementar exportação de relatórios


  - Criar serviço de exportação para CSV
  - Criar serviço de exportação para PDF
  - Implementar GET /api/admin/reports/export (com query params: format, type, period)
  - Gerar arquivo e retornar para download
  - _Requisitos: 10.5_

- [x] 10.4 Integrar dados financeiros do gateway


  - Buscar dados de pagamentos via API do gateway
  - Consolidar com dados locais de subscriptions e payments
  - Calcular métricas financeiras (receita total, média por assinante, etc.)
  - _Requisitos: 10.4_

- [x] 10.5 Criar testes para módulo de relatórios


  - Testar cálculo de métricas com dados mockados
  - Testar geração de relatórios
  - Testar exportação em CSV e PDF
  - Testar que apenas admin acessa relatórios
  - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11. Implementar módulo de notificações





  - _Requisitos: 2.3, 4.3, 7.5, 8.3_


- [x] 11.1 Configurar serviço de email

  - Integrar com SendGrid/AWS SES/Mailgun
  - Configurar credenciais e domínio de envio
  - Criar EmailService com método sendEmail(to, subject, html)
  - _Requisitos: 2.3, 4.3, 7.5, 8.3_

- [x] 11.2 Criar templates de email


  - Template de boas-vindas (cadastro de aluno)
  - Template de credenciais de instrutor
  - Template de curso enviado para aprovação
  - Template de curso aprovado/rejeitado
  - Template de novo curso publicado
  - Template de assinatura confirmada
  - Template de assinatura próxima do vencimento (3 dias antes)
  - Template de assinatura suspensa
  - Template de certificado emitido
  - Template de redefinição de senha
  - _Requisitos: 2.3, 4.3, 7.5, 8.3_

- [x] 11.3 Implementar fila de processamento de emails


  - Configurar Redis como message broker
  - Criar worker que processa fila de emails
  - Adicionar retry logic para falhas de envio
  - Registrar logs de emails enviados
  - _Requisitos: 2.3, 4.3, 7.5, 8.3_

- [x] 11.4 Integrar notificações nos fluxos existentes


  - Enviar email ao criar instrutor (task 3.4)
  - Enviar email ao aprovar/rejeitar curso (task 4.5)
  - Enviar email ao publicar novo curso (task 6.6)
  - Enviar email ao emitir certificado (task 8.3)
  - Enviar email ao confirmar assinatura (task 5.4)
  - _Requisitos: 2.3, 4.3, 7.5, 8.3_

- [x] 11.5 Criar testes para módulo de notificações


  - Testar envio de email (mock do serviço)
  - Testar processamento da fila
  - Testar retry em caso de falha
  - _Requisitos: 2.3, 4.3, 7.5, 8.3_

- [x] 12. Implementar funcionalidades de segurança e LGPD




  - _Requisitos: 12.1, 12.2, 12.3, 12.4, 12.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 12.1 Implementar headers de segurança


  - Adicionar middleware para headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
  - Configurar CORS adequadamente
  - _Requisitos: 12.1_


- [x] 12.2 Implementar proteção CSRF

  - Gerar tokens CSRF para formulários
  - Validar tokens em requisições POST/PUT/DELETE
  - _Requisitos: 12.1_

- [x] 12.3 Implementar rate limiting global


  - Adicionar middleware de rate limiting (100 req/min por IP)
  - Usar Redis para armazenar contadores
  - Retornar 429 quando limite excedido
  - _Requisitos: 12.3_


- [x] 12.4 Implementar logs de auditoria

  - Criar tabela audit_logs (id, user_id, action, resource, details, ip_address, timestamp)
  - Registrar ações críticas: login, criação de usuário, alteração de permissões, etc.
  - _Requisitos: 12.5_

- [x] 12.5 Implementar endpoints LGPD


  - Implementar GET /api/gdpr/my-data (retornar todos os dados do usuário em JSON)
  - Implementar POST /api/gdpr/delete-account (solicitar exclusão de conta)
  - Implementar job que processa solicitações de exclusão (anonimiza dados em 15 dias)
  - Manter dados obrigatórios (pagamentos, certificados) mas anonimizar informações pessoais
  - _Requisitos: 14.2, 14.3, 14.4_

- [x] 12.6 Criar testes de segurança


  - Testar rate limiting
  - Testar proteção CSRF
  - Testar headers de segurança
  - Testar endpoints LGPD
  - _Requisitos: 12.1, 12.3, 14.2, 14.3, 14.4_

- [x] 13. Implementar cache e otimizações de performance





  - _Requisitos: 15.1, 15.3, 15.4_


- [x] 13.1 Configurar Redis para cache

  - Configurar conexão com Redis
  - Criar CacheService com métodos get(), set(), delete(), clear()
  - Configurar TTLs padrão
  - _Requisitos: 15.1, 15.4_


- [x] 13.2 Implementar cache de cursos

  - Cachear lista de cursos publicados (TTL: 15 min)
  - Cachear detalhes de curso individual (TTL: 1 hora)
  - Invalidar cache ao publicar/atualizar curso
  - _Requisitos: 15.1_


- [x] 13.3 Implementar cache de progresso

  - Cachear progresso do aluno por curso (TTL: 5 min)
  - Invalidar cache ao atualizar progresso
  - _Requisitos: 15.1_


- [x] 13.4 Otimizar queries do banco de dados

  - Adicionar índices em colunas frequentemente consultadas
  - Implementar eager loading para relacionamentos
  - Adicionar paginação em todas as listagens
  - _Requisitos: 15.1, 15.4_

- [x] 13.5 Implementar compressão de respostas


  - Adicionar middleware de compressão gzip/brotli
  - Configurar para respostas > 1KB
  - _Requisitos: 15.1_


- [x] 13.6 Criar testes de performance

  - Testar tempo de resposta de endpoints críticos
  - Validar que 95% das requisições respondem em < 2s
  - Testar cache hit/miss
  - _Requisitos: 15.1_

- [x] 14. Implementar backup e monitoramento




  - _Requisitos: 13.2, 13.3, 13.4, 15.2_

- [x] 14.1 Configurar backup automático do banco de dados


  - Criar script de backup diário (pg_dump)
  - Configurar cron job para executar às 03:00 AM
  - Fazer upload do backup para S3/R2
  - Implementar rotação de backups (manter últimos 30 dias)
  - _Requisitos: 13.2, 13.3_


- [x] 14.2 Implementar endpoint de restore

  - Criar script de restauração de backup
  - Implementar POST /api/admin/backup/restore (apenas admin)
  - Validar integridade do backup antes de restaurar
  - _Requisitos: 13.4_



- [x] 14.3 Configurar logging estruturado

  - Implementar logger com níveis (ERROR, WARN, INFO, DEBUG)
  - Incluir contexto: timestamp, userId, requestId, stack trace
  - Configurar rotação de logs
  - _Requisitos: 12.5_


- [x] 14.4 Implementar health checks

  - Criar endpoint GET /health (verifica status da API)
  - Criar endpoint GET /health/db (verifica conexão com banco)
  - Criar endpoint GET /health/redis (verifica conexão com Redis)
  - Retornar status 200 se tudo OK, 503 se algum serviço falhar
  - _Requisitos: 15.2_


- [x] 14.5 Configurar alertas de monitoramento

  - Configurar alertas para erros críticos (500)
  - Configurar alertas para tempo de resposta > 5s
  - Configurar alertas para falhas de backup
  - Configurar alertas para uso de recursos (CPU, memória, disco)
  - _Requisitos: 15.2_

- [-] 15. Implementar frontend básico


  - _Requisitos: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 15.1 Configurar projeto frontend



  - Criar projeto React/Vue com Vite
  - Configurar Tailwind CSS ou Material-UI
  - Configurar React Router ou Vue Router
  - Configurar Axios para chamadas à API
  - Configurar gerenciamento de estado (Redux/Zustand ou Pinia)
  - _Requisitos: 16.1, 16.2, 16.5_

- [x] 15.2 Implementar páginas de autenticação





  - Criar página de login
  - Criar página de cadastro (aluno)
  - Criar página de redefinição de senha
  - Implementar armazenamento de tokens (localStorage/cookies)
  - Implementar renovação automática de tokens
  - _Requisitos: 1.1, 1.3, 1.5, 16.5_

- [x] 15.3 Implementar páginas do aluno






  - Criar página de listagem de cursos (com busca e filtros)
  - Criar página de detalhes do curso
  - Criar página de player de vídeo com lista de aulas
  - Criar página de perfil do aluno
  - Criar página de histórico de cursos
  - Criar página de certificados
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 11.1, 11.4, 16.1, 16.2, 16.5_

- [x] 15.4 Implementar páginas do instrutor





  - Criar dashboard do instrutor
  - Criar página de criação/edição de curso
  - Criar página de gerenciamento de módulos e aulas
  - Criar página de criação de avaliações
  - Criar página de correção de avaliações
  - Criar página de visualização de alunos matriculados
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2, 16.1, 16.2, 16.5_

- [x] 15.5 Implementar páginas do administrador





  - Criar dashboard administrativo com métricas
  - Criar página de gestão de instrutores
  - Criar página de aprovação de cursos
  - Criar página de gestão de assinaturas
  - Criar página de relatórios com gráficos
  - Criar página de exportação de relatórios
  - _Requisitos: 2.1, 2.2, 4.1, 4.2, 4.3, 6.1, 10.1, 10.2, 10.3, 10.5, 16.1, 16.2, 16.5_

- [ ] 15.6 Implementar componentes responsivos
  - Criar componente de menu responsivo (hamburguer em mobile)
  - Criar grid responsivo para lista de cursos
  - Otimizar formulários para touch
  - Testar em diferentes tamanhos de tela
  - _Requisitos: 16.1, 16.2, 16.5_

- [ ] 15.7 Implementar acessibilidade
  - Adicionar navegação por teclado
  - Adicionar labels descritivos em formulários
  - Garantir contraste adequado de cores
  - Adicionar textos alternativos em imagens
  - Adicionar ARIA labels em componentes interativos
  - _Requisitos: 16.3, 16.4_

- [ ] 15.8 Criar testes E2E do frontend
  - Testar fluxo completo de cadastro e login
  - Testar fluxo de assinatura
  - Testar fluxo de acesso a curso e conclusão de aula
  - Testar fluxo de criação de curso por instrutor
  - _Requisitos: 1.1, 5.1, 7.1, 7.2, 3.1_

- [ ] 16. Configurar deployment e CI/CD
  - _Requisitos: 15.2_

- [ ] 16.1 Criar Dockerfile para backend
  - Criar Dockerfile multi-stage para otimização
  - Configurar variáveis de ambiente
  - Expor porta da aplicação
  - _Requisitos: 15.2_

- [ ] 16.2 Criar Dockerfile para frontend
  - Criar Dockerfile para build de produção
  - Configurar nginx para servir arquivos estáticos
  - Configurar proxy reverso para API
  - _Requisitos: 15.2_

- [ ] 16.3 Criar docker-compose para produção
  - Configurar serviços: api, frontend, db, redis
  - Configurar volumes para persistência
  - Configurar networks
  - Configurar health checks
  - _Requisitos: 15.2_

- [ ] 16.4 Configurar pipeline CI/CD
  - Criar workflow de CI (build, lint, test)
  - Criar workflow de deploy para staging
  - Criar workflow de deploy para produção (com aprovação manual)
  - Configurar secrets e variáveis de ambiente
  - _Requisitos: 15.2_

- [ ] 16.5 Criar documentação de deployment
  - Documentar variáveis de ambiente necessárias
  - Documentar processo de deploy
  - Documentar processo de rollback
  - Documentar troubleshooting comum
  - _Requisitos: 15.2_

- [ ] 17. Integração final e testes
  - _Requisitos: Todos_

- [ ] 17.1 Realizar testes de integração completos
  - Testar todos os fluxos principais end-to-end
  - Validar integrações com serviços externos
  - Testar cenários de erro e recuperação
  - _Requisitos: Todos_

- [ ] 17.2 Realizar testes de carga
  - Simular 100 usuários simultâneos
  - Validar tempo de resposta < 2s em 95% dos casos
  - Identificar e corrigir gargalos de performance
  - _Requisitos: 15.1_

- [ ] 17.3 Realizar auditoria de segurança
  - Executar scan de vulnerabilidades (OWASP ZAP)
  - Validar todas as proteções implementadas
  - Corrigir vulnerabilidades encontradas
  - _Requisitos: 12.1, 12.2, 12.3_

- [ ] 17.4 Validar conformidade LGPD
  - Verificar consentimento explícito no cadastro
  - Testar endpoints de acesso e exclusão de dados
  - Validar anonimização de dados
  - _Requisitos: 14.1, 14.2, 14.3, 14.4_

- [ ] 17.5 Criar dados de seed para demonstração
  - Criar script de seed com usuários de exemplo
  - Criar cursos de exemplo com conteúdo
  - Criar assinaturas e progresso de exemplo
  - _Requisitos: Todos_

- [ ] 17.6 Criar documentação da API
  - Documentar todos os endpoints com Swagger/OpenAPI
  - Incluir exemplos de requisição e resposta
  - Documentar códigos de erro
  - Documentar autenticação e autorização
  - _Requisitos: Todos_

- [ ] 17.7 Criar guia do usuário
  - Documentar funcionalidades para cada perfil
  - Criar tutoriais com screenshots
  - Documentar perguntas frequentes (FAQ)
  - _Requisitos: Todos_
