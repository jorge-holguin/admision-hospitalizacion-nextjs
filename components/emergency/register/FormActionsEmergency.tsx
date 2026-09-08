import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Save, User, X } from "lucide-react";
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
import { extractDocumentFromToken, extractNombreCompletoFromToken } from '@/utils/jwtUtils';
import { useConsultorios } from '@/contexts/ConsultoriosContext';
import { useMedicos } from '@/contexts/MedicosContext';
import { useSeguros } from '@/contexts/SegurosContext';

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
  const [userDocument, setUserDocument] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const f = formData || {};

  const nombres = String(f.nombres || '').trim();
  const apep = String(f.apellidoPaterno || '').trim();
  const apem = String(f.apellidoMaterno || '').trim();
  const nombreTokens = new Set(nombres.toLowerCase().split(/\s+/).filter(Boolean));
  let patientName = nombres;
  if (apep && !nombreTokens.has(apep.toLowerCase())) {
    patientName += ' ' + apep;
    nombreTokens.add(apep.toLowerCase());
  }
  if (apem && !nombreTokens.has(apem.toLowerCase())) {
    patientName += ' ' + apem;
    nombreTokens.add(apem.toLowerCase());
  }
  patientName = patientName.trim() || '—';

  const { getConsultorioNombre } = useConsultorios();
  const { getMedicoInfo } = useMedicos();
  const { getSegurosDescripcion } = useSeguros();

  const consultorioDisplay = getConsultorioNombre(f.consultorio);
  const medicoDisplay = getMedicoInfo(f.medico);
  const seguroCode = String(f.seguro || '').split(' - ')[0]?.trim() || String(f.seguro || '').trim();
  const seguroDisplay = getSegurosDescripcion(seguroCode);

  useEffect(() => {
    try {
      setUserDocument(extractDocumentFromToken());
      setUserName(extractNombreCompletoFromToken());
    } catch {
      setUserDocument('');
      setUserName('');
    }
  }, []);
  
  // Verificar si hay una cuenta válida o si es un tipo de seguro que no requiere validación
  const paganteOrSoatInsuranceCodes = ['0', '00', '02'];
  const isPayingOrSoat = Boolean(insuranceCode && paganteOrSoatInsuranceCodes.includes(insuranceCode.trim()));
  
  // Bypass account validation for PAGANTE (0) and SOAT (02)
  const hasValidAccount = isPayingOrSoat || (formData?.numeroCuenta && formData.numeroCuenta !== 'No disponible');
  
  // Códigos de seguro SIS que requieren validación FUA
  const sisInsuranceCodes = ['20', '21', '22', '23', '24', '25'];
  const requiresFuaValidation = Boolean(insuranceCode && sisInsuranceCodes.includes(insuranceCode.trim()));


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
      {/* Mensaje de advertencia cuando no hay cuenta válida (excepto para PAGANTE y SOAT) */}
      {isUpdate && !hasValidAccount && !isPayingOrSoat && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex flex-wrap items-center">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-amber-700 font-medium">No hay cuenta válida</p>
          </div>
          <p className="text-amber-600 text-sm mt-1">
            No se puede actualizar el registro sin una cuenta válida. Por favor, verifique que el tipo de seguro tenga una cuenta asociada.
          </p>
        </div>
      )}
      
        <div className="flex flex-wrap justify-end gap-4 pt-6">
          <Button
            type="button"
            onClick={() => {
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
            <AlertDialogTitle className="flex flex-wrap items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
              {isUpdate ? 'Actualizar registro de emergencia' : 'Crear nuevo registro de emergencia'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea {isUpdate ? 'actualizar' : 'crear'} este registro de emergencia?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Detalles del registro de emergencia */}
          <div className="px-6 py-2 space-y-4">
            {/* Resumen principal */}
            <div className="p-3 bg-gray-50 rounded border text-sm text-gray-700 space-y-1">
              <div className="flex justify-between gap-2">
                <span className="font-medium">Paciente:</span>
                <strong className="text-right">{patientName}</strong>
              </div>
              <div className="flex justify-between gap-2">
                <span className="font-medium">Consultorio:</span>
                <strong className="text-right">{consultorioDisplay}</strong>
              </div>
              <div className="flex justify-between gap-2">
                <span className="font-medium">Seguro:</span>
                <strong className="text-right">{seguroDisplay}</strong>
              </div>
            </div>

            <div className="space-y-1 text-sm text-gray-700">
              {formData?.documento && (
                <p><span className="font-medium">Documento:</span> {formData.documento}</p>
              )}
              {formData?.fecha && (
                <p><span className="font-medium">Fecha:</span> {formData.fecha} <span className="font-medium ml-2">Hora:</span> {formData.hora}</p>
              )}
              {formData?.medico && (
                <p><span className="font-medium">Médico:</span> {medicoDisplay}</p>
              )}
              {formData?.diagnostico && (
                <p><span className="font-medium">Diagnóstico:</span> {formData.diagnostico}</p>
              )}
            </div>

            {/* Validación FUA para seguros SIS */}
            {requiresFuaValidation && (
              <FuaEmergencyStatusAlert 
                patientId={patientId}
                insuranceCode={insuranceCode}
                onValidationChange={setFuaValidationPassed}
              />
            )}

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded text-sm">
              <User className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Usuario que realiza la operación</p>
                <p className="text-blue-800">
                  <span className="font-semibold">{userName || 'No identificado'}</span>
                  <span className="ml-1 text-blue-600">(DNI: {userDocument || 'No identificado'})</span>
                </p>
              </div>
            </div>
          </div>
          
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
