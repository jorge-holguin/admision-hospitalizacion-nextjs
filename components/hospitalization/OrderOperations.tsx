"use client"

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/api-config';
import { extractDocumentFromToken } from '@/utils/jwtUtils';

interface OrderOperationsProps {
  onOrderDeleted?: () => void;
}

export function useOrderOperations(props?: OrderOperationsProps) {
  const { toast } = useToast();
  const { onOrderDeleted } = props || {};
  
  // Estado para el diálogo de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteItemId, setDeleteItemId] = useState<string>('');
  const [deleteItemName, setDeleteItemName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Método para iniciar el proceso de eliminación
  const handleDeleteOrder = (orderId?: string, patientName?: string) => {
    if (!orderId || orderId.trim() === '') {
      toast({
        title: 'Error',
        description: 'No se puede eliminar: ID de orden de hospitalización no válido',
        variant: 'destructive'
      });
      return;
    }
    
    // Eliminar espacios en blanco del ID
    const cleanId = orderId.trim();
    
    // Configurar el diálogo de confirmación
    setDeleteItemId(cleanId);
    setDeleteItemName(patientName || `Hospitalización ${cleanId}`);
    setDeleteDialogOpen(true);
  };
  
  // Método para confirmar la eliminación
  const confirmDeleteOrder = async () => {
    try {
      setIsDeleting(true);
      
      // Obtener el apellido del usuario desde el token JWT usando la utilidad
      let usuario = 'SISTEMA';
      try {
        usuario = extractDocumentFromToken();
      } catch (e) {
        console.error('Error al obtener datos de usuario del token JWT:', e);
      }
      
      // Llamar a la API DELETE para eliminar lógicamente la hospitalización
      const response = await fetch(API_ENDPOINTS.hospitalizacion.delete(deleteItemId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuario,
          motivo: 'Eliminado desde el listado de órdenes'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al eliminar: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Cerrar el diálogo
      setDeleteDialogOpen(false);
      
      // Notificar éxito
      toast({
        title: 'Eliminado correctamente',
        description: result.message || 'La orden de hospitalización ha sido marcada como eliminada',
        variant: 'default'
      });
      
      // Notificar que se ha eliminado la orden si se proporciona el callback
      if (onOrderDeleted) {
        onOrderDeleted();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Error al eliminar la hospitalización: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // OBSOLETO: Ahora se usa el sistema de modales
  // Método para editar una orden existente
  const handleEditOrder = (orderId: string, patientId: string) => {
    console.warn('⚠️ handleEditOrder está obsoleto. Usa el sistema de modales de hospitalización.');
    toast({
      title: 'Función obsoleta',
      description: 'Por favor usa el botón de Hospitalización en la tabla de pacientes',
      variant: 'default'
    });
  };

  // OBSOLETO: Ahora se usa el sistema de modales
  // Método para crear una nueva orden
  const handleNewOrder = (patientId: string, getPacienteData?: () => Promise<any>) => {
    console.warn('⚠️ handleNewOrder está obsoleto. Usa el sistema de modales de hospitalización.');
    toast({
      title: 'Función obsoleta',
      description: 'Por favor usa el botón de Hospitalización en la tabla de pacientes',
      variant: 'default'
    });
  };

  return {
    // Estado
    deleteDialogOpen,
    deleteItemId,
    deleteItemName,
    isDeleting,
    
    // Métodos
    handleDeleteOrder,
    confirmDeleteOrder,
    handleEditOrder,
    handleNewOrder,
    setDeleteDialogOpen
  };
}
