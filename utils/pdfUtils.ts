import { PDFDocument } from 'pdf-lib';

/**
 * Intenta imprimir un PDF directamente a través de la API de impresión local
 * @param url URL del PDF a imprimir
 * @returns true si la impresión fue exitosa, false si falló
 */
export async function printPdfViaDirectApi(url: string): Promise<boolean> {
  try {
    console.log(`Intentando imprimir PDF vía API directa: ${url}`);
    
    // Obtener el PDF como ArrayBuffer
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Error al obtener el PDF: ${response.status} ${response.statusText}`);
      return false;
    }
    
    // Obtener los bytes del PDF
    const pdfBytes = await response.arrayBuffer();
    
    // Enviar el PDF a la API de impresión local
    const printResponse = await fetch('http://localhost:9100/imprimir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf'
      },
      body: pdfBytes
    });
    
    if (!printResponse.ok) {
      console.error(`Error en la API de impresión: ${printResponse.status} ${printResponse.statusText}`);
      return false;
    }
    
    console.log('PDF enviado correctamente a la impresora');
    return true;
  } catch (error) {
    console.error('Error al imprimir PDF vía API directa:', error);
    return false;
  }
}

/**
 * Intenta imprimir múltiples PDFs en secuencia usando la API directa
 * @param urls Array de URLs de PDFs a imprimir
 * @returns true si todos los PDFs se imprimieron correctamente, false si alguno falló
 */
export async function printMultiplePdfsViaDirectApi(urls: string[]): Promise<boolean> {
  try {
    for (const url of urls) {
      const success = await printPdfViaDirectApi(url);
      if (!success) {
        console.error(`Falló la impresión directa para: ${url}`);
        return false;
      }
      // Pequeña pausa entre impresiones para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return true;
  } catch (error) {
    console.error('Error al imprimir múltiples PDFs:', error);
    return false;
  }
}

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
      try {
        console.log(`Intentando obtener PDF desde: ${url}`);
        // Obtener el PDF como ArrayBuffer
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`Error en la respuesta HTTP: ${response.status} ${response.statusText}`);
          // Intentar leer el cuerpo de la respuesta para depuración
          const errorText = await response.text();
          console.error(`Contenido de la respuesta de error: ${errorText.substring(0, 200)}...`);
          throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Verificar que el tipo de contenido sea PDF
        const contentType = response.headers.get('content-type');
        console.log(`Tipo de contenido recibido: ${contentType}`);
        
        if (!contentType || !contentType.includes('application/pdf')) {
          console.warn(`El tipo de contenido no es PDF: ${contentType}`);
          // Continuar de todos modos, ya que algunos servidores pueden no configurar correctamente los headers
        }
        
        const pdfBytes = await response.arrayBuffer();
        
        // Verificar que hay datos en el ArrayBuffer
        if (pdfBytes.byteLength === 0) {
          console.error('El PDF recibido está vacío');
          throw new Error('El PDF recibido está vacío');
        }
        
        console.log(`PDF recibido correctamente, tamaño: ${pdfBytes.byteLength} bytes`);
        
        // Cargar el PDF
        const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        
        // Copiar todas las páginas al documento combinado
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      } catch (error) {
        console.error(`Error procesando PDF desde ${url}:`, error);
        // Continuar con el siguiente PDF si hay un error
        continue;
      }
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
 * Imprime un PDF combinado directamente sin mostrar la vista previa al usuario
 * @param pdfUrls Array de URLs de los PDFs a combinar e imprimir
 * @returns URL del PDF combinado para mantener referencia
 */
export async function printMergedPDF(pdfUrls: string[]): Promise<string> {
  try {
    const mergedPdfUrl = await mergePDFs(pdfUrls);
    
    // Crear un iframe oculto para imprimir
    const printFrame = document.createElement('iframe');
    
    // Asegurarnos que el iframe sea completamente invisible
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';
    printFrame.style.visibility = 'hidden';
    printFrame.style.pointerEvents = 'none';
    
    // Añadir el iframe al DOM antes de establecer el src
    document.body.appendChild(printFrame);
    
    // Configurar el iframe para imprimir inmediatamente al cargar
    printFrame.onload = () => {
      try {
        // Imprimir inmediatamente sin mostrar la vista previa
        if (printFrame.contentWindow) {
          // Forzar la impresión sin interacción del usuario
          printFrame.contentWindow.print();
          
          // No eliminamos el iframe automáticamente para permitir que el usuario decida
          // si imprimir o cancelar sin límite de tiempo
        }
      } catch (e) {
        console.error('Error al imprimir desde iframe:', e);
      }
    };
    
    // Establecer la fuente del iframe después de configurar el onload
    printFrame.src = mergedPdfUrl;
    
    // Devolvemos la URL del PDF combinado para mantener la referencia
    return mergedPdfUrl;
  } catch (error) {
    console.error('Error al imprimir PDF combinado:', error);
    throw error;
  }
}
