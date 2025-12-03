# Plano de Implementação: Avaliações por Módulo

## Resumo das Mudanças

### Regras de Negócio Atualizadas

1. ✅ **Uma avaliação por módulo** (obrigatório)
2. ✅ **Total fixo de 10 pontos** por avaliação
3. ✅ **Pontos distribuídos automaticamente** entre as questões (10 / número de questões)
4. ✅ **Nota final** = média aritmética de todas as avaliações dos módulos
5. ✅ **Bloqueio de submissão**: curso não pode ser submetido se algum módulo não tiver avaliação
6. ✅ **Refazer avaliação**: aluno pode refazer quantas vezes quiser (última tentativa conta)
7. ✅ **Sem nota mínima individual**: apenas nota de corte final importa para certificado

---

## Fase 1: Migração do Banco de Dados

### 1.1 Alterações na Tabela `assessments`

**Mudanças:**
- ✅ Adicionar coluna `module_id` (UUID, FK para modules)
- ✅ Remover coluna `course_id` (avaliação agora pertence ao módulo)
- ✅ Adicionar constraint UNIQUE(module_id) - um módulo tem apenas uma avaliação
- ✅ Campo `passing_score` agora é do curso, não da avaliação individual

**Migration SQL:**
```sql
-- Adicionar module_id
ALTER TABLE assessments ADD COLUMN module_id UUID;
ALTER TABLE assessments ADD CONSTRAINT fk_assessments_module 
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;

-- Adicionar constraint de unicidade
ALTER TABLE assessments ADD CONSTRAINT unique_module_assessment 
  UNIQUE(module_id);

-- Remover course_id (após migrar dados)
ALTER TABLE assessments DROP COLUMN course_id;

-- Remover passing_score da avaliação (agora é do curso)
ALTER TABLE assessments DROP COLUMN passing_score;
```

### 1.2 Alterações na Tabela `questions`

**Mudanças:**
- ✅ Campo `points` já existe, mas agora será calculado automaticamente
- ✅ Pontos = 10 / número de questões da avaliação

**Nenhuma migration necessária** - apenas lógica de cálculo no backend

### 1.3 Alterações na Tabela `courses`

**Mudanças:**
- ✅ Adicionar coluna `passing_score` (DECIMAL) - nota de corte para certificado
- ✅ Valor padrão: 7.0 (70%)

**Migration SQL:**
```sql
ALTER TABLE courses ADD COLUMN passing_score DECIMAL(5,2) DEFAULT 7.0;
```

### 1.4 Alterações na Tabela `student_assessments`

**Mudanças:**
- ✅ Permitir múltiplas tentativas do mesmo aluno na mesma avaliação
- ✅ Adicionar coluna `attempt_number` (INTEGER) - número da tentativa
- ✅ Remover constraint UNIQUE(student_id, assessment_id)
- ✅ Adicionar coluna `is_latest` (BOOLEAN) - marca a última tentativa

**Migration SQL:**
```sql
-- Remover constraint de unicidade antiga
ALTER TABLE student_assessments DROP CONSTRAINT IF EXISTS unique_student_assessment;

-- Adicionar novas colunas
ALTER TABLE student_assessments ADD COLUMN attempt_number INTEGER DEFAULT 1;
ALTER TABLE student_assessments ADD COLUMN is_latest BOOLEAN DEFAULT true;

-- Criar índice para buscar última tentativa rapidamente
CREATE INDEX idx_student_assessments_latest 
  ON student_assessments(student_id, assessment_id, is_latest) 
  WHERE is_latest = true;
```

---

## Fase 2: Backend - Services

### 2.1 Assessment Service

**Arquivo:** `src/modules/assessments/services/assessment.service.ts`

**Mudanças:**

1. **Criar avaliação para módulo:**
```typescript
async createAssessmentForModule(moduleId: string, data: CreateAssessmentDto) {
  // Verificar se módulo já tem avaliação
  const existing = await this.findByModuleId(moduleId);
  if (existing) {
    throw new Error('Módulo já possui uma avaliação');
  }
  
  // Criar avaliação vinculada ao módulo
  const assessment = await this.assessmentRepository.create({
    moduleId,
    title: data.title,
    type: data.type
  });
  
  return assessment;
}
```

2. **Calcular pontos por questão automaticamente:**
```typescript
async recalculateQuestionPoints(assessmentId: string) {
  const questions = await this.questionRepository.findByAssessment(assessmentId);
  const totalQuestions = questions.length;
  
  if (totalQuestions === 0) return;
  
  const pointsPerQuestion = 10 / totalQuestions;
  
  // Atualizar pontos de todas as questões
  await Promise.all(
    questions.map(q => 
      this.questionRepository.update(q.id, { points: pointsPerQuestion })
    )
  );
}
```

