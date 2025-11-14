import { config } from '@config/env';

/**
 * Base email template with consistent styling
 */
const getBaseTemplate = (content: string): string => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #4F46E5;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: bold;
    }
    .button:hover {
      background-color: #4338CA;
    }
    .info-box {
      background-color: #f3f4f6;
      border-left: 4px solid #4F46E5;
      padding: 15px;
      margin: 20px 0;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
    }
    .success-box {
      background-color: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 20px 0;
    }
    .credentials-box {
      background-color: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .credential-item {
      margin: 10px 0;
    }
    .credential-label {
      font-weight: bold;
      color: #6b7280;
      font-size: 14px;
    }
    .credential-value {
      font-family: monospace;
      background-color: #f3f4f6;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 5px;
      font-size: 16px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${content}
    <div class="footer">
      <p>Este é um e-mail automático, por favor não responda.</p>
      <p>&copy; ${new Date().getFullYear()} Plataforma EAD. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Welcome email template for new students
 */
export const getWelcomeTemplate = (data: { name: string; loginUrl: string }): string => {
  const content = `
    <div class="header">
      <h1>Bem-vindo à Plataforma EAD! 🎓</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.name}</strong>,</p>
      
      <p>É com grande alegria que damos as boas-vindas à Plataforma EAD! Você acaba de dar um passo importante na sua jornada de aprendizado.</p>
      
      <div class="success-box">
        <strong>✅ Cadastro realizado com sucesso!</strong>
        <p style="margin: 5px 0 0 0;">Sua conta foi criada e você já pode começar a explorar nossos cursos.</p>
      </div>
      
      <p>Para começar, clique no botão abaixo e faça login na plataforma:</p>
      
      <center>
        <a href="${data.loginUrl}" class="button">Acessar Plataforma</a>
      </center>
      
      <p><strong>O que você pode fazer na plataforma:</strong></p>
      <ul>
        <li>Explorar nosso catálogo de cursos</li>
        <li>Assinar e ter acesso ilimitado a todos os cursos</li>
        <li>Acompanhar seu progresso de aprendizado</li>
        <li>Realizar avaliações e obter certificados</li>
        <li>Estudar no seu próprio ritmo</li>
      </ul>
      
      <p>Se você tiver alguma dúvida ou precisar de ajuda, nossa equipe está sempre disponível para auxiliá-lo.</p>
      
      <p>Bons estudos!</p>
      
      <p><strong>Equipe Plataforma EAD</strong></p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

/**
 * Instructor credentials email template
 */
export const getInstructorCredentialsTemplate = (data: {
  name: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}): string => {
  const content = `
    <div class="header">
      <h1>Bem-vindo como Instrutor! 👨‍🏫</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.name}</strong>,</p>
      
      <p>Você foi cadastrado como instrutor na Plataforma EAD! Estamos muito felizes em tê-lo conosco.</p>
      
      <p>Abaixo estão suas credenciais de acesso:</p>
      
      <div class="credentials-box">
        <div class="credential-item">
          <div class="credential-label">E-mail:</div>
          <div class="credential-value">${data.email}</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">Senha Temporária:</div>
          <div class="credential-value">${data.temporaryPassword}</div>
        </div>
      </div>
      
      <div class="warning-box">
        <strong>⚠️ Importante:</strong> Por questões de segurança, recomendamos que você altere sua senha no primeiro acesso.
      </div>
      
      <center>
        <a href="${data.loginUrl}" class="button">Acessar Plataforma</a>
      </center>
      
      <p><strong>Como instrutor, você poderá:</strong></p>
      <ul>
        <li>Criar e gerenciar seus cursos</li>
        <li>Adicionar módulos e aulas (vídeos, PDFs, textos)</li>
        <li>Criar avaliações para seus alunos</li>
        <li>Acompanhar o progresso dos estudantes</li>
        <li>Corrigir avaliações dissertativas</li>
      </ul>
      
      <p>Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.</p>
      
      <p>Bons cursos!</p>
      
      <p><strong>Equipe Plataforma EAD</strong></p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

/**
 * Course submitted for approval email template
 */
export const getCourseSubmittedTemplate = (data: {
  instructorName: string;
  courseTitle: string;
  reviewUrl: string;
}): string => {
  const content = `
    <div class="header">
      <h1>Curso Enviado para Aprovação 📝</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.instructorName}</strong>,</p>
      
      <p>Seu curso foi enviado para aprovação com sucesso!</p>
      
      <div class="info-box">
        <strong>Curso:</strong> ${data.courseTitle}
      </div>
      
      <p>Nossa equipe irá revisar o conteúdo e você receberá uma notificação assim que o curso for aprovado ou se houver necessidade de ajustes.</p>
      
      <p><strong>O que acontece agora:</strong></p>
      <ul>
        <li>Nossa equipe revisará o conteúdo do curso</li>
        <li>Verificaremos a qualidade dos materiais</li>
        <li>Você receberá feedback em até 48 horas</li>
      </ul>
      
      <p>Obrigado por contribuir com conteúdo de qualidade para nossa plataforma!</p>
      
      <p><strong>Equipe Plataforma EAD</strong></p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

/**
 * Course approved email template
 */
export const getCourseApprovedTemplate = (data: {
  instructorName: string;
  courseTitle: string;
  courseUrl: string;
}): string => {
  const content = `
    <div class="header">
      <h1>Curso Aprovado! 🎉</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.instructorName}</strong>,</p>
      
      <p>Temos ótimas notícias! Seu curso foi aprovado e já está disponível para os alunos.</p>
      
      <div class="success-box">
        <strong>✅ Curso Publicado:</strong> ${data.courseTitle}
      </div>
      
      <p>Parabéns! Seu curso agora faz parte do nosso catálogo e está acessível para todos os alunos com assinatura ativa.</p>
      
      <center>
        <a href="${data.courseUrl}" class="button">Ver Curso Publicado</a>
      </center>
      
      <p><strong>Próximos passos:</strong></p>
      <ul>
        <li>Acompanhe as matrículas no seu dashboard</li>
        <li>Monitore o progresso dos alunos</li>
        <li>Responda às dúvidas nas avaliações</li>
        <li>Continue criando conteúdo de qualidade</li>
      </ul>
      
      <p>Obrigado por compartilhar seu conhecimento!</p>
      
      <p><strong>Equipe Plataforma EAD</strong></p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

/**
 * Course rejected email template
 */
export const getCourseRejectedTemplate = (data: {
  instructorName: string;
  courseTitle: string;
  reason: string;
  editUrl: string;
}): string => {
  const content = `
    <div class="header">
      <h1>Curso Necessita Ajustes 📋</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.instructorName}</strong>,</p>
      
      <p>Revisamos seu curso e identificamos alguns pontos que precisam de ajustes antes da publicação.</p>
      
      <div class="info-box">
        <strong>Curso:</strong> ${data.courseTitle}
      </div>
      
      <div class="warning-box">
        <strong>Motivo:</strong>
        <p style="margin: 10px 0 0 0;">${data.reason}</p>
      </div>
      
      <p>Por favor, faça as correções necessárias e envie o curso novamente para aprovação.</p>
      
      <center>
        <a href="${data.editUrl}" class="button">Editar Curso</a>
      </center>
      
      <p>Se você tiver dúvidas sobre os ajustes necessários, entre em contato conosco.</p>
      
      <p><strong>Equipe Plataforma EAD</strong></p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

/**
 * New course published notification for students
 */
export const getNewCoursePublishedTemplate = (data: {
  studentName: string;
  courseTitle: string;
  courseDescription: string;
  instructorName: string;
  courseUrl: string;
}): string => {
  const content = `
    <div class="header">
      <h1>Novo Curso Disponível! 🚀</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.studentName}</strong>,</p>
      
      <p>Temos um novo curso disponível na plataforma que pode interessar você!</p>
      
      <div class="info-box">
        <strong style="font-size: 18px;">${data.courseTitle}</strong>
        <p style="margin: 10px 0 5px 0;">${data.courseDescription}</p>
        <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>Instrutor:</strong> ${data.instructorName}</p>
      </div>
      
      <p>Como assinante da plataforma, você já tem acesso completo a este curso!</p>
      
      <center>
        <a href="${data.courseUrl}" class="button">Começar Curso Agora</a>
      </center>
      
      <p>Não perca a oportunidade de expandir seus conhecimentos com este novo conteúdo.</p>
      
      <p>Bons estudos!</p>
      
      <p><strong>Equipe Plataforma EAD</strong></p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

/**
 * Subscription confirmed email template
 */
export const getSubscriptionConfirmedTemplate = (data: {
  studentName: string;
  planName: string;
  amount: number;
  expiresAt: string;
  dashboardUrl: string;
}): string => {
  const content = `
    <div class="header">
      <h1>Assinatura Confirmada! 🎉</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.studentName}</strong>,</p>
      
      <p>Sua assinatura foi confirmada com sucesso! Agora você tem acesso ilimitado a todos os cursos da plataforma.</p>
      
      <div class="success-box">
        <strong>Detalhes da Assinatura:</strong>
        <p style="margin: 10px 0 0 0;">
          <strong>Plano:</strong> ${data.planName}<br>
          <strong>Valor:</strong> R$ ${data.amount.toFixed(2)}<br>
          <strong>Válido até:</strong> ${data.expiresAt}
        </p>
      </div>
      
      <center>
        <a href="${data.dashboardUrl}" class="button">Explorar Cursos</a>
      </center>
      
      <p><strong>Aproveite sua assinatura:</strong></p>
      <ul>
        <li>Acesso ilimitado a todos os cursos</li>
        <li>Novos cursos adicionados regularmente</li>
        <li>Certificados ao concluir os cursos</li>
        <li>Estude no seu próprio ritmo</li>
      </ul>
      
      <p>Sua assinatura será renovada automaticamente. Você pode cancelar a qualquer momento.</p>
      
      <p>Bons estudos!</p>
      
      <p><strong>Equipe Plataforma EAD</strong></p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

/**
 * Subscription expiring soon email template
 */
export const getSubscriptionExpiringSoonTemplate = (data: {
  studentName: string;
  expiresAt: string;
  renewUrl: string;
}): string => {
  const content = `
    <div class="header">
      <h1>Sua Assinatura Está Expirando ⏰</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.studentName}</strong>,</p>
      
      <p>Sua assinatura da Plataforma EAD está próxima do vencimento.</p>
      
      <div class="warning-box">
        <strong>⚠️ Atenção:</strong>
        <p style="margin: 10px 0 0 0;">Sua assinatura expira em: <strong>${data.expiresAt}</strong></p>
      </div>
      
      <p>Para continuar tendo acesso ilimitado a todos os cursos, certifique-se de que sua forma de pagamento está atualizada.</p>
      
      <center>
        <a href="${data.renewUrl}" class="button">Renovar Assinatura</a>
      </center>
      
      <p><strong>O que acontece se a assinatura expirar:</strong></p>
      <ul>
        <li>Você perderá o acesso aos cursos</li>
        <li>Seu progresso será mantido</li>
        <li>Você pode reativar a qualquer momento</li>
      </ul>
      
      <p>Não perca o acesso ao seu aprendizado!</p>
      
      <p><strong>Equipe Plataforma EAD</strong></p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

/**
 * Subscription suspended email template
 */
export const getSubscriptionSuspendedTemplate = (data: {
  studentName: string;
  reason: string;
  reactivateUrl: string;
}): string => {
  const content = `
    <div class="header">
      <h1>Assinatura Suspensa 🔒</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.studentName}</strong>,</p>
      
      <p>Sua assinatura da Plataforma EAD foi suspensa.</p>
      
      <div class="warning-box">
        <strong>Motivo:</strong>
        <p style="margin: 10px 0 0 0;">${data.reason}</p>
      </div>
      
      <p>Enquanto sua assinatura estiver suspensa, você não terá acesso aos cursos. No entanto, todo o seu progresso foi salvo.</p>
      
      <center>
        <a href="${data.reactivateUrl}" class="button">Reativar Assinatura</a>
      </center>
      
      <p><strong>Para reativar sua assinatura:</strong></p>
      <ul>
        <li>Clique no botão acima</li>
        <li>Atualize sua forma de pagamento</li>
        <li>Confirme a renovação</li>
      </ul>
      
      <p>Estamos aqui para ajudar se você tiver alguma dúvida.</p>
      
      <p><strong>Equipe Plataforma EAD</strong></p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

/**
 * Certificate issued email template
 */
export const getCertificateIssuedTemplate = (data: {
  studentName: string;
  courseTitle: string;
  certificateUrl: string;
  verificationCode: string;
}): string => {
  const content = `
    <div class="header">
      <h1>Certificado Emitido! 🏆</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.studentName}</strong>,</p>
      
      <p>Parabéns! Você concluiu o curso com sucesso e seu certificado está pronto!</p>
      
      <div class="success-box">
        <strong>✅ Curso Concluído:</strong> ${data.courseTitle}
      </div>
      
      <p>Seu certificado digital foi gerado e está disponível para download.</p>
      
      <center>
        <a href="${data.certificateUrl}" class="button">Baixar Certificado</a>
      </center>
      
      <div class="info-box">
        <strong>Código de Verificação:</strong>
        <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 16px;">${data.verificationCode}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Use este código para validar seu certificado em ${config.apiUrl}/public/certificates/verify/${data.verificationCode}</p>
      </div>
      
      <p><strong>Sobre seu certificado:</strong></p>
      <ul>
        <li>Documento digital com validade legal</li>
        <li>Código único de verificação</li>
        <li>QR Code para validação rápida</li>
        <li>Pode ser compartilhado em redes profissionais</li>
      </ul>
      
      <p>Continue aprendendo e conquistando novos certificados!</p>
      
      <p><strong>Equipe Plataforma EAD</strong></p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

/**
 * Password reset email template
 */
export const getPasswordResetTemplate = (data: {
  name: string;
  resetUrl: string;
  expiresIn: string;
}): string => {
  const content = `
    <div class="header">
      <h1>Redefinição de Senha 🔑</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.name}</strong>,</p>
      
      <p>Recebemos uma solicitação para redefinir a senha da sua conta na Plataforma EAD.</p>
      
      <p>Para criar uma nova senha, clique no botão abaixo:</p>
      
      <center>
        <a href="${data.resetUrl}" class="button">Redefinir Senha</a>
      </center>
      
      <div class="warning-box">
        <strong>⚠️ Importante:</strong>
        <p style="margin: 10px 0 0 0;">Este link expira em <strong>${data.expiresIn}</strong>. Se você não solicitou esta redefinição, ignore este e-mail.</p>
      </div>
      
      <p><strong>Dicas de segurança:</strong></p>
      <ul>
        <li>Use uma senha forte com letras, números e símbolos</li>
        <li>Não compartilhe sua senha com ninguém</li>
        <li>Evite usar a mesma senha em múltiplos sites</li>
      </ul>
      
      <p>Se você não solicitou esta redefinição, sua conta permanece segura e você pode ignorar este e-mail.</p>
      
      <p><strong>Equipe Plataforma EAD</strong></p>
    </div>
  `;
  
  return getBaseTemplate(content);
};
