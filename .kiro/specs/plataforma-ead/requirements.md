# Documento de Requisitos - Plataforma EAD

## Introdução

A Plataforma EAD é um sistema de ensino a distância que oferece cursos online sob modelo de assinatura mensal. O sistema permite que administradores gerenciem instrutores, instrutores criem e publiquem cursos, e alunos acessem múltiplos cursos mediante assinatura ativa. A plataforma inclui gestão de conteúdo educacional, controle de acesso baseado em pagamento, acompanhamento de progresso e emissão automática de certificados.

## Glossário

- **Sistema**: A Plataforma EAD completa, incluindo todos os módulos e funcionalidades
- **Administrador**: Usuário com controle total da plataforma, responsável por gerenciar instrutores, cursos, alunos e configurações
- **Instrutor**: Usuário autorizado pelo Administrador a criar e gerenciar cursos na plataforma
- **Aluno**: Usuário assinante que tem acesso aos cursos disponíveis na plataforma
- **Curso**: Conteúdo educacional estruturado composto por módulos e aulas
- **Módulo**: Agrupamento lógico de aulas dentro de um curso
- **Aula**: Unidade de conteúdo educacional (vídeo, PDF, texto ou link externo)
- **Assinatura**: Plano mensal pago que concede acesso aos cursos da plataforma
- **Gateway de Pagamento**: Sistema externo integrado para processar pagamentos
- **Certificado**: Documento digital emitido após conclusão de curso com aprovação mínima
- **Progresso**: Percentual de conclusão de um curso pelo aluno
- **Avaliação**: Teste aplicado ao aluno (múltipla escolha ou dissertativa)
- **Dashboard**: Interface administrativa com relatórios e indicadores

## Requisitos

### Requisito 1: Autenticação e Cadastro de Usuários

**User Story:** Como um usuário da plataforma, eu quero realizar login e cadastro no sistema, para que eu possa acessar as funcionalidades disponíveis para meu perfil.

#### Acceptance Criteria

1. O Sistema DEVE permitir que um usuário realize cadastro fornecendo nome, e-mail e senha
2. O Sistema DEVE validar o formato do e-mail antes de aceitar o cadastro
3. QUANDO um usuário fornece credenciais válidas, O Sistema DEVE autenticar o usuário e conceder acesso
4. O Sistema DEVE registrar a data e hora do último acesso de cada usuário
5. QUANDO um usuário solicita redefinição de senha, O Sistema DEVE enviar um link de redefinição para o e-mail cadastrado

### Requisito 2: Gestão de Instrutores pelo Administrador

**User Story:** Como um Administrador, eu quero criar e gerenciar perfis de instrutores, para que apenas usuários autorizados possam publicar cursos na plataforma.

#### Acceptance Criteria

1. O Sistema DEVE permitir que apenas o Administrador crie novos perfis de Instrutor
2. QUANDO o Administrador cria um perfil de Instrutor, O Sistema DEVE solicitar nome, e-mail e gerar credenciais de acesso
3. QUANDO um perfil de Instrutor é criado, O Sistema DEVE enviar notificação por e-mail ao Instrutor com as credenciais
4. O Sistema DEVE permitir que o Administrador suspenda temporariamente um Instrutor
5. ENQUANTO um Instrutor está suspenso, O Sistema DEVE bloquear o acesso deste Instrutor à plataforma

### Requisito 3: Criação e Estruturação de Cursos

**User Story:** Como um Instrutor, eu quero criar cursos com módulos e aulas, para que eu possa disponibilizar conteúdo educacional aos alunos.

#### Acceptance Criteria

1. O Sistema DEVE permitir que o Instrutor crie um curso informando título, descrição, imagem de capa, carga horária e categoria
2. O Sistema DEVE exigir que cada curso contenha no mínimo um módulo
3. O Sistema DEVE exigir que cada módulo contenha no mínimo uma aula
4. O Sistema DEVE permitir que o Instrutor adicione aulas nos formatos vídeo, PDF, texto ou link externo
5. O Sistema DEVE permitir que o Instrutor crie avaliações do tipo múltipla escolha ou dissertativa

### Requisito 4: Aprovação e Publicação de Cursos

**User Story:** Como um Administrador, eu quero revisar e aprovar cursos antes da publicação, para que apenas conteúdo adequado seja disponibilizado aos alunos.

#### Acceptance Criteria