3. **Adicionar/remover questão (recalcula pontos):**
```typescript
async addQuestion(assessmentId: string, data: CreateQuestionDto) {
  const question = await this.questionRepository.create({
    assessmentId,
    ...data
  });
  
  // Recalcular pontos de todas as questões
  await this.recalculateQuestionPoints(assessmentId);
  
  return question;
}

async deleteQuestion(questionId: string) {
  const question = await this.questionRepository.findById(questionId);
  await this.questionRepository.delete(questionId);
  
  // Recalcular pontos das questões restantes
  await this.recalculateQuestionPoints(question.assessmentId);
}
```

### 2.2 Student Assessment Service

**Arquivo:** `src/modules/assessments/services/student-assessment.service.ts`

**Mudanças:**

1. **Submeter avaliação (permitir múltiplas tentativas):**
```typescript
async submitAssessment(studentId: string, assessmentId: string, answers: Answer[]) {
  // Marcar tentativas anteriores como não sendo a última
  await this.studentAssessmentRepository.update(
    { studentId, assessmentId },
    { isLatest: false }
  );
  
  // Buscar questões com pontos
  const questions = await this.questionRepository.findByAssessment(assessmentId);
  
  // Calcular nota
  let score = 0;
  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.questionId);
    if (question && answer.answer === question.correctAnswer) {
      score += question.points;
    }
  }
  
  // Buscar número da tentativa
  const previousAttempts = await this.studentAssessmentRepository.count({
    studentId,
    assessmentId
  });
  
  // Criar nova submissão
  const submission = await this.studentAssessmentRepository.create({
    studentId,
    assessmentId,
    answers,
    score,
    attemptNumber: previousAttempts + 1,
    isLatest: true,
    status: 'graded',
    submittedAt: new Date(),
    gradedAt: new Date()
  });
  
  return submission;
}
```

2. **Buscar última tentativa:**
```typescript
async getLatestAttempt(studentId: string, assessmentId: string) {
  return await this.studentAssessmentRepository.findOne({
    studentId,
    assessmentId,
    isLatest: true
  });
}
```

3. **Calcular nota final do curso:**
```typescript
async calculateFinalGrade(studentId: string, courseId: string): Promise<number> {
  // Buscar todos os módulos do curso
  const modules = await this.moduleRepository.findByCourse(courseId);
  
  // Buscar avaliação de cada módulo
  const assessments = await Promise.all(
    modules.map(m => this.assessmentRepository.findByModuleId(m.id))
  );
  
  // Buscar última tentativa de cada avaliação
  const submissions = await Promise.all(
    assessments.map(a => this.getLatestAttempt(studentId, a.id))
  );
  
  // Verificar se completou todas as avaliações
  if (submissions.some(s => !s)) {
    return null; // Ainda não completou todas
  }
  
  // Calcular média
  const totalScore = submissions.reduce((sum, s) => sum + s.score, 0);
  const finalGrade = totalScore / submissions.length;
  
  return finalGrade;
}
```

### 2.3 Course Service

**Arquivo:** `src/modules/courses/services/course.service.ts`

**Mudanças:**

1. **Validar antes de submeter para aprovação:**
```typescript
async submitForApproval(courseId: string, instructorId: string) {
  const course = await this.findById(courseId);
  
  // Verificar se é o instrutor do curso
  if (course.instructorId !== instructorId) {
    throw new ForbiddenException('Você não é o instrutor deste curso');
  }
  
  // Verificar se tem pelo menos 1 módulo
  const modules = await this.moduleRepository.findByCourse(courseId);
  if (modules.length === 0) {
    throw new BadRequestException('Curso deve ter pelo menos 1 módulo');
  }
  
  // Verificar se cada módulo tem pelo menos 1 aula
  for (const module of modules) {
    const lessons = await this.lessonRepository.findByModule(module.id);
    if (lessons.length === 0) {
      throw new BadRequestException(`Módulo "${module.title}" não possui aulas`);
    }
  }
  
  // ✅ NOVO: Verificar se cada módulo tem avaliação
  for (const module of modules) {
    const assessment = await this.assessmentRepository.findByModuleId(module.id);
    if (!assessment) {
      throw new BadRequestException(`Módulo "${module.title}" não possui avaliação`);
    }
    
    // Verificar se avaliação tem pelo menos 1 questão
    const questions = await this.questionRepository.findByAssessment(assessment.id);
    if (questions.length === 0) {
      throw new BadRequestException(`Avaliação do módulo "${module.title}" não possui questões`);
    }
  }
  
  // Atualizar status
  await this.courseRepository.update(courseId, {
    status: 'pending_approval'
  });
  
  // Notificar admin
  await this.notificationService.notifyCourseSubmitted(course);
  
  return course;
}
```

