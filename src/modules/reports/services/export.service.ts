import { logger } from '@shared/utils/logger';
import { reportService, ReportFilters } from './report.service';
import PDFDocument from 'pdfkit';

export type ExportFormat = 'csv' | 'pdf';
export type ReportType = 'overview' | 'subscriptions' | 'courses' | 'financial';

export class ExportService {
  /**
   * Export report in specified format
   */
  async exportReport(
    type: ReportType,
    format: ExportFormat,
    filters: ReportFilters = {}
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    try {
      if (format === 'csv') {
        return await this.exportToCSV(type, filters);
      } else if (format === 'pdf') {
        return await this.exportToPDF(type, filters);
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('Failed to export report', error);
      throw error;
    }
  }

  /**
   * Export report to CSV format
   */
  private async exportToCSV(
    type: ReportType,
    filters: ReportFilters
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    let csvContent = '';
    const timestamp = new Date().toISOString().split('T')[0];

    switch (type) {
      case 'overview': {
        const report = await reportService.getOverviewReport(filters);
        csvContent = this.generateOverviewCSV(report);
        break;
      }
      case 'subscriptions': {
        const report = await reportService.getSubscriptionReport(filters);
        csvContent = this.generateSubscriptionCSV(report);
        break;
      }
      case 'courses': {
        const report = await reportService.getCourseReport(filters);
        csvContent = this.generateCourseCSV(report);
        break;
      }
      case 'financial': {
        const report = await reportService.getFinancialReport(filters);
        csvContent = this.generateFinancialCSV(report);
        break;
      }
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }

    return {
      buffer: Buffer.from(csvContent, 'utf-8'),
      filename: `${type}-report-${timestamp}.csv`,
      contentType: 'text/csv',
    };
  }

  /**
   * Export report to PDF format
   */
  private async exportToPDF(
    type: ReportType,
    filters: ReportFilters
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const timestamp = new Date().toISOString().split('T')[0];
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    // Collect PDF chunks
    doc.on('data', (chunk) => chunks.push(chunk));

    // Add header
    doc.fontSize(20).text('Plataforma EAD - Relatório', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
    doc.moveDown(2);

    // Generate content based on report type
    switch (type) {
      case 'overview': {
        const report = await reportService.getOverviewReport(filters);
        this.generateOverviewPDF(doc, report);
        break;
      }
      case 'subscriptions': {
        const report = await reportService.getSubscriptionReport(filters);
        this.generateSubscriptionPDF(doc, report);
        break;
      }
      case 'courses': {
        const report = await reportService.getCourseReport(filters);
        this.generateCoursePDF(doc, report);
        break;
      }
      case 'financial': {
        const report = await reportService.getFinancialReport(filters);
        this.generateFinancialPDF(doc, report);
        break;
      }
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }

    // Finalize PDF
    doc.end();

    // Wait for PDF to be generated
    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return {
      buffer,
      filename: `${type}-report-${timestamp}.pdf`,
      contentType: 'application/pdf',
    };
  }

  // CSV Generation Methods

  private generateOverviewCSV(report: any): string {
    let csv = 'Relatório Geral\n\n';
    
    csv += 'Assinaturas\n';
    csv += 'Métrica,Valor\n';
    csv += `Total Ativo,${report.subscriptions.totalActive}\n`;
    csv += `Novos no Período,${report.subscriptions.newInPeriod}\n`;
    csv += `Taxa de Retenção,${report.subscriptions.retentionRate}%\n`;
    csv += `Taxa de Churn,${report.subscriptions.churnRate}%\n`;
    csv += `MRR,R$ ${report.subscriptions.mrr.toFixed(2)}\n\n`;

    csv += 'Cursos\n';
    csv += 'Métrica,Valor\n';
    csv += `Total Publicados,${report.courses.totalPublished}\n`;
    csv += `Em Progresso,${report.courses.totalInProgress}\n`;
    csv += `Concluídos,${report.courses.totalCompleted}\n\n`;

    csv += 'Alunos\n';
    csv += 'Métrica,Valor\n';
    csv += `Total Ativo,${report.students.totalActive}\n`;
    csv += `Tempo Total de Estudo (min),${report.students.totalStudyTime}\n\n`;

    csv += 'Certificados\n';
    csv += 'Métrica,Valor\n';
    csv += `Total Emitidos,${report.certificates.totalIssued}\n`;
    csv += `Emitidos no Período,${report.certificates.issuedInPeriod}\n`;

    return csv;
  }

  private generateSubscriptionCSV(report: any): string {
    let csv = 'Relatório de Assinaturas\n\n';
    
    csv += 'Resumo\n';
    csv += 'Métrica,Valor\n';
    csv += `Total,${report.totalSubscriptions}\n`;
    csv += `Ativas,${report.activeSubscriptions}\n`;
    csv += `Suspensas,${report.suspendedSubscriptions}\n`;
    csv += `Canceladas,${report.cancelledSubscriptions}\n\n`;

    csv += 'Assinaturas por Plano\n';
    csv += 'Plano,Quantidade,Receita\n';
    report.subscriptionsByPlan.forEach((plan: any) => {
      csv += `${plan.planName},${plan.count},R$ ${plan.revenue.toFixed(2)}\n`;
    });

    return csv;
  }

  private generateCourseCSV(report: any): string {
    let csv = 'Relatório de Cursos\n\n';
    
    csv += 'Resumo\n';
    csv += 'Métrica,Valor\n';
    csv += `Total de Cursos,${report.totalCourses}\n`;
    csv += `Cursos Publicados,${report.publishedCourses}\n\n`;

    csv += 'Cursos Mais Acessados\n';
    csv += 'Título,Instrutor,Acessos,Conclusões,Taxa de Conclusão,Progresso Médio\n';
    report.mostAccessedCourses.forEach((course: any) => {
      csv += `"${course.courseTitle}","${course.instructorName}",${course.totalAccesses},${course.totalCompletions},${course.completionRate}%,${course.averageProgress}%\n`;
    });

    return csv;
  }

  private generateFinancialCSV(report: any): string {
    let csv = 'Relatório Financeiro\n\n';
    
    csv += 'Resumo\n';
    csv += 'Métrica,Valor\n';
    csv += `Receita Total,R$ ${report.totalRevenue.toFixed(2)}\n`;
    csv += `Receita no Período,R$ ${report.revenueInPeriod.toFixed(2)}\n`;
    csv += `MRR,R$ ${report.mrr.toFixed(2)}\n`;
    csv += `Receita Média por Usuário,R$ ${report.averageRevenuePerUser.toFixed(2)}\n`;
    csv += `MRR Projetado,R$ ${report.projectedMRR.toFixed(2)}\n\n`;

    csv += 'Receita por Plano\n';
    csv += 'Plano,Assinantes,Receita\n';
    report.revenueByPlan.forEach((plan: any) => {
      csv += `${plan.planName},${plan.subscribers},R$ ${plan.revenue.toFixed(2)}\n`;
    });

    return csv;
  }

  // PDF Generation Methods

  private generateOverviewPDF(doc: PDFKit.PDFDocument, report: any): void {
    doc.fontSize(16).text('Relatório Geral', { underline: true });
    doc.moveDown();

    doc.fontSize(14).text('Assinaturas', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Ativo: ${report.subscriptions.totalActive}`);
    doc.text(`Novos no Período: ${report.subscriptions.newInPeriod}`);
    doc.text(`Taxa de Retenção: ${report.subscriptions.retentionRate}%`);
    doc.text(`Taxa de Churn: ${report.subscriptions.churnRate}%`);
    doc.text(`MRR: R$ ${report.subscriptions.mrr.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(14).text('Cursos', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Publicados: ${report.courses.totalPublished}`);
    doc.text(`Em Progresso: ${report.courses.totalInProgress}`);
    doc.text(`Concluídos: ${report.courses.totalCompleted}`);
    doc.moveDown();

    doc.fontSize(14).text('Alunos', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Ativo: ${report.students.totalActive}`);
    doc.text(`Tempo Total de Estudo: ${report.students.totalStudyTime} minutos`);
    doc.moveDown();

    doc.fontSize(14).text('Certificados', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Emitidos: ${report.certificates.totalIssued}`);
    doc.text(`Emitidos no Período: ${report.certificates.issuedInPeriod}`);
  }

  private generateSubscriptionPDF(doc: PDFKit.PDFDocument, report: any): void {
    doc.fontSize(16).text('Relatório de Assinaturas', { underline: true });
    doc.moveDown();

    doc.fontSize(14).text('Resumo', { underline: true });
    doc.fontSize(10);
    doc.text(`Total: ${report.totalSubscriptions}`);
    doc.text(`Ativas: ${report.activeSubscriptions}`);
    doc.text(`Suspensas: ${report.suspendedSubscriptions}`);
    doc.text(`Canceladas: ${report.cancelledSubscriptions}`);
    doc.moveDown();

    doc.fontSize(14).text('Assinaturas por Plano', { underline: true });
    doc.fontSize(10);
    report.subscriptionsByPlan.forEach((plan: any) => {
      doc.text(`${plan.planName}: ${plan.count} assinantes - R$ ${plan.revenue.toFixed(2)}`);
    });
  }

  private generateCoursePDF(doc: PDFKit.PDFDocument, report: any): void {
    doc.fontSize(16).text('Relatório de Cursos', { underline: true });
    doc.moveDown();

    doc.fontSize(14).text('Resumo', { underline: true });
    doc.fontSize(10);
    doc.text(`Total de Cursos: ${report.totalCourses}`);
    doc.text(`Cursos Publicados: ${report.publishedCourses}`);
    doc.moveDown();

    doc.fontSize(14).text('Cursos Mais Acessados', { underline: true });
    doc.fontSize(9);
    report.mostAccessedCourses.slice(0, 10).forEach((course: any, index: number) => {
      doc.text(
        `${index + 1}. ${course.courseTitle} - ${course.totalAccesses} acessos (${course.completionRate}% conclusão)`
      );
    });
  }

  private generateFinancialPDF(doc: PDFKit.PDFDocument, report: any): void {
    doc.fontSize(16).text('Relatório Financeiro', { underline: true });
    doc.moveDown();

    doc.fontSize(14).text('Resumo', { underline: true });
    doc.fontSize(10);
    doc.text(`Receita Total: R$ ${report.totalRevenue.toFixed(2)}`);
    doc.text(`Receita no Período: R$ ${report.revenueInPeriod.toFixed(2)}`);
    doc.text(`MRR: R$ ${report.mrr.toFixed(2)}`);
    doc.text(`Receita Média por Usuário: R$ ${report.averageRevenuePerUser.toFixed(2)}`);
    doc.text(`MRR Projetado: R$ ${report.projectedMRR.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(14).text('Receita por Plano', { underline: true });
    doc.fontSize(10);
    report.revenueByPlan.forEach((plan: any) => {
      doc.text(`${plan.planName}: ${plan.subscribers} assinantes - R$ ${plan.revenue.toFixed(2)}`);
    });
  }
}

export const exportService = new ExportService();
