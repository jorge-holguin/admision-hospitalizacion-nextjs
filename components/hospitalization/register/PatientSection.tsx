import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <PatientInfoCard 
            patientId={patientId} 
            onDataLoaded={onPatientDataLoaded}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientSection;
