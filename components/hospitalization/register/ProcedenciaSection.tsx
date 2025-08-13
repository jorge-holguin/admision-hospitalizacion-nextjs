import React from 'react';
import { Label } from "@/components/ui/label";
import { ProcedenciaSelector } from '@/components/hospitalization/ProcedenciaSelector';
import { OrigenSelector } from '@/components/hospitalization/OrigenSelector';
import { OrigenHospitalizacion } from '@/services/origenHospitalizacionService';

interface ProcedenciaSectionProps {
  procedencia: string;
  hospitalizationOrigin: string;
  patientId: string;
  validationErrors: Record<string, string>;
  disabled?: boolean;
  onProcedenciaChange: (value: string) => void;
  onOrigenChange: (value: string, origenData: OrigenHospitalizacion | null) => void;
  onAttentionOriginChange: (value: string) => void;
  onMedicoChange: (value: string, medicoData: any | null) => void;
  onDiagnosticoChange: (value: string, diagnosticoData: any | null) => void;
  onSeguroChange: (value: string, seguroData: any | null) => void;
}

export const ProcedenciaSection: React.FC<ProcedenciaSectionProps> = ({
  procedencia,
  hospitalizationOrigin,
  patientId,
  validationErrors,
  disabled = false,
  onProcedenciaChange,
  onOrigenChange,
  onAttentionOriginChange,
  onMedicoChange,
  onDiagnosticoChange,
  onSeguroChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="space-y-2">
        <Label htmlFor="procedencia" className="text-sm font-semibold text-black-600">
          Procedencia del Paciente <span className="text-red-500">*</span>
        </Label>
        <ProcedenciaSelector
          value={procedencia || 'EM'}
          onChange={(value) => onProcedenciaChange(value)}
          disabled={disabled}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="origen" className="text-sm font-semibold text-black-600">
          Código de Origen de Atención <span className="text-red-500">*</span>
        </Label>
        <OrigenSelector
          value={procedencia === 'RN' ? '' : hospitalizationOrigin}
          onChange={(value, origenData) => onOrigenChange(value, origenData)}
          origenFilter={procedencia}
          disabled={procedencia === 'RN' || disabled}
          required
          patientId={patientId}
          onAttentionOriginChange={onAttentionOriginChange}
          onMedicoChange={onMedicoChange}
          onDiagnosticoChange={onDiagnosticoChange}
          onSeguroChange={onSeguroChange}
        />
        {validationErrors.hospitalizationOrigin && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.hospitalizationOrigin}</p>
        )}
      </div>
    </div>
  );
};

export default ProcedenciaSection;
