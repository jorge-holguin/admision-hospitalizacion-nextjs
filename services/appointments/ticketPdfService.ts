/**
 * Servicio para generar PDF de tickets de citas (80mm ancho - boleta térmica)
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type TicketData = {
  consultorio: string;          // "REUMATOLOGIA"
  diaAtencion: string;          // "20/10/2025"
  emitidoEl: string;            // "20/10/2025 11:57:45"
  historiaClinica: string;      // "07679863"
  hora: string;                 // "08:00"
  medico: string;               // "BERTO SINCHE ROSA ARACELI"
  numero: string;               // "250194650"   // (N° CIT)
  numeroAtencion: string;       // "01"
  operador: string;             // "HOLGUIN CUCALON JORGE"
  paciente: string;             // "AZABACHE GORVALAN MARIA ESTHER"
  seguro: string;               // "SIS PEAS (DU046)"
  turno: string;                // "Mañana"
};

/**
 * Genera un PDF de ticket de cita (80mm de ancho)
 * @param ticketData Datos del ticket
 * @returns Blob del PDF generado
 */
export async function generateTicketPDF(ticketData: TicketData): Promise<Blob> {
  // Crear documento PDF
  const pdfDoc = await PDFDocument.create();
  
  // Dimensiones para boleta térmica de 80mm
  // 80mm = 226.77 puntos (1mm = 2.83465 puntos)
  const pageWidth = 226.77;
  const pageHeight = 600; // Alto variable según contenido
  
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Configuración de texto
  const fontSize = 8;
  const fontSizeLarge = 10;
  const fontSizeTitle = 12;
  const lineHeight = 12;
  let yPosition = pageHeight - 20;
  
  // Función auxiliar para dibujar texto
  const drawText = (text: string, size: number, font: any, isBold: boolean = false) => {
    page.drawText(text, {
      x: 10,
      y: yPosition,
      size,
      font: isBold ? fontBold : fontRegular,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  };
  
  // Función para dibujar línea separadora
  const drawLine = () => {
    page.drawLine({
      start: { x: 10, y: yPosition },
      end: { x: pageWidth - 10, y: yPosition },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  };
  
  // Función para texto centrado
  const drawCenteredText = (text: string, size: number, font: any) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = (pageWidth - textWidth) / 2;
    page.drawText(text, {
      x,
      y: yPosition,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  };
  
  // === ENCABEZADO ===
  drawCenteredText('HOSPITAL REGIONAL DE ICA', fontSizeTitle, fontBold);
  drawCenteredText('TICKET DE CITA', fontSizeLarge, fontBold);
  yPosition -= 5;
  drawLine();
  yPosition -= 5;
  
  // === INFORMACIÓN PRINCIPAL ===
  drawText(`N° CITA: ${ticketData.numero}`, fontSizeLarge, fontBold, true);
  drawText(`ORDEN: ${ticketData.numeroAtencion}`, fontSize, fontRegular);
  yPosition -= 5;
  drawLine();
  yPosition -= 5;
  
  // === DATOS DEL PACIENTE ===
  drawText('PACIENTE:', fontSize, fontBold, true);
  drawText(ticketData.paciente, fontSize, fontRegular);
  drawText(`H.C.: ${ticketData.historiaClinica}`, fontSize, fontRegular);
  drawText(`SEGURO: ${ticketData.seguro}`, fontSize, fontRegular);
  yPosition -= 5;
  drawLine();
  yPosition -= 5;
  
  // === DATOS DE LA CITA ===
  drawText('FECHA Y HORA:', fontSize, fontBold, true);
  drawText(`${ticketData.diaAtencion} - ${ticketData.hora}`, fontSizeLarge, fontBold, true);
  drawText(`TURNO: ${ticketData.turno}`, fontSize, fontRegular);
  yPosition -= 5;
  drawLine();
  yPosition -= 5;
  
  // === CONSULTORIO Y MÉDICO ===
  drawText('CONSULTORIO:', fontSize, fontBold, true);
  drawText(ticketData.consultorio, fontSize, fontRegular);
  yPosition -= 3;
  drawText('MÉDICO:', fontSize, fontBold, true);
  drawText(ticketData.medico, fontSize, fontRegular);
  yPosition -= 5;
  drawLine();
  yPosition -= 5;
  
  // === PIE DE PÁGINA ===
  drawText(`Emitido: ${ticketData.emitidoEl}`, fontSize - 1, fontRegular);
  drawText(`Operador: ${ticketData.operador}`, fontSize - 1, fontRegular);
  yPosition -= 10;
  
  drawCenteredText('IMPORTANTE:', fontSize, fontBold);
  drawCenteredText('Presentarse 15 min antes', fontSize - 1, fontRegular);
  drawCenteredText('de la hora programada', fontSize - 1, fontRegular);
  
  // Serializar el PDF
  const pdfBytes = await pdfDoc.save();
  
  // Convertir a Blob
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Abre el PDF en una nueva ventana para previsualización
 * @param pdfBlob Blob del PDF
 */
export function openPDFPreview(pdfBlob: Blob): void {
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
  
  // Limpiar el URL después de un tiempo
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Descarga el PDF
 * @param pdfBlob Blob del PDF
 * @param filename Nombre del archivo
 */
export function downloadPDF(pdfBlob: Blob, filename: string = 'ticket-cita.pdf'): void {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  // Limpiar
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
