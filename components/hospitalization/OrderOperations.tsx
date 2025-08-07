"use client"

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

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
      
      // Llamar a la API DELETE para eliminar la hospitalización
      const response = await fetch(`/api/hospitaliza/${deleteItemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
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
        description: 'La orden de hospitalización ha sido eliminada',
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

  // Método para editar una orden
  const handleEditOrder = (orderId?: string, patientId?: string) => {
    if (!orderId || orderId.trim() === '') {
      toast({
        title: 'Error',
        description: 'No se puede editar: ID de orden de hospitalización no válido',
        variant: 'destructive'
      });
      return;
    }
    
    if (!patientId) {
      toast({
        title: 'Error',
        description: 'No se puede editar: ID de paciente no válido',
        variant: 'destructive'
      });
      return;
    }
    
    // Redireccionar a la vista de detalles en lugar de la página de registro
    window.location.href = `/hospitalization/view/${patientId}?orderId=${orderId}`;
  };

  // Método para crear una nueva orden
  const handleNewOrder = (patientId: string, getPacienteData?: () => Promise<any>) => {
    if (!patientId) {
      toast({
        title: 'Error',
        description: 'No se puede crear: ID de paciente no válido',
        variant: 'destructive'
      });
      return;
    }
    
    // Si se proporciona una función para obtener datos del paciente, usarla
    if (getPacienteData) {
      getPacienteData()
        .catch(err => {
          toast({
            title: 'Advertencia',
            description: 'No se pudieron cargar los datos del paciente, pero se continuará con la creación',
            variant: 'default'
          });
        })
        .finally(() => {
          // Redireccionar a la página de registro con el ID del paciente
          window.location.href = `/hospitalization/register/${patientId}`;
        });
    } else {
      // Si no hay función para obtener datos, simplemente redireccionar
      window.location.href = `/hospitalization/register/${patientId}`;
    }
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
