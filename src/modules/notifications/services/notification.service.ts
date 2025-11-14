import { emailService } from '@shared/services/email.service';
import { config } from '@config/env';
import {
  getWelcomeTemplate,
  getInstructorCredentialsTemplate,
  getCourseSubmittedTemplate,
  getCourseApprovedTemplate,
  getCourseRejectedTemplate,
  getNewCoursePublishedTemplate,
  getSubscriptionConfirmedTemplate,
  getSubscriptionExpiringSoonTemplate,
  getSubscriptionSuspendedTemplate,
  getCertificateIssuedTemplate,
  getPasswordResetTemplate,
} from '../templates/email-templates';

export interface WelcomeEmailData {
  name: string;
  email: string;
}

export interface InstructorCredentialsEmailData {
  name: string;
  email: string;
  temporaryPassword: string;
}

export interface CourseSubmittedEmailData {
  instructorName: string;
  instructorEmail: string;
  courseTitle: string;
  courseId: string;
}

export interface CourseApprovedEmailData {
  instructorName: string;
  instructorEmail: string;
  courseTitle: string;
  courseId: string;
}

export interface CourseRejectedEmailData {
  instructorName: string;
  instructorEmail: string;
  courseTitle: string;
  courseId: string;
  reason: string;
}

export interface NewCoursePublishedEmailData {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  courseDescription: string;
  instructorName: string;
  courseId: string;
}

export interface SubscriptionConfirmedEmailData {
  studentName: string;
  studentEmail: string;
  planName: string;
  amount: number;
  expiresAt: Date;
}

export interface SubscriptionExpiringSoonEmailData {
  studentName: string;
  studentEmail: string;
  expiresAt: Date;
}

export interface SubscriptionSuspendedEmailData {
  studentName: string;
  studentEmail: string;
  reason: string;
}

export interface CertificateIssuedEmailData {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  certificateId: string;
  verificationCode: string;
}

export interface PasswordResetEmailData {
  name: string;
  email: string;
  resetToken: string;
}

/**
 * Notification service for sending emails
 */
export class NotificationService {
  /**
   * Send welcome email to new student
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    const loginUrl = `${config.app.frontendUrl}/login`;
    
    const html = getWelcomeTemplate({
      name: data.name,
      loginUrl,
    });

    await emailService.sendEmail({
      to: data.email,
      subject: 'Bem-vindo à Plataforma EAD! 🎓',
      html,
    });
  }

  /**
   * Send instructor credentials email
   */
  async sendInstructorCredentialsEmail(data: InstructorCredentialsEmailData): Promise<void> {
    const loginUrl = `${config.app.frontendUrl}/login`;
    
    const html = getInstructorCredentialsTemplate({
      name: data.name,
      email: data.email,
      temporaryPassword: data.temporaryPassword,
      loginUrl,
    });

    await emailService.sendEmail({
      to: data.email,
      subject: 'Bem-vindo à Plataforma EAD - Suas Credenciais de Instrutor',
      html,
    });
  }

  /**
   * Send course submitted for approval email
   */
  async sendCourseSubmittedEmail(data: CourseSubmittedEmailData): Promise<void> {
    const reviewUrl = `${config.app.frontendUrl}/admin/courses/${data.courseId}/review`;
    
    const html = getCourseSubmittedTemplate({
      instructorName: data.instructorName,
      courseTitle: data.courseTitle,
      reviewUrl,
    });

    await emailService.sendEmail({
      to: data.instructorEmail,
      subject: 'Curso Enviado para Aprovação - Plataforma EAD',
      html,
    });
  }

  /**
   * Send course approved email
   */
  async sendCourseApprovedEmail(data: CourseApprovedEmailData): Promise<void> {
    const courseUrl = `${config.app.frontendUrl}/courses/${data.courseId}`;
    
    const html = getCourseApprovedTemplate({
      instructorName: data.instructorName,
      courseTitle: data.courseTitle,
      courseUrl,
    });

    await emailService.sendEmail({
      to: data.instructorEmail,
      subject: 'Curso Aprovado! 🎉 - Plataforma EAD',
      html,
    });
  }

