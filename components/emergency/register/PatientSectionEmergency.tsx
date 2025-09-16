import React from 'react';
import { PatientInfoCardEmergency } from '../PatientInfoCardEmergency';

interface PatientSectionEmergencyProps {
  patientId: string;
  onPatientDataLoaded: (data: any) => void;
}

export const PatientSectionEmergency: React.FC<PatientSectionEmergencyProps> = ({ 
  patientId, 
  onPatientDataLoaded 
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Datos del Paciente</h3>
      <div className="bg-white">
        <PatientInfoCardEmergency 
          patientId={patientId} 
          onDataLoaded={onPatientDataLoaded}
          className="bg-white shadow-sm"
        />
      </div>
    </div>
  );
};

export default PatientSectionEmergency;
