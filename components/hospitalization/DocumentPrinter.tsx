"use client"

import { useToast } from '@/components/ui/use-toast';
import { printMergedPDF } from '@/utils/pdfUtils';
import { useAuth } from '@/components/AuthProvider';

// Obtener la URL de la API desde las variables de entorno
const API_BACKEND_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL;

interface DocumentPrinterProps {
  onPrintComplete?: () => void;
}

export function useDocumentPrinter(props?: DocumentPrinterProps) {
  const { toast } = useToast();
  const { onPrintComplete } = props || {};
  const { user } = useAuth();

  // Función para imprimir directamente sin abrir el modal
  const handleDirectPrint = async (urls: string[]) => {
    try {
      // Llamar directamente a la función de impresión sin usar estados de carga
      await printMergedPDF(urls);
      
      // Mostrar notificación de éxito
      toast({
        title: 'Impresión iniciada',
        description: 'El documento se está enviando a la impresora.',
        variant: 'default'
      });
      
      // Notificar que la impresión se ha completado si se proporciona el callback
      if (onPrintComplete) {
        onPrintComplete();
      }
    } catch (error) {
      // Mostrar mensaje de error
      toast({
        title: 'Error de impresión',
        description: 'No se pudo imprimir el documento. Intente nuevamente.',
        variant: 'destructive'
      });
    }
  };

  // Función para imprimir documentos de hospitalización
  const printHospitalizationDocument = (orderId: string, documentType: 'filiacion' | 'orden-consentimiento' | 'consentimiento-docencia' | 'fua') => {
    if (!orderId || orderId.trim() === '') {
      toast({
        title: 'Error',
        description: 'No se puede imprimir: ID de orden de hospitalización no válido',
        variant: 'destructive'
      });
      return;
    }
    
    // Eliminar espacios en blanco del ID
    const cleanId = orderId.trim();
    
    // Configurar las URLs e imprimir directamente según el tipo de documento
    let pdfUrls: string[] = [];
    
    // Obtener el nombre completo del usuario desde el token de autenticación
    const nombreCompleto = user?.nombreCompleto || '';
    
    switch(documentType) {
      case 'filiacion':
        pdfUrls = [`${API_BACKEND_URL}/reporte/pdf/hoja-filiacion/${cleanId}?usuario=${encodeURIComponent(nombreCompleto)}`];
        handleDirectPrint(pdfUrls);
        break;
      
      case 'orden-consentimiento':
        pdfUrls = [`${API_BACKEND_URL}/reporte/pdf/orden-hospitalizacion/${cleanId}?usuario=${encodeURIComponent(nombreCompleto)}`];
        handleDirectPrint(pdfUrls);
        break;
      
      case 'consentimiento-docencia':
        pdfUrls = [`${API_BACKEND_URL}/reporte/pdf/consentimiento-hospitalizacion/${cleanId}?usuario=${encodeURIComponent(nombreCompleto)}`];
        handleDirectPrint(pdfUrls);
        break;
      
      case 'fua':
        // Implementar cuando esté disponible la API
        toast({
          title: 'En desarrollo',
          description: 'Funcionalidad de impresión de FUA en desarrollo',
          variant: 'default'
        });
        break;
      
      default:
        toast({
          title: 'Error',
          description: 'Tipo de documento no reconocido',
          variant: 'destructive'
        });
        break;
    }
  };

  return {
    handleDirectPrint,
    printHospitalizationDocument
  };
}
