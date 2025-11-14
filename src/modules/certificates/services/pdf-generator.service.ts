import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { config } from '@config/env';
import { logger } from '@shared/utils/logger';

export interface CertificateData {
  studentName: string;
  courseName: string;
  workload: number;
  completionDate: Date;
  verificationCode: string;
}

export class PDFGeneratorService {
  /**
   * Generate a certificate PDF
   */
  async generateCertificate(data: CertificateData): Promise<Buffer> {
    try {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Generate certificate content
        this.createCertificateContent(doc, data);

        doc.end();
      });
    } catch (error) {
      logger.error('Failed to generate certificate PDF', error);
      throw error;
    }
  }

  /**
   * Create certificate content
   */
  private async createCertificateContent(
    doc: PDFKit.PDFDocument,
    data: CertificateData
  ): Promise<void> {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Add border
    doc
      .rect(30, 30, pageWidth - 60, pageHeight - 60)
      .lineWidth(3)
      .stroke('#1e40af');

    doc
      .rect(40, 40, pageWidth - 80, pageHeight - 80)
      .lineWidth(1)
      .stroke('#1e40af');

    // Title
    doc
      .fontSize(36)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('CERTIFICADO', 0, 100, {
        align: 'center',
        width: pageWidth,
      });

    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#374151')
      .text('DE CONCLUSÃO DE CURSO', 0, 145, {
        align: 'center',
        width: pageWidth,
      });

    // Content
    doc.moveDown(2);

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#374151')
      .text('Certificamos que', 0, 200, {
        align: 'center',
        width: pageWidth,
      });

    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text(data.studentName.toUpperCase(), 0, 230, {
        align: 'center',
        width: pageWidth,
      });

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#374151')
      .text('concluiu com êxito o curso', 0, 270, {
        align: 'center',
        width: pageWidth,
      });

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text(data.courseName, 0, 300, {
        align: 'center',
        width: pageWidth,
      });

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#374151')
      .text(`com carga horária de ${data.workload} horas`, 0, 340, {
        align: 'center',
        width: pageWidth,
      });

    // Date
    const formattedDate = this.formatDate(data.completionDate);
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text(`Emitido em ${formattedDate}`, 0, 400, {
        align: 'center',
        width: pageWidth,
      });

    // Generate QR Code
    const verificationUrl = `${config.app.frontendUrl}/certificates/verify/${data.verificationCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 100,
      margin: 1,
    });

    // Add QR Code
    const qrCodeX = pageWidth - 150;
    const qrCodeY = pageHeight - 150;
    doc.image(qrCodeDataUrl, qrCodeX, qrCodeY, {
      width: 80,
      height: 80,
    });

    // Verification code
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('Código de Verificação:', qrCodeX - 10, qrCodeY + 90, {
        width: 100,
        align: 'center',
      });

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text(data.verificationCode.substring(0, 8).toUpperCase(), qrCodeX - 10, qrCodeY + 102, {
        width: 100,
        align: 'center',
      });

    // Footer
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text(
        'Este certificado pode ser validado em:',
        70,
        pageHeight - 80,
        {
          width: pageWidth - 200,
        }
      );

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text(
        `${config.app.frontendUrl}/certificates/verify`,
        70,
        pageHeight - 65,
        {
          width: pageWidth - 200,
        }
      );

    // Platform name
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Plataforma EAD', 70, pageHeight - 130, {
        width: 300,
      });

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('Sistema de Ensino a Distância', 70, pageHeight - 110, {
        width: 300,
      });
  }

  /**
   * Format date to Brazilian format
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

export const pdfGeneratorService = new PDFGeneratorService();
