import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FormActionsEmergencyProps {
  onSave: () => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  isEditable: boolean;
  patientId: string;
  onBeforeSave?: () => Promise<boolean>;
}

export const FormActionsEmergency: React.FC<FormActionsEmergencyProps> = ({
  onSave,
  onCancel,
  submitting,
  isEditable,
  patientId,
  onBeforeSave
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSaveClick = async () => {
    // Ejecutar validaciones previas si existen
    if (onBeforeSave) {
      const canProceed = await onBeforeSave();
      if (!canProceed) {
        return;
      }
    }
    
    // Mostrar diálogo de confirmación
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    await onSave();
  };

  return (
    <>
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="bg-[#e91e63] hover:bg-[#d81b60] text-white hover:text-white"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        
        {isEditable && (
          <Button
            type="button"
            onClick={handleSaveClick}
            disabled={submitting}
            className="bg-[#0074ba] hover:bg-[#0067a6] text-white hover:text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar
              </>
            )}
          </Button>
        )}
      </div>

      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Registro de Emergencia</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea registrar esta emergencia para el paciente {patientId}?
              Esta acción creará un nuevo registro en el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Confirmar Registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FormActionsEmergency;
