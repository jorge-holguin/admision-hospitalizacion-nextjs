import React from 'react';
import { PatientInfoCard } from '@/components/hospitalization/PatientInfoCard';

interface PatientSectionProps {
  patientId: string;
  onPatientDataLoaded: (data: any) => void;
}

export const PatientSection: React.FC<PatientSectionProps> = ({ 
  patientId, 
  onPatientDataLoaded 
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Datos del Paciente</h3>
      <div className="bg-white">
        <PatientInfoCard 
          patientId={patientId} 
          onDataLoaded={onPatientDataLoaded}
          className="bg-white shadow-sm"
        />
      </div>
    </div>
  );
};

export default PatientSection;
