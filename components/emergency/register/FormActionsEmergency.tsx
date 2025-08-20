import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
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
  isUpdate?: boolean;
  formData?: any; // Datos del formulario para generar SQL
}

export const FormActionsEmergency: React.FC<FormActionsEmergencyProps> = ({
  onSave,
  onCancel,
  submitting,
  isEditable,
  patientId,
  onBeforeSave,
  isUpdate = false,
  formData
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSaveClick = async () => {
    console.log('handleSaveClick ejecutado');
    
    // Ejecutar validaciones previas si existen
    if (onBeforeSave) {
      console.log('Ejecutando validaciones previas');
      const canProceed = await onBeforeSave();
      console.log('Resultado de validaciones:', canProceed);
      if (!canProceed) {
        console.log('No se puede proceder, validaciones fallidas');
        return;
      }
    }
    
    // Mostrar diálogo de confirmación
    console.log('Mostrando diálogo de confirmación');
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    console.log('handleConfirmSave ejecutado');
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
        >
          <X className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => {
            console.log('Botón de guardar clickeado');
            handleSaveClick();
          }}
          disabled={submitting || !isEditable}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUpdate ? 'Actualizando...' : 'Guardando...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isUpdate ? 'Actualizar' : 'Guardar'}
            </>
          )}
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
              {isUpdate ? 'Actualizar registro de emergencia' : 'Crear nuevo registro de emergencia'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea {isUpdate ? 'actualizar' : 'crear'} este
              registro de emergencia? Se generará una consulta SQL para insertar los datos en la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleConfirmSave} variant="default">
                {isUpdate ? 'Actualizar' : 'Crear'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FormActionsEmergency;
