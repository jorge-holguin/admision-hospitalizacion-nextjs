"use client"

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConsultorioSelector } from '@/components/hospitalization/ConsultorioSelector'
import { MedicoSelector } from '@/components/hospitalization/MedicoSelector'
import { DiagnosticoSelector } from '@/components/hospitalization/DiagnosticoSelector'
import { SeguroSelector } from '@/components/hospitalization/SeguroSelector'
import { OrigenSelector } from '@/components/hospitalization/OrigenSelector'
import { ProcedenciaSelector } from '@/components/hospitalization/ProcedenciaSelector'

interface HospitalizationInfoProps {
  formData: any;
  setFormData: (data: any) => void;
  isEditable: boolean;
  fieldsLocked: boolean;
}

export function HospitalizationInfo({ formData, setFormData, isEditable, fieldsLocked }: HospitalizationInfoProps) {
  // Estado para manejar la procedencia seleccionada
  // Usar el valor de origin de la API como valor inicial
  const [procedencia, setProcedencia] = useState<string>(formData.origin || 'EM');
  
  // Efecto para actualizar el formData cuando cambia la procedencia
  useEffect(() => {
    // Solo actualizamos si hay un cambio real de procedencia y no es la carga inicial
    if (formData.procedencia && procedencia !== formData.procedencia) {
      setFormData({
        ...formData,
        procedencia,
        hospitalizationId: '', // Limpiamos el código de origen solo cuando hay un cambio manual
        origin: procedencia // Actualizamos también el campo origin para mantener consistencia
      });
    } else if (!formData.procedencia && procedencia) {
      // En la carga inicial, solo actualizamos procedencia sin limpiar hospitalizationId
      setFormData({
        ...formData,
        procedencia
      });
    }
  }, [procedencia, formData, setFormData]);
  
  // Determinar si el campo de código de origen debe estar deshabilitado
  const isOrigenDisabled = procedencia === 'RN' || fieldsLocked || !isEditable;
  
  // Obtener el texto de procedencia para mostrar
  const getProcedenciaText = () => {
    switch(procedencia) {
      case 'EM': return 'EM - Emergencia';
      case 'CE': return 'CE - Consulta Externa';
      case 'RN': return 'RN - Recién Nacido';
      default: return procedencia;
    }
  };
  
  return (
    <>
      <h3 className="text-lg font-semibold mb-4">Datos de Hospitalización</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-gray-100 p-4 rounded-lg border border-gray-200">
        {/* Columna izquierda */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="procedencia" className="text-sm font-semibold text-black-600">
              Procedencia del Paciente <span className="text-red-500">*</span>
            </Label>
            {isEditable ? (
              <ProcedenciaSelector
                value={procedencia}
                onChange={(value) => setProcedencia(value)}
                disabled={fieldsLocked}
                className="w-full"
              />
            ) : (
              <Input
                id="procedencia"
                value={getProcedenciaText()}
                readOnly
                disabled={true}
                className="w-full font-medium"
              />
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="consultorio" className="text-sm font-semibold text-black-600">
              Hospitalizado en <span className="text-red-500">*</span>
            </Label>
            {isEditable ? (
              <ConsultorioSelector
                value={`${formData.consultorio} - ${formData.consultorioName}`}
                onChange={(value) => {
                  const parts = value.split(' - ');
                  setFormData({
                    ...formData,
                    consultorio: parts[0],
                    consultorioName: parts.length > 1 ? parts[1] : ''
                  });
                }}
                disabled={fieldsLocked}
                className="w-full"
              />
            ) : (
              <Input
                id="consultorio"
                value={`${formData.consultorio} - ${formData.consultorioName}`}
                readOnly
                disabled={fieldsLocked}
                className="w-full font-medium"
              />
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seguro" className="text-sm font-semibold text-black-600">
              Financiamiento <span className="text-red-500">*</span>
            </Label>
            {isEditable ? (
              <SeguroSelector
                value={`${formData.seguro} - ${formData.seguroName}`}
                onChange={(value) => {
                  const parts = value.split(' - ');
                  setFormData({
                    ...formData,
                    seguro: parts[0],
                    seguroName: parts.length > 1 ? parts[1] : ''
                  });
                }}
                disabled={fieldsLocked}
                className="w-full"
              />
            ) : (
              <Input
                id="seguro"
                value={`${formData.seguro} - ${formData.seguroName}`}
                readOnly
                disabled={true}
                className="w-full font-medium"
              />
            )}
          </div>
        </div>
        
        {/* Columna derecha */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="origen" className="text-sm font-semibold text-black-600">
              Código de Origen de Atención <span className="text-red-500">*</span>
            </Label>
            {isEditable && !isOrigenDisabled ? (
              <OrigenSelector
                value={formData.hospitalizationId || ''}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    hospitalizationId: value
                  });
                }}
                disabled={isOrigenDisabled}
                origenFilter={procedencia} // Filtrar por procedencia seleccionada
                patientId={formData.patientId} // Pasar el ID del paciente
                className="w-full"
              />
            ) : (
              <Input
                id="origen"
                value={formData.hospitalizationId || ''}
                readOnly
                disabled={true}
                className="w-full font-medium"
              />
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="medico" className="text-sm font-semibold text-black-600">
              Médico que autoriza la Hospitalización <span className="text-red-500">*</span>
            </Label>
            {isEditable ? (
              <MedicoSelector
                value={`${formData.medico} - ${formData.medicoName}`}
                onChange={(value, medicoData) => {
                  const parts = value.split(' - ');
                  setFormData({
                    ...formData,
                    medico: parts[0],
                    medicoName: parts.length > 1 ? parts[1] : ''
                  });
                }}
                disabled={fieldsLocked}
                className="w-full"
              />
            ) : (
              <Input
                id="medico"
                value={`${formData.medico} - ${formData.medicoName}`}
                readOnly
                disabled={fieldsLocked}
                className="w-full font-medium"
              />
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="diagnostico" className="text-sm font-semibold text-black-600">
              Diagnóstico <span className="text-red-500">*</span>
            </Label>
            {isEditable ? (
              <DiagnosticoSelector
                value={formData.diagnostico}
                onChange={(value, diagnosticoData) => {
                  setFormData({
                    ...formData,
                    diagnostico: value
                  });
                }}
                disabled={fieldsLocked}
                origenId={procedencia} // Usar la procedencia como origenId
                className="w-full"
              />
            ) : (
              <Input
                id="diagnostico"
                value={formData.diagnostico}
                readOnly
                disabled={fieldsLocked}
                className="w-full font-medium"
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Mensaje informativo */}
      <div className="flex items-center mt-6 mb-2 text-sm text-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>El Código de Origen de Atención no es requerido si la procedencia es "RN".</span>
      </div>
    </>
  );
}
