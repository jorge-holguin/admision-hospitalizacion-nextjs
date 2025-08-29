import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from "@/components/ui/spinner";
import { usePatientAccount } from '@/contexts/PatientAccountContext';

interface FormHeaderEmergencyProps {
  fecha: string;
  hora: string;
  onFechaChange: (value: string) => void;
  onHoraChange: (value: string) => void;
  disabled?: boolean;
  validationErrors?: Record<string, string>;
  patientId?: string;
  onFormChange?: (field: string, value: string) => void;
  insuranceCode?: string;
  cuentaId?: string;
  loadingCuenta?: boolean;
  // Nuevo prop para recibir el ID de cuenta desde los datos de emergencia
  emergencyCuentaId?: string;
  // Prop para indicar si estamos en modo vista
  isViewMode?: boolean;
}

export const FormHeaderEmergency: React.FC<FormHeaderEmergencyProps> = ({
  fecha,
  hora,
  onFechaChange,
  onHoraChange,
  disabled = false,
  validationErrors = {},
  patientId,
  onFormChange,
  insuranceCode,
  cuentaId,
  loadingCuenta = false,
  emergencyCuentaId,
  isViewMode = false
}) => {
  // Usar el contexto para obtener datos de la cuenta del paciente
  const { getAccountData, isLoading } = usePatientAccount();
  
  // Determinar qué ID de cuenta mostrar con el siguiente orden de prioridad:
  // 1. cuentaId proporcionado directamente por props (mayor prioridad)
  // 2. emergencyCuentaId si estamos en modo vista
  // 3. accountData.cuentaId del contexto
  // 4. "No disponible" si ninguno está disponible
  const accountDataFromContext = patientId ? getAccountData(patientId) : null;
  const displayCuentaId = cuentaId || (isViewMode && emergencyCuentaId) || (accountDataFromContext?.cuentaId) || "No disponible";
  
  // Determinar si estamos cargando la cuenta
  const isLoadingCuentaId = loadingCuenta || (!cuentaId && !emergencyCuentaId && patientId && isLoading[patientId]);
  return (
      <div className="mb-6 pt-6">
        <h3 className="text-lg font-semibold mb-4">Información de la Emergencia</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Número de Cuenta */}
        <div className="space-y-2">
          <Label>Nro de cuenta</Label>
          <div className="relative">
            <Input
              value={displayCuentaId}
              disabled={true}
              placeholder={isLoadingCuentaId ? "Cargando..." : "No disponible"}
              className="bg-gray-50"
            />
            {isLoadingCuentaId && (
              <div className="absolute right-2 top-2">
                <Spinner size="sm" />
              </div>
            )}
          </div>
        </div>
        
        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="fecha">
            Fecha <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => onFechaChange(e.target.value)}
            disabled={disabled}
            className={validationErrors.fecha ? 'border-red-500' : ''}
          />
          {validationErrors.fecha && (
            <p className="text-sm text-red-500">{validationErrors.fecha}</p>
          )}
        </div>

        {/* Hora */}
        <div className="space-y-2">
          <Label htmlFor="hora">
            Hora <span className="text-red-500">*</span>
          </Label>
          <Input
            id="hora"
            type="time"
            value={hora}
            onChange={(e) => onHoraChange(e.target.value)}
            disabled={disabled}
            className={validationErrors.hora ? 'border-red-500' : ''}
          />
          {validationErrors.hora && (
            <p className="text-sm text-red-500">{validationErrors.hora}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormHeaderEmergency;