1. QUANDO um Instrutor finaliza a criação de um curso, O Sistema DEVE enviar o curso para revisão do Administrador
2. O Sistema DEVE impedir que um curso seja acessível aos Alunos antes da aprovação do Administrador
3. QUANDO o Administrador aprova um curso, O Sistema DEVE publicar o curso e torná-lo acessível aos Alunos com assinatura ativa
4. O Sistema DEVE manter um histórico de versões de cada curso
5. O Sistema DEVE permitir que o Administrador rejeite um curso e solicite alterações ao Instrutor

### Requisito 5: Gestão de Assinaturas

**User Story:** Como um Aluno, eu quero assinar a plataforma mensalmente, para que eu possa acessar todos os cursos disponíveis.

#### Acceptance Criteria

1. O Sistema DEVE permitir que o Aluno realize assinatura mensal através do Gateway de Pagamento
2. QUANDO o pagamento da assinatura é confirmado, O Sistema DEVE conceder acesso imediato aos cursos
3. QUANDO uma assinatura não é renovada na data de vencimento, O Sistema DEVE suspender automaticamente o acesso do Aluno aos cursos
4. O Sistema DEVE permitir que o Aluno cancele sua assinatura a qualquer momento
5. O Sistema DEVE permitir que o Aluno reative uma assinatura cancelada através de novo pagamento

### Requisito 6: Visualização de Status de Assinaturas

**User Story:** Como um Administrador, eu quero visualizar o status das assinaturas, para que eu possa monitorar a base de assinantes da plataforma.

#### Acceptance Criteria

1. O Sistema DEVE exibir para o Administrador uma lista de todas as assinaturas com status (ativa, suspensa, cancelada)
2. O Sistema DEVE exibir a data de vencimento de cada assinatura ativa
3. O Sistema DEVE permitir que o Administrador filtre assinaturas por status
4. O Sistema DEVE exibir o histórico de pagamentos de cada Aluno
5. O Sistema DEVE calcular e exibir a taxa de retenção mensal de assinantes

### Requisito 7: Acesso e Progresso em Cursos

**User Story:** Como um Aluno, eu quero acessar cursos e ter meu progresso registrado, para que eu possa continuar de onde parei.

#### Acceptance Criteria

1. ENQUANTO a assinatura do Aluno está ativa, O Sistema DEVE permitir acesso a todos os cursos publicados
2. QUANDO um Aluno visualiza uma aula, O Sistema DEVE registrar o progresso automaticamente
3. O Sistema DEVE calcular e exibir o percentual de conclusão de cada curso para o Aluno
4. O Sistema DEVE permitir que o Aluno favorite cursos para acesso rápido
5. QUANDO um novo curso é publicado, O Sistema DEVE notificar todos os Alunos com assinatura ativa

### Requisito 8: Emissão de Certificados

**User Story:** Como um Aluno, eu quero receber um certificado após concluir um curso, para que eu possa comprovar minha qualificação.

#### Acceptance Criteria

1. QUANDO um Aluno conclui 100% das aulas de um curso E obtém nota mínima na avaliação final, O Sistema DEVE gerar automaticamente um certificado
2. O Sistema DEVE incluir no certificado: nome do Aluno, nome do curso, carga horária, data de conclusão, assinatura digital e código único de verificação
3. QUANDO um certificado é gerado, O Sistema DEVE enviar notificação por e-mail ao Aluno com link para download
4. O Sistema DEVE gerar um link público para cada certificado que permita validação por terceiros
5. QUANDO um terceiro acessa o link de validação com o código único, O Sistema DEVE exibir os dados do certificado

### Requisito 9: Acompanhamento de Progresso pelo Instrutor

**User Story:** Como um Instrutor, eu quero visualizar o progresso dos alunos nos meus cursos, para que eu possa acompanhar o desempenho e engajamento.

#### Acceptance Criteria

1. O Sistema DEVE exibir para o Instrutor uma lista de Alunos matriculados em cada curso que ele ministra
2. O Sistema DEVE exibir o percentual de progresso de cada Aluno em cada curso
3. O Sistema DEVE permitir que o Instrutor visualize as respostas das avaliações dissertativas
4. O Sistema DEVE permitir que o Instrutor corrija e atribua notas às avaliações dissertativas
5. O Sistema DEVE calcular automaticamente a nota final considerando todas as avaliações do curso

### Requisito 10: Relatórios Administrativos

**User Story:** Como um Administrador, eu quero visualizar relatórios de desempenho e financeiros, para que eu possa tomar decisões estratégicas sobre a plataforma.

#### Acceptance Criteria

1. O Sistema DEVE exibir no Dashboard administrativo o número total de assinantes ativos
2. O Sistema DEVE exibir no Dashboard administrativo o número de cursos concluídos no período
3. O Sistema DEVE calcular e exibir a taxa de retenção mensal de assinantes
4. O Sistema DEVE gerar relatórios financeiros integrados com os dados do Gateway de Pagamento
5. O Sistema DEVE permitir que o Administrador exporte relatórios nos formatos CSV ou PDF

### Requisito 11: Histórico de Cursos do Aluno

**User Story:** Como um Aluno, eu quero visualizar meu histórico de cursos, para que eu possa acompanhar minha jornada de aprendizado.

#### Acceptance Criteria

1. O Sistema DEVE exibir para o Aluno uma lista de cursos iniciados com status (em andamento, concluído)
2. O Sistema DEVE exibir a data de início de cada curso
3. QUANDO um curso é concluído, O Sistema DEVE exibir a data de conclusão e a nota final obtida
4. O Sistema DEVE permitir que o Aluno acesse os certificados de cursos concluídos através do histórico
5. O Sistema DEVE exibir o tempo total de estudo acumulado pelo Aluno na plataforma

### Requisito 12: Segurança e Criptografia

**User Story:** Como um usuário da plataforma, eu quero que meus dados sejam transmitidos de forma segura, para que minhas informações pessoais estejam protegidas.

#### Acceptance Criteria

1. O Sistema DEVE criptografar todo o tráfego de dados utilizando protocolo HTTPS
2. O Sistema DEVE armazenar senhas utilizando algoritmo de hash seguro (bcrypt ou similar)
3. O Sistema DEVE implementar proteção contra ataques de força bruta limitando tentativas de login
4. O Sistema DEVE expirar sessões de usuário após período de inatividade de 30 minutos
5. O Sistema DEVE registrar logs de acesso para auditoria de segurança

### Requisito 13: Armazenamento e Backup

**User Story:** Como um Administrador, eu quero que os dados da plataforma sejam armazenados de forma segura com backups regulares, para que não haja perda de informações.

#### Acceptance Criteria

1. O Sistema DEVE armazenar arquivos de vídeo em serviço de armazenamento em nuvem (AWS S3, Cloudflare R2 ou similar)
2. O Sistema DEVE realizar backups automáticos diários de todos os dados
3. O Sistema DEVE manter retenção mínima de 30 dias para backups
4. O Sistema DEVE permitir que o Administrador restaure dados a partir de backups
5. O Sistema DEVE notificar o Administrador em caso de falha no processo de backup

### Requisito 14: Conformidade com LGPD

**User Story:** Como um usuário da plataforma, eu quero ter controle sobre meus dados pessoais, para que minha privacidade seja respeitada conforme a legislação.

#### Acceptance Criteria

1. QUANDO um usuário realiza cadastro, O Sistema DEVE solicitar consentimento explícito para tratamento de dados pessoais
2. O Sistema DEVE permitir que o usuário visualize quais dados pessoais estão armazenados
3. O Sistema DEVE permitir que o usuário solicite exclusão de seus dados pessoais
4. QUANDO um usuário solicita exclusão de dados, O Sistema DEVE processar a solicitação em até 15 dias
5. O Sistema DEVE manter registro de consentimentos e solicitações de exclusão para fins de auditoria

### Requisito 15: Desempenho e Disponibilidade

**User Story:** Como um usuário da plataforma, eu quero que o sistema responda rapidamente às minhas ações, para que eu tenha uma experiência fluida.

#### Acceptance Criteria

1. O Sistema DEVE responder a requisições em até 2 segundos em 95% dos casos
2. O Sistema DEVE manter disponibilidade mínima de 99,5% ao longo do mês
3. QUANDO o Sistema detecta lentidão acima do limite, O Sistema DEVE registrar logs para análise
4. O Sistema DEVE suportar crescimento modular de cursos e usuários sem degradação de desempenho
5. O Sistema DEVE implementar cache para conteúdos estáticos visando otimização de carregamento

### Requisito 16: Usabilidade e Responsividade

**User Story:** Como um usuário da plataforma, eu quero acessar o sistema de qualquer dispositivo, para que eu possa estudar onde e quando for conveniente.

#### Acceptance Criteria

1. O Sistema DEVE apresentar interface responsiva que se adapta a dispositivos móveis, tablets e desktops
2. O Sistema DEVE seguir boas práticas de UX com navegação intuitiva
3. O Sistema DEVE garantir que vídeos sejam reproduzíveis em dispositivos móveis
4. O Sistema DEVE permitir que o Aluno baixe materiais em PDF para acesso offline
5. O Sistema DEVE manter consistência visual em todos os dispositivos