### 2.4 Certificate Service

**Arquivo:** `src/modules/certificates/services/certificate.service.ts`

**Mudanças:**

1. **Verificar elegibilidade para certificado:**
```typescript
async checkEligibility(studentId: string, courseId: string): Promise<{
  eligible: boolean;
  finalGrade: number;
  passingScore: number;
  completedLessons: boolean;
  completedAssessments: boolean;
}> {
  const course = await this.courseRepository.findById(courseId);
  
  // Verificar se completou todas as aulas
  const progress = await this.progressService.getProgress(studentId, courseId);
  const completedLessons = progress.progressPercentage === 100;
  
  // Calcular nota final
  const finalGrade = await this.studentAssessmentService.calculateFinalGrade(
    studentId,
    courseId
  );
  
  const completedAssessments = finalGrade !== null;
  const eligible = completedLessons && 
                   completedAssessments && 
                   finalGrade >= course.passingScore;
  
  return {
    eligible,
    finalGrade,
    passingScore: course.passingScore,
    completedLessons,
    completedAssessments
  };
}
```

2. **Emitir certificado:**
```typescript
async issueCertificate(studentId: string, courseId: string) {
  // Verificar elegibilidade
  const eligibility = await this.checkEligibility(studentId, courseId);
  
  if (!eligibility.eligible) {
    throw new BadRequestException('Aluno não está apto a receber certificado');
  }
  
  // Verificar se já existe certificado
  const existing = await this.certificateRepository.findOne({
    studentId,
    courseId
  });
  
  if (existing) {
    return existing;
  }
  
  // Gerar certificado
  const certificate = await this.certificateRepository.create({
    studentId,
    courseId,
    finalGrade: eligibility.finalGrade,
    verificationCode: uuidv4(),
    issuedAt: new Date()
  });
  
  // Gerar PDF
  const pdfUrl = await this.pdfGenerator.generateCertificate(certificate);
  await this.certificateRepository.update(certificate.id, { pdfUrl });
  
  // Enviar email
  await this.notificationService.notifyCertificateIssued(certificate);
  
  return certificate;
}
```

---

## Fase 3: Backend - Controllers e Rotas

### 3.1 Assessment Controller

**Mudanças:**

```typescript
// Criar avaliação para módulo
@Post('/modules/:moduleId/assessments')
@UseGuards(AuthGuard, RoleGuard(['instructor']))
async createForModule(
  @Param('moduleId') moduleId: string,
  @Body() data: CreateAssessmentDto
) {
  return await this.assessmentService.createAssessmentForModule(moduleId, data);
}

// Buscar avaliação de um módulo
@Get('/modules/:moduleId/assessment')
async getByModule(@Param('moduleId') moduleId: string) {
  return await this.assessmentService.findByModuleId(moduleId);
}
```

### 3.2 Student Assessment Controller

**Mudanças:**

```typescript
// Submeter avaliação (permite refazer)
@Post('/assessments/:assessmentId/submit')
@UseGuards(AuthGuard, RoleGuard(['student']))
async submit(
  @Param('assessmentId') assessmentId: string,
  @Body() data: SubmitAssessmentDto,
  @Request() req
) {
  return await this.studentAssessmentService.submitAssessment(
    req.user.id,
    assessmentId,
    data.answers
  );
}

// Buscar histórico de tentativas
@Get('/assessments/:assessmentId/attempts')
@UseGuards(AuthGuard, RoleGuard(['student']))
async getAttempts(
  @Param('assessmentId') assessmentId: string,
  @Request() req
) {
  return await this.studentAssessmentService.getAttempts(
    req.user.id,
    assessmentId
  );
}

// Buscar nota final do curso
@Get('/courses/:courseId/final-grade')
@UseGuards(AuthGuard, RoleGuard(['student']))
async getFinalGrade(
  @Param('courseId') courseId: string,
  @Request() req
) {
  const finalGrade = await this.studentAssessmentService.calculateFinalGrade(
    req.user.id,
    courseId
  );
  
  return { finalGrade };
}
```

---

## Fase 4: Frontend

### 4.1 Página de Gerenciamento de Módulos

