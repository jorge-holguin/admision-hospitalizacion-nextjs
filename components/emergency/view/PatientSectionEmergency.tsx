import React from 'react';
import { PatientInfoCardEmergency } from '../PatientInfoCardEmergency';
import { usePatientData } from '@/contexts/PatientDataContext';

interface PatientSectionEmergencyProps {
  patientId: string;
  onPatientDataLoaded: (data: any) => void;
  onUpdatePatient?: () => void;
  isLoadingUpdate?: boolean;
}

export const PatientSectionEmergency: React.FC<PatientSectionEmergencyProps> = ({ 
  patientId, 
  onPatientDataLoaded,
  onUpdatePatient,
  isLoadingUpdate
}) => {
  // Use the patient data context to check if we already have the data
  const { getPatientData } = usePatientData();
  
  // Check if we already have the patient data in context
  React.useEffect(() => {
    const existingData = getPatientData(patientId);
    if (existingData && onPatientDataLoaded) {
      // If we already have the data, notify the parent component immediately
      onPatientDataLoaded(existingData);
    }
  }, [patientId, getPatientData, onPatientDataLoaded]);
  
  return (
    <div className="mb-6" data-testid="patient-section-emergency">
      <h3 className="text-lg font-semibold mb-4">Datos del Paciente</h3>
      <div className="bg-white">
        <PatientInfoCardEmergency 
          patientId={patientId} 
          onDataLoaded={onPatientDataLoaded}
          onUpdatePatient={onUpdatePatient}
          isLoadingUpdate={isLoadingUpdate}
          className="bg-white shadow-sm"
        />
      </div>
    </div>
  );
};

export default PatientSectionEmergency;