  /**
   * Send course rejected email
   */
  async sendCourseRejectedEmail(data: CourseRejectedEmailData): Promise<void> {
    const editUrl = `${config.app.frontendUrl}/instructor/courses/${data.courseId}/edit`;
    
    const html = getCourseRejectedTemplate({
      instructorName: data.instructorName,
      courseTitle: data.courseTitle,
      reason: data.reason,
      editUrl,
    });

    await emailService.sendEmail({
      to: data.instructorEmail,
      subject: 'Curso Necessita Ajustes - Plataforma EAD',
      html,
    });
  }

  /**
   * Send new course published notification to student
   */
  async sendNewCoursePublishedEmail(data: NewCoursePublishedEmailData): Promise<void> {
    const courseUrl = `${config.app.frontendUrl}/courses/${data.courseId}`;
    
    const html = getNewCoursePublishedTemplate({
      studentName: data.studentName,
      courseTitle: data.courseTitle,
      courseDescription: data.courseDescription,
      instructorName: data.instructorName,
      courseUrl,
    });

    await emailService.sendEmail({
      to: data.studentEmail,
      subject: `Novo Curso Disponível: ${data.courseTitle} 🚀`,
      html,
    });
  }

  /**
   * Send subscription confirmed email
   */
  async sendSubscriptionConfirmedEmail(data: SubscriptionConfirmedEmailData): Promise<void> {
    const dashboardUrl = `${config.app.frontendUrl}/dashboard`;
    
    const html = getSubscriptionConfirmedTemplate({
      studentName: data.studentName,
      planName: data.planName,
      amount: data.amount,
      expiresAt: data.expiresAt.toLocaleDateString('pt-BR'),
      dashboardUrl,
    });

    await emailService.sendEmail({
      to: data.studentEmail,
      subject: 'Assinatura Confirmada! 🎉 - Plataforma EAD',
      html,
    });
  }

  /**
   * Send subscription expiring soon email
   */
  async sendSubscriptionExpiringSoonEmail(data: SubscriptionExpiringSoonEmailData): Promise<void> {
    const renewUrl = `${config.app.frontendUrl}/subscription/renew`;
    
    const html = getSubscriptionExpiringSoonTemplate({
      studentName: data.studentName,
      expiresAt: data.expiresAt.toLocaleDateString('pt-BR'),
      renewUrl,
    });

    await emailService.sendEmail({
      to: data.studentEmail,
      subject: 'Sua Assinatura Está Expirando ⏰ - Plataforma EAD',
      html,
    });
  }

  /**
   * Send subscription suspended email
   */
  async sendSubscriptionSuspendedEmail(data: SubscriptionSuspendedEmailData): Promise<void> {
    const reactivateUrl = `${config.app.frontendUrl}/subscription/reactivate`;
    
    const html = getSubscriptionSuspendedTemplate({
      studentName: data.studentName,
      reason: data.reason,
      reactivateUrl,
    });

    await emailService.sendEmail({
      to: data.studentEmail,
      subject: 'Assinatura Suspensa - Plataforma EAD',
      html,
    });
  }

  /**
   * Send certificate issued email
   */
  async sendCertificateIssuedEmail(data: CertificateIssuedEmailData): Promise<void> {
    const certificateUrl = `${config.apiUrl}/api/certificates/${data.certificateId}/download`;
    
    const html = getCertificateIssuedTemplate({
      studentName: data.studentName,
      courseTitle: data.courseTitle,
      certificateUrl,
      verificationCode: data.verificationCode,
    });

    await emailService.sendEmail({
      to: data.studentEmail,
      subject: `Certificado Emitido: ${data.courseTitle} 🏆`,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${data.resetToken}`;
    
    const html = getPasswordResetTemplate({
      name: data.name,
      resetUrl,
      expiresIn: '1 hora',
    });

    await emailService.sendEmail({
      to: data.email,
      subject: 'Redefinição de Senha - Plataforma EAD',
      html,
    });
  }
}

export const notificationService = new NotificationService();