**Arquivo:** `frontend/src/pages/instructor/ModulesManagementPage.tsx`

**Mudanças:**
- Mostrar se módulo tem avaliação
- Botão "Criar Avaliação" se não tiver
- Botão "Editar Avaliação" se já tiver
- Indicador visual de módulos sem avaliação

### 4.2 Formulário de Avaliação

**Arquivo:** `frontend/src/pages/instructor/AssessmentFormPage.tsx`

**Mudanças:**
- Remover seleção de curso (avaliação é do módulo)
- Mostrar módulo associado
- Mostrar "Total: 10 pontos" fixo
- Mostrar pontos por questão calculados automaticamente
- Atualizar pontos ao adicionar/remover questões

### 4.3 Página de Fazer Avaliação (Aluno)

**Arquivo:** `frontend/src/pages/student/TakeAssessmentPage.tsx`

**Mudanças:**
- Mostrar pontos de cada questão
- Mostrar total de pontos (10)
- Após submeter, mostrar:
  - Nota obtida
  - Número da tentativa
  - Botão "Refazer Avaliação"
  - Histórico de tentativas anteriores

### 4.4 Dashboard de Progresso do Aluno

**Arquivo:** `frontend/src/pages/student/ProgressPage.tsx`

**Mudanças:**
- Mostrar notas de cada avaliação por módulo
- Mostrar nota final do curso (média)
- Mostrar nota de corte necessária
- Indicador visual se está apto ao certificado
- Mostrar quais avaliações ainda faltam fazer

### 4.5 Validação de Submissão de Curso

**Arquivo:** `frontend/src/pages/instructor/CourseFormPage.tsx`

**Mudanças:**
- Antes de submeter, validar se todos os módulos têm avaliação
- Mostrar mensagem de erro específica indicando quais módulos faltam avaliação
- Desabilitar botão "Submeter para Aprovação" se validação falhar

---

## Fase 5: Testes

### 5.1 Testes Backend

```javascript
// test-module-assessments.js

// 1. Criar avaliação para módulo
// 2. Tentar criar segunda avaliação (deve falhar)
// 3. Adicionar questões e verificar cálculo de pontos
// 4. Remover questão e verificar recálculo
// 5. Aluno submeter avaliação
// 6. Aluno refazer avaliação
// 7. Verificar que última tentativa é considerada
// 8. Calcular nota final do curso
// 9. Verificar elegibilidade para certificado
// 10. Tentar submeter curso sem avaliação em módulo (deve falhar)
```

### 5.2 Testes Frontend

```javascript
// test-frontend-module-assessments.js

// 1. Instrutor criar avaliação para módulo
// 2. Verificar cálculo automático de pontos
// 3. Adicionar/remover questões e ver pontos atualizarem
// 4. Tentar submeter curso sem avaliação (deve mostrar erro)
// 5. Aluno fazer avaliação
// 6. Aluno refazer avaliação
// 7. Ver histórico de tentativas
// 8. Ver nota final do curso
// 9. Ver elegibilidade para certificado
```

---

## Checklist de Implementação

### Backend
- [ ] Criar migration para adicionar `module_id` em assessments
- [ ] Criar migration para remover `course_id` de assessments
- [ ] Criar migration para adicionar `passing_score` em courses
- [ ] Criar migration para permitir múltiplas tentativas em student_assessments
- [ ] Atualizar AssessmentService com novos métodos
- [ ] Atualizar StudentAssessmentService para múltiplas tentativas
- [ ] Atualizar CourseService para validar avaliações antes de submeter
- [ ] Atualizar CertificateService para usar nota final
- [ ] Atualizar rotas e controllers
- [ ] Criar testes unitários
- [ ] Criar testes de integração

### Frontend
- [ ] Atualizar página de gerenciamento de módulos
- [ ] Atualizar formulário de criação de avaliação
- [ ] Atualizar página de fazer avaliação (aluno)
- [ ] Adicionar histórico de tentativas
- [ ] Atualizar dashboard de progresso
- [ ] Atualizar validação de submissão de curso
- [ ] Criar testes E2E

### Documentação
- [ ] Atualizar documentação da API
- [ ] Atualizar guia do usuário
- [ ] Criar exemplos de uso

---

## Próximos Passos

1. ✅ Revisar este plano com você
2. ⏳ Criar migrations do banco de dados
3. ⏳ Implementar mudanças no backend
4. ⏳ Implementar mudanças no frontend
5. ⏳ Testar tudo
6. ⏳ Documentar

**Você aprova este plano? Posso começar a implementação?**
