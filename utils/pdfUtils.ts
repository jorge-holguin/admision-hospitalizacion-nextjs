import { PDFDocument } from 'pdf-lib';

/**
 * Combina múltiples PDFs en un solo documento
 * @param pdfUrls Array de URLs de los PDFs a combinar
 * @returns URL del PDF combinado
 */
export async function mergePDFs(pdfUrls: string[]): Promise<string> {
  try {
    // Crear un nuevo documento PDF
    const mergedPdf = await PDFDocument.create();
    
    // Procesar cada URL de PDF
    for (const url of pdfUrls) {
      // Obtener el PDF como ArrayBuffer
      const response = await fetch(url);
      const pdfBytes = await response.arrayBuffer();
      
      // Cargar el PDF
      const pdf = await PDFDocument.load(pdfBytes);
      
      // Copiar todas las páginas al documento combinado
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }
    
    // Guardar el PDF combinado
    const mergedPdfBytes = await mergedPdf.save();
    
    // Crear un Blob y una URL para el PDF combinado
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error al combinar PDFs:', error);
    throw error;
  }
}

/**
 * Descarga un PDF combinado
 * @param pdfUrls Array de URLs de los PDFs a combinar y descargar
 * @param fileName Nombre del archivo para la descarga
 */
export async function downloadMergedPDF(pdfUrls: string[], fileName: string = 'documentos-combinados.pdf'): Promise<void> {
  try {
    const mergedPdfUrl = await mergePDFs(pdfUrls);
    
    // Crear un enlace para la descarga
    const link = document.createElement('a');
    link.href = mergedPdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    URL.revokeObjectURL(mergedPdfUrl); // Liberar memoria
  } catch (error) {
    console.error('Error al descargar PDF combinado:', error);
    throw error;
  }
}

/**
 * Imprime un PDF combinado
 * @param pdfUrls Array de URLs de los PDFs a combinar e imprimir
 * @returns URL del PDF combinado para mantener referencia
 */
export async function printMergedPDF(pdfUrls: string[]): Promise<string> {
  try {
    const mergedPdfUrl = await mergePDFs(pdfUrls);
    
    // Crear un iframe para imprimir
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    
    printFrame.src = mergedPdfUrl;
    
    // Esperar a que el iframe cargue y luego imprimir
    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        // No eliminamos el iframe ni revocamos la URL para mantener la referencia
      }, 1000);
    };
    
    document.body.appendChild(printFrame);
    
    // Devolvemos la URL del PDF combinado para mantener la referencia
    return mergedPdfUrl;
  } catch (error) {
    console.error('Error al imprimir PDF combinado:', error);
    throw error;
  }
}
