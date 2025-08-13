import React from 'react';
import { Label } from "@/components/ui/label";
import { ConsultorioSelector } from '@/components/hospitalization/ConsultorioSelector';
import { MedicoSelector } from '@/components/hospitalization/MedicoSelector';

interface ConsultorioMedicoSectionProps {
  hospitalizedIn: string;
  authorizingDoctor: string;
  validationErrors: Record<string, string>;
  disabled?: boolean;
  onConsultorioChange: (value: string) => void;
  onMedicoChange: (value: string, medicoData: any | null) => void;
}

export const ConsultorioMedicoSection: React.FC<ConsultorioMedicoSectionProps> = ({
  hospitalizedIn,
  authorizingDoctor,
  validationErrors,
  disabled = false,
  onConsultorioChange,
  onMedicoChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="space-y-2">
        <Label htmlFor="consultorio" className="text-sm font-semibold text-black-600">
          Hospitalizado en <span className="text-red-500">*</span>
        </Label>
        <ConsultorioSelector
          value={hospitalizedIn}
          onChange={(value) => onConsultorioChange(value)}
          disabled={disabled}
          className="w-full"
        />
        {validationErrors.hospitalizedIn && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.hospitalizedIn}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="medico" className="text-sm font-semibold text-black-600">
          Médico que autoriza la Hospitalización <span className="text-red-500">*</span>
        </Label>
        <MedicoSelector
          value={authorizingDoctor}
          onChange={(value, medicoData) => onMedicoChange(value, medicoData)}
          disabled={disabled}
          className="w-full"
        />
        {validationErrors.authorizingDoctor && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.authorizingDoctor}</p>
        )}
      </div>
    </div>
  );
};

export default ConsultorioMedicoSection;
