import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from "@/components/ui/spinner";
import { useEmergencyAccount } from '@/contexts/EmergencyAccountContext';

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
  // Usar el contexto de emergencia para obtener datos de la cuenta del paciente
  const { isLoading, fetchEmergencyAccount } = useEmergencyAccount();
  
  // Estado local para el ID de cuenta a mostrar
  const [displayCuentaId, setDisplayCuentaId] = useState<string>("No disponible");
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  
  // Ref para evitar múltiples llamadas
  const lastFetchRef = useRef<string>('');
  const isFetchingRef = useRef(false);
  
  // Buscar cuenta cuando cambia el tipo de seguro
  useEffect(() => {
    if (!patientId || !insuranceCode || isViewMode) return;
    
    // Crear clave única para esta combinación
    const fetchKey = `${patientId}_${insuranceCode}`;
    
    // Si ya se buscó esta combinación o está en proceso, no hacer nada
    if (lastFetchRef.current === fetchKey || isFetchingRef.current) {
      console.log(`⏭️ [FormHeaderEmergency] Saltando búsqueda duplicada para ${fetchKey}`);
      return;
    }
    
    const loadAccount = async () => {
      try {
        isFetchingRef.current = true;
        lastFetchRef.current = fetchKey;
        setIsLoadingLocal(true);
        console.log(`🚨 [FormHeaderEmergency] Buscando cuenta para paciente ${patientId} con seguro ${insuranceCode}`);
        
        const accountData = await fetchEmergencyAccount(patientId, insuranceCode);
        
        if (accountData?.cuentaId) {
          console.log(`✅ [FormHeaderEmergency] Cuenta encontrada: ${accountData.cuentaId}`);
          setDisplayCuentaId(accountData.cuentaId);
          
          // Notificar al formulario padre sobre la cuenta encontrada SOLO UNA VEZ
          if (onFormChange) {
            onFormChange('cuentaId', accountData.cuentaId);
            onFormChange('numeroCuenta', accountData.cuentaId);
          }
        } else {
          console.log(`❌ [FormHeaderEmergency] No se encontró cuenta`);
          setDisplayCuentaId("No disponible");
        }
      } catch (error) {
        console.error('Error al buscar cuenta:', error);
        setDisplayCuentaId("No disponible");
      } finally {
        setIsLoadingLocal(false);
        isFetchingRef.current = false;
      }
    };
    
    loadAccount();
  }, [patientId, insuranceCode, isViewMode]);
  
  // Actualizar displayCuentaId cuando cambian las props directas
  useEffect(() => {
    if (cuentaId) {
      console.log(`🚨 [FormHeaderEmergency] Actualizando con cuentaId desde props: ${cuentaId}`);
      setDisplayCuentaId(cuentaId);
    } else if (isViewMode && emergencyCuentaId) {
      console.log(`🚨 [FormHeaderEmergency] Actualizando con emergencyCuentaId: ${emergencyCuentaId}`);
      setDisplayCuentaId(emergencyCuentaId);
    }
  }, [cuentaId, emergencyCuentaId, isViewMode]);
  
  // Determinar si estamos cargando la cuenta
  const isLoadingCuentaId = loadingCuenta || isLoadingLocal || (!cuentaId && !emergencyCuentaId && patientId && isLoading[patientId]);
  return (
      <div className="mb-6 pt-6">
        <h3 className="text-lg font-semibold mb-4">Información de la Emergencia</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-100 p-4 rounded-lg border border-gray-200">
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
            readOnly={disabled}
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
            readOnly={disabled}
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
