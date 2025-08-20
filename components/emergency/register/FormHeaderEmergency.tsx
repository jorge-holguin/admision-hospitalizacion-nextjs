import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from "@/components/ui/spinner";

interface FormHeaderEmergencyProps {
  fecha: string;
  hora: string;
  onFechaChange: (value: string) => void;
  onHoraChange: (value: string) => void;
  disabled?: boolean;
  validationErrors?: Record<string, string>;
  patientId?: string;
  onFormChange?: (field: string, value: string) => void;
}

export const FormHeaderEmergency: React.FC<FormHeaderEmergencyProps> = ({
  fecha,
  hora,
  onFechaChange,
  onHoraChange,
  disabled = false,
  validationErrors = {},
  patientId,
  onFormChange
}) => {
  // Estado para el número de cuenta - inicializado con string vacío para evitar error de controlado/no controlado
  const [numeroCuenta, setNumeroCuenta] = useState<string>("");
  const [loadingCuenta, setLoadingCuenta] = useState(false);
  
  // Cargar el número de cuenta del paciente - usando useRef para evitar llamadas repetidas
  const cuentaFetchedRef = React.useRef(false);
  
  useEffect(() => {
    // Solo ejecutar una vez por patientId
    if (!patientId || cuentaFetchedRef.current) return;
    
    const fetchNumeroCuenta = async () => {      
      try {
        setLoadingCuenta(true);
        const response = await fetch(`/api/cuenta/${patientId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.cuentaId) {
            setNumeroCuenta(data.data.cuentaId);
            // También actualizar el formData si existe onFormChange
            if (onFormChange) {
              onFormChange("numeroCuenta", data.data.cuentaId);
            }
          }
          // Marcar como ya obtenido
          cuentaFetchedRef.current = true;
        }
      } catch (error) {
        console.error("Error al cargar número de cuenta:", error);
      } finally {
        setLoadingCuenta(false);
      }
    };
    
    fetchNumeroCuenta();
  }, [patientId]); // Eliminar onFormChange de las dependencias
  return (
    <div className="mb-6 pt-6">
      <h3 className="text-lg font-semibold mb-4">Información de la Emergencia</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Número de Cuenta */}
        <div className="space-y-2">
          <Label>Nro de cuenta</Label>
          <div className="relative">
            <Input
              value={numeroCuenta}
              disabled={true}
              placeholder={loadingCuenta ? "Cargando..." : "No disponible"}
              className="bg-gray-50"
            />
            {loadingCuenta && (
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
