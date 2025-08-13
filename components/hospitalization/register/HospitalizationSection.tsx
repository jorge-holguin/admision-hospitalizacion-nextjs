import React from 'react';
import { ProcedenciaSection } from './ProcedenciaSection';
import { ConsultorioMedicoSection } from './ConsultorioMedicoSection';
import { FinanciamientoDiagnosticoSection } from './FinanciamientoDiagnosticoSection';
import { OrigenHospitalizacion } from '@/services/origenHospitalizacionService';
import { Seguro } from '@/services/seguroService';
import { Diagnostico } from '@/services/diagnosticoService';
import { VerificacionDiagnosticoRef } from '@/components/ui/VerificacionDiagnostico';

interface HospitalizationSectionProps {
  formData: {
    procedencia: string;
    hospitalizationOrigin: string;
    hospitalizedIn: string;
    authorizingDoctor: string;
    financing: string;
    diagnosis: string;
  };
  patientId: string;
  validationErrors: Record<string, string>;
  disabled?: boolean;
  verificacionDiagnosticoRef: React.RefObject<VerificacionDiagnosticoRef>;
  onFormChange: (field: string, value: string) => void;
  onOrigenChange: (value: string, origenData: OrigenHospitalizacion | null) => void;
  onAttentionOriginChange: (value: string) => void;
  onMedicoChange: (value: string, medicoData: any | null) => void;
  onDiagnosticoChange: (value: string, diagnosticoData: Diagnostico | null) => void;
  onSeguroChange: (value: string, seguroData: Seguro | null) => void;
  onProcedenciaChange: (value: string) => void;
}

export const HospitalizationSection: React.FC<HospitalizationSectionProps> = ({
  formData,
  patientId,
  validationErrors,
  disabled = false,
  verificacionDiagnosticoRef,
  onFormChange,
  onOrigenChange,
  onAttentionOriginChange,
  onMedicoChange,
  onDiagnosticoChange,
  onSeguroChange,
  onProcedenciaChange
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Datos de Hospitalización</h3>
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
        {/* Procedencia y Origen */}
        <ProcedenciaSection
          procedencia={formData.procedencia}
          hospitalizationOrigin={formData.hospitalizationOrigin}
          patientId={patientId}
          validationErrors={validationErrors}
          disabled={disabled}
          onProcedenciaChange={onProcedenciaChange}
          onOrigenChange={onOrigenChange}
          onAttentionOriginChange={onAttentionOriginChange}
          onMedicoChange={onMedicoChange}
          onDiagnosticoChange={onDiagnosticoChange}
          onSeguroChange={onSeguroChange}
        />
        
        {/* Consultorio y Médico */}
        <ConsultorioMedicoSection
          hospitalizedIn={formData.hospitalizedIn}
          authorizingDoctor={formData.authorizingDoctor}
          validationErrors={validationErrors}
          disabled={disabled}
          onConsultorioChange={(value) => onFormChange('hospitalizedIn', value)}
          onMedicoChange={onMedicoChange}
        />
        
        {/* Financiamiento y Diagnóstico */}
        <FinanciamientoDiagnosticoSection
          financing={formData.financing}
          diagnosis={formData.diagnosis}
          hospitalizationOrigin={formData.hospitalizationOrigin}
          procedencia={formData.procedencia}
          validationErrors={validationErrors}
          disabled={disabled}
          onSeguroChange={onSeguroChange}
          onDiagnosticoChange={onDiagnosticoChange}
          verificacionDiagnosticoRef={verificacionDiagnosticoRef}
        />
        
        {/* Mensaje informativo */}
        <div className="flex items-center mt-4 text-sm text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>El Código de Origen de Atención no es requerido si el nombre es "RN".</span>
        </div>
      </div>
    </div>
  );
};

export default HospitalizationSection;
