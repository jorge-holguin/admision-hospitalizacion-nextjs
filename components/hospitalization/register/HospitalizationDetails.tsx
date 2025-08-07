"use client"

import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { formatDate, formatTime } from './FormUtils';

interface HospitalizationDetailsProps {
  orderId?: string | null;
  onDataLoaded: (data: any) => void;
  onStatusChange: (isEditable: boolean, isLocked: boolean) => void;
}

export function HospitalizationDetails({ 
  orderId, 
  onDataLoaded, 
  onStatusChange 
}: HospitalizationDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current date and time
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // formato YYYY-MM-DD para input type="date"
  const currentTime = now.toTimeString().substring(0, 5); // formato HH:MM para input type="time"

  // Función para cargar detalles de hospitalización
  const fetchHospitalizationDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orden-hospitalizacion/${id}`);
      if (!response.ok) {
        throw new Error(`Error al cargar detalles de hospitalización: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Verificar si el estado es '3' para bloquear campos
      const isLocked = data.ESTADO === '3';
      const isEditable = !isLocked;
      
      if (isLocked) {
        // Mostrar mensaje informativo
        setTimeout(() => {
          toast({
            title: "Información",
            description: "Esta hospitalización no puede ser modificada debido a su estado actual.",
            variant: "default"
          });
        }, 500);
      }
      
      // Notificar el cambio de estado
      onStatusChange(isEditable, isLocked);
      
      // Formatear la hora correctamente
      const formattedTime = formatTime(data.HORA1, currentTime);
      
      // Crear objeto con los datos formateados
      const formattedData = {
        date: formatDate(data.FECHA1) || currentDate,
        time: formattedTime,
        // Campos con etiqueta roja (obligatorios)
        hospitalizationOrigin: data.CUENTAID ? `${data.CUENTAID} [${data.CUENTANOMBRE || ''}]` : "",
        attentionOrigin: data.ORIGEN || "CE [CONSULTA EXTERNA]",
        hospitalizedIn: data.CONSULTORIO1 ? `${data.CONSULTORIO1.trim()} [${data.CONSULNOMBRE || ''}]` : "",
        authorizingDoctor: data.MEDICO1 ? `${data.MEDICO1} [${data.MEDICONOMBRE || ''}]` : "",
        financing: data.SEGURO ? `${data.SEGURO} [${data.SEGURONOMBRE || ''}]` : "",
        diagnosis: data.DIAGNOSTICO ? `${data.DIAGNOSTICO} [${data.DIAGNOMBRE || ''}]` : "",
        // Datos adicionales para los selectores
        origenData: data.CUENTAID && data.CUENTANOMBRE ? {
          ORIGEN: data.ORIGEN || '',
          CODIGO: data.CUENTAID || '',
          CONSULTORIO: data.CONSULTORIO1 || '',
          NOM_CONSULTORIO: data.CONSULNOMBRE || '',
          PACIENTE: `${data.APELLIDO_PATERNO || ''} ${data.APELLIDO_MATERNO || ''} ${data.NOMBRES || ''}`.trim(),
          FECHA: new Date(),
          MEDICO: data.MEDICO1 || '',
          NOM_MEDICO: data.MEDICONOMBRE || '',
          NOMBRES: data.NOMBRES || '',
          DNI: data.DNI || '',
          DX: data.DIAGNOSTICO || ''
        } : null,
        diagnosticoData: data.DIAGNOSTICO && data.DIAGNOMBRE ? {
          Codigo: data.DIAGNOSTICO || '',
          Nombre: data.DIAGNOMBRE || ''
        } : null,
        rawData: data
      };
      
      // Pasar los datos al componente padre
      onDataLoaded(formattedData);
      
    } catch (err: any) {
      console.error('Error al cargar detalles de hospitalización:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: `No se pudieron cargar los detalles de la hospitalización: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de hospitalización si existe orderId
  useEffect(() => {
    if (orderId) {
      fetchHospitalizationDetails(orderId);
    } else {
      // No hay orden, permitir edición
      onStatusChange(true, false);
    }
  }, [orderId]);

  return null; // Este es un componente lógico, no renderiza UI
}
