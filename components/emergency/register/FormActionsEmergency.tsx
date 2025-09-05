import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Save, X } from "lucide-react";
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
import FuaEmergencyStatusAlert from './FuaEmergencyStatusAlert';

interface FormActionsEmergencyProps {
  onSave: () => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  isEditable: boolean;
  patientId: string;
  onBeforeSave?: () => Promise<boolean>;
  isUpdate?: boolean;
  formData?: any; // Datos del formulario para generar SQL
  insuranceCode?: string; // Código de seguro para validación FUA
}

export const FormActionsEmergency: React.FC<FormActionsEmergencyProps> = ({
  onSave,
  onCancel,
  submitting,
  isEditable,
  patientId,
  onBeforeSave,
  isUpdate = false,
  formData,
  insuranceCode
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fuaValidationPassed, setFuaValidationPassed] = useState(false);
  
  // Verificar si hay una cuenta válida o si es un tipo de seguro que no requiere validación
  const paganteOrSoatInsuranceCodes = ['0', '00', '02'];
  const isPayingOrSoat = Boolean(insuranceCode && paganteOrSoatInsuranceCodes.includes(insuranceCode.trim()));
  
  // Bypass account validation for PAGANTE (0) and SOAT (02)
  const hasValidAccount = isPayingOrSoat || (formData?.numeroCuenta && formData.numeroCuenta !== 'No disponible');
  
  // Códigos de seguro SIS que requieren validación FUA
  const sisInsuranceCodes = ['20', '21', '22', '23', '24', '25'];
  const requiresFuaValidation = Boolean(insuranceCode && sisInsuranceCodes.includes(insuranceCode.trim()));


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
      {/* Mensaje de advertencia cuando no hay cuenta válida (excepto para PAGANTE y SOAT) */}
      {isUpdate && !hasValidAccount && !isPayingOrSoat && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-amber-700 font-medium">No hay cuenta válida</p>
          </div>
          <p className="text-amber-600 text-sm mt-1">
            No se puede actualizar el registro sin una cuenta válida. Por favor, verifique que el tipo de seguro tenga una cuenta asociada.
          </p>
        </div>
      )}
      
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="bg-[#e91e63] hover:bg-[#d81b60] text-white hover:text-white"
        >
          <X className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => {
            console.log('Botón de guardar clickeado');
            handleSaveClick();
          }}
          disabled={submitting || !isEditable || (isUpdate && !hasValidAccount)}
          className="bg-[#0074ba] hover:bg-[#0067a6] text-white hover:text-white"
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
              registro de emergencia?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Validación FUA para seguros SIS */}
          {requiresFuaValidation && (
            <div className="px-6 pb-4">
              <FuaEmergencyStatusAlert 
                patientId={patientId}
                insuranceCode={insuranceCode}
                onValidationChange={setFuaValidationPassed}
              />
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                onClick={handleConfirmSave} 
                variant="default"
                disabled={requiresFuaValidation && !fuaValidationPassed}
              >
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
