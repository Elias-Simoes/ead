import { config } from '@config/env';
import { logger } from '@shared/utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface InstructorCredentialsData {
  name: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

/**
 * Email service for sending transactional emails
 * Currently supports mock implementation for development
 * In production, integrate with SendGrid, AWS SES, or Mailgun
 */
export class EmailService {
  /**
   * Send an email
   * @param options - Email options (to, subject, html, text)
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // In development, log the email instead of sending
      if (config.nodeEnv === 'development') {
        logger.info('Email would be sent (development mode)', {
          to: options.to,
          subject: options.subject,
          preview: options.html.substring(0, 100),
        });
        return;
      }

      // In production, integrate with actual email service
      // Example for SendGrid:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(config.email.sendgrid.apiKey);
      // await sgMail.send({
      //   to: options.to,
      //   from: {
      //     email: config.email.from,
      //     name: config.email.fromName,
      //   },
      //   subject: options.subject,
      //   html: options.html,
      //   text: options.text,
      // });

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
      });
    } catch (error) {
      logger.error('Failed to send email', {
        error,
        to: options.to,
        subject: options.subject,
      });
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send instructor credentials email
   * @param data - Instructor credentials data
   */
  async sendInstructorCredentials(data: InstructorCredentialsData): Promise<void> {
    const html = this.getInstructorCredentialsTemplate(data);
    const text = this.getInstructorCredentialsTextTemplate(data);

    await this.sendEmail({
      to: data.email,
      subject: 'Bem-vindo à Plataforma EAD - Suas Credenciais de Instrutor',
      html,
      text,
    });
  }

  /**
   * Get HTML template for instructor credentials email
   */
  private getInstructorCredentialsTemplate(data: InstructorCredentialsData): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credenciais de Instrutor</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4F46E5;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
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
    }
    .credential-value {
      font-family: monospace;
      background-color: #f3f4f6;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 5px;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Bem-vindo à Plataforma EAD</h1>
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
    
    <div class="warning">
      <strong>⚠️ Importante:</strong> Por questões de segurança, recomendamos que você altere sua senha no primeiro acesso.
    </div>
    
    <p>Para acessar a plataforma, clique no botão abaixo:</p>
    
    <a href="${data.loginUrl}" class="button">Acessar Plataforma</a>
    
    <p>Como instrutor, você poderá:</p>
    <ul>
      <li>Criar e gerenciar seus cursos</li>
      <li>Adicionar módulos e aulas</li>
      <li>Criar avaliações para seus alunos</li>
      <li>Acompanhar o progresso dos estudantes</li>
      <li>Corrigir avaliações dissertativas</li>
    </ul>
    
    <p>Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.</p>
    
    <p>Bons cursos!</p>
    
    <p><strong>Equipe Plataforma EAD</strong></p>
  </div>
  
  <div class="footer">
    <p>Este é um e-mail automático, por favor não responda.</p>
    <p>&copy; ${new Date().getFullYear()} Plataforma EAD. Todos os direitos reservados.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get plain text template for instructor credentials email
   */
  private getInstructorCredentialsTextTemplate(data: InstructorCredentialsData): string {
    return `
Bem-vindo à Plataforma EAD

Olá ${data.name},

Você foi cadastrado como instrutor na Plataforma EAD! Estamos muito felizes em tê-lo conosco.

Abaixo estão suas credenciais de acesso:

E-mail: ${data.email}
Senha Temporária: ${data.temporaryPassword}

⚠️ IMPORTANTE: Por questões de segurança, recomendamos que você altere sua senha no primeiro acesso.

Para acessar a plataforma, acesse: ${data.loginUrl}

Como instrutor, você poderá:
- Criar e gerenciar seus cursos
- Adicionar módulos e aulas
- Criar avaliações para seus alunos
- Acompanhar o progresso dos estudantes
- Corrigir avaliações dissertativas

Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.

Bons cursos!

Equipe Plataforma EAD

---
Este é um e-mail automático, por favor não responda.
© ${new Date().getFullYear()} Plataforma EAD. Todos os direitos reservados.
    `.trim();
  }
}

export const emailService = new EmailService();
