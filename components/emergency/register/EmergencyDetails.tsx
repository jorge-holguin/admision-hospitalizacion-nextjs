import React, { useEffect, useState } from 'react';

interface EmergencyDetailsProps {
  emergencyId?: string | null;
  onDataLoaded: (data: any) => void;
  onStatusChange: (isEditable: boolean, isLocked: boolean) => void;
}

export const EmergencyDetails: React.FC<EmergencyDetailsProps> = ({
  emergencyId,
  onDataLoaded,
  onStatusChange
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadEmergencyData = async () => {
      if (!emergencyId) {
        // Si no hay emergencyId, es modo creación
        onStatusChange(true, false);
        return;
      }

      try {
        setLoading(true);
        
        const response = await fetch(`/api/emergencia/${emergencyId}`);
        if (!response.ok) {
          throw new Error('Error al cargar datos de la emergencia');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          const emergencyData = data.data;
          
          // Formatear los datos para el formulario
          const formattedData = {
            fecha: emergencyData.FECHA ? new Date(emergencyData.FECHA).toISOString().split('T')[0] : '',
            hora: emergencyData.HORA || '',
            consultorio: emergencyData.CONSULTORIO || '',
            medico: emergencyData.MEDICO || '',
            motivoEmergencia: emergencyData.MOTIVO_EMERGENCIA || '',
            seguro: emergencyData.SEGURO || '',
            diagnostico: emergencyData.CIEX1 || '',
            observacion1: emergencyData.OBSERVACION1 || '',
            observacion2: emergencyData.OBSERVACION2 || '',
            estado: emergencyData.ESTADO || '1'
          };

          // Determinar si es editable basado en el estado
          const isEditable = emergencyData.ESTADO === '1' || emergencyData.ESTADO === '2'; // REGISTRADO o ACTIVO
          const isLocked = emergencyData.ESTADO === '0' || emergencyData.ESTADO === '3'; // ANULADO o COMPLETADO

          onDataLoaded(formattedData);
          onStatusChange(isEditable, isLocked);
        } else {
          throw new Error(data.error || 'No se encontraron datos de la emergencia');
        }
      } catch (error) {
        console.error('Error al cargar emergencia:', error);
        onStatusChange(false, true);
      } finally {
        setLoading(false);
      }
    };

    loadEmergencyData();
  }, [emergencyId, onDataLoaded, onStatusChange]);

  // Este componente no renderiza nada visible, solo maneja la lógica de carga
  return null;
};

export default EmergencyDetails;
