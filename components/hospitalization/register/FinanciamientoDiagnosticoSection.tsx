import React, { useRef } from 'react';
import { Label } from "@/components/ui/label";
import { SeguroSelector } from '@/components/hospitalization/SeguroSelector';
import { DiagnosticoSelector } from '@/components/hospitalization/DiagnosticoSelector';
import VerificacionDiagnostico, { VerificacionDiagnosticoRef } from '@/components/ui/VerificacionDiagnostico';
import { toast } from "@/components/ui/use-toast";

interface FinanciamientoDiagnosticoSectionProps {
  financing: string;
  diagnosis: string;
  hospitalizationOrigin: string;
  procedencia: string;
  validationErrors: Record<string, string>;
  disabled?: boolean;
  onSeguroChange: (value: string, seguroData: any | null) => void;
  onDiagnosticoChange: (value: string, diagnosticoData: any | null) => void;
  verificacionDiagnosticoRef?: React.RefObject<VerificacionDiagnosticoRef>;
}

export const FinanciamientoDiagnosticoSection: React.FC<FinanciamientoDiagnosticoSectionProps> = ({
  financing,
  diagnosis,
  hospitalizationOrigin,
  procedencia,
  validationErrors,
  disabled = false,
  onSeguroChange,
  onDiagnosticoChange,
  verificacionDiagnosticoRef
}) => {
  const origenCode = hospitalizationOrigin ? hospitalizationOrigin.split(' ')[0] : '';
  const tipoOrigen = procedencia as 'CE' | 'EM' | 'RN';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="space-y-2">
        <Label htmlFor="seguro" className="text-sm font-semibold text-black-600">
          Financiamiento <span className="text-red-500">*</span>
        </Label>
        <SeguroSelector
          value={financing}
          onChange={(value, seguroData) => onSeguroChange(value, seguroData)}
          disabled={disabled}
          className="w-full"
        />
        {validationErrors.financing && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.financing}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="diagnostico" className="text-sm font-semibold text-black-600">
          Diagnóstico <span className="text-red-500">*</span>
        </Label>
        <DiagnosticoSelector
          value={diagnosis}
          onChange={(value, diagnosticoData) => onDiagnosticoChange(value, diagnosticoData)}
          disabled={disabled}
          origenId={origenCode}
          tipoOrigen={tipoOrigen}
          className="w-full"
        />
        {validationErrors.diagnosis && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.diagnosis}</p>
        )}
        
        {/* Componente de verificación de diagnóstico solo para origen CE */}
        {origenCode === 'CE' && (
          <div className="mt-2">
            <VerificacionDiagnostico
              ref={verificacionDiagnosticoRef}
              diagnostico={diagnosis}
              onResultado={(resultado) => {
                if (!resultado.valido) {
                  toast({
                    title: "Error en el diagnóstico",
                    description: resultado.mensaje || "El diagnóstico no es válido",
                    variant: "destructive"
                  });
                } else if (resultado.reemplazo && !resultado.multiples) {
                  toast({
                    title: "Diagnóstico validado",
                    description: `Se utilizará: ${resultado.reemplazo}`,
                    variant: "default"
                  });
                } else if (resultado.multiples) {
                  toast({
                    title: "Múltiples diagnósticos encontrados",
                    description: resultado.mensaje || "Se encontraron múltiples diagnósticos similares",
                    variant: "default"
                  });
                }
              }}
              className="mt-2"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanciamientoDiagnosticoSection;
