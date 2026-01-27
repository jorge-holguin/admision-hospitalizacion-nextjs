import React from 'react';
import { PatientInfoCard } from '@/components/hospitalization/PatientInfoCard';

interface PatientSectionProps {
  patientId: string;
  hospitalizationOrderId?: string;
  onPatientDataLoaded: (data: any) => void;
  onUpdatePatient?: () => void;
  isLoadingUpdate?: boolean;
  refreshPatientKey?: number;
}

export const PatientSection: React.FC<PatientSectionProps> = ({ 
  patientId, 
  hospitalizationOrderId,
  onPatientDataLoaded,
  onUpdatePatient,
  isLoadingUpdate,
  refreshPatientKey
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Datos del Paciente</h3>
      <div className="bg-white">
        <PatientInfoCard 
          key={refreshPatientKey}
          patientId={patientId} 
          hospitalizationOrderId={hospitalizationOrderId}
          onDataLoaded={onPatientDataLoaded}
          onUpdatePatient={onUpdatePatient}
          isLoadingUpdate={isLoadingUpdate}
          className="bg-white shadow-sm"
        />
      </div>
    </div>
  );
};

export default PatientSection;
