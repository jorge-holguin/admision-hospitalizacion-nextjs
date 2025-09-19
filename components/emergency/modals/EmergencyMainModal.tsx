"use client"

import React, { useState } from 'react'
import { EmergencyListModal } from './EmergencyListModal'
import { EmergencyRegistrationModal } from './EmergencyRegistrationModal'
import { EmergencyViewModal } from './EmergencyViewModal'
import { usePatient } from "@/contexts/PatientContext"
import { toast } from "@/components/ui/use-toast"

interface EmergencyMainModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
}

type ModalStep = 'list' | 'create' | 'edit' | 'view'

interface EmergencyData {
  EMERGENCIA_ID: string;
  PACIENTE: string;
  FECHA: string;
  HORA: string;
  CONSULTORIO: string;
  MOTIVO_EMERGENCIA: string;
  MOTIVO_DESCRIPCION?: string;
  CIEX1?: string;
  MEDICO?: string;
  RELATO?: string;
  DIAGNOSTICO_DESCRIPCION?: string;
  CONSULTORIO_DESCRIPCION?: string;
  ESTADO: string;
  RowNum?: string;
}

export function EmergencyMainModal({
  isOpen,
  onClose,
  patientId
}: EmergencyMainModalProps) {
  const { patientData } = usePatient()
  const [currentStep, setCurrentStep] = useState<ModalStep>('list')
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(null)
  const [selectedEmergencyData, setSelectedEmergencyData] = useState<EmergencyData | null>(null)
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view')

  const handleClose = () => {
    // Reset state when closing
    setCurrentStep('list')
    setSelectedEmergencyId(null)
    setSelectedEmergencyData(null)
    setViewMode('view')
    onClose()
  }

  const handleCreateNew = () => {
    setCurrentStep('create')
  }

  const handleEdit = (emergencyId: string, emergencyData: EmergencyData) => {
    setSelectedEmergencyId(emergencyId)
    setSelectedEmergencyData(emergencyData)
    setViewMode('edit')
    setCurrentStep('edit')
  }

  const handleView = (emergencyId: string, emergencyData: EmergencyData) => {
    setSelectedEmergencyId(emergencyId)
    setSelectedEmergencyData(emergencyData)
    setViewMode('view')
    setCurrentStep('view')
  }

  const handleBackToList = () => {
    setCurrentStep('list')
    setSelectedEmergencyId(null)
    setSelectedEmergencyData(null)
    setViewMode('view')
  }

  const handleCreateSuccess = (data: any) => {
    toast({
      title: "Emergencia creada",
      description: "Se ha creado la emergencia correctamente",
      variant: "default"
    })
    // Volver a la lista para ver la nueva emergencia
    handleBackToList()
  }

  const handleCreateError = (error: string) => {
    toast({
      title: "Error al crear emergencia",
      description: error,
      variant: "destructive"
    })
  }

  const handleModeChange = (mode: 'view' | 'edit') => {
    setViewMode(mode)
    if (mode === 'edit') {
      setCurrentStep('edit')
    } else {
      setCurrentStep('view')
    }
  }

  // Validar que tenemos el patientId
  if (!patientId) {
    return null
  }

  return (
    <>
      {/* Modal de Lista de Emergencias */}
      <EmergencyListModal
        isOpen={isOpen && currentStep === 'list'}
        onClose={handleClose}
        patientId={patientId}
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onView={handleView}
      />

      {/* Modal de Registro/Creación */}
      <EmergencyRegistrationModal
        isOpen={isOpen && currentStep === 'create'}
        onClose={handleClose}
        onBack={handleBackToList}
        patient={patientData}
        patientId={patientId}
        onSuccess={handleCreateSuccess}
        onError={handleCreateError}
      />

      {/* Modal de Vista/Edición */}
      {selectedEmergencyId && (
        <>
          {currentStep === 'edit' && (
            <EmergencyRegistrationModal
              isOpen={isOpen && currentStep === 'edit'}
              onClose={handleClose}
              onBack={handleBackToList}
              patient={patientData}
              patientId={patientId}
              emergencyId={selectedEmergencyId}
              emergencyData={selectedEmergencyData}
              onSuccess={(data) => {
                toast({
                  title: "Emergencia actualizada",
                  description: "Se ha actualizado la emergencia correctamente",
                  variant: "default"
                })
                handleBackToList()
              }}
              onError={handleCreateError}
            />
          )}

          {currentStep === 'view' && (
            <EmergencyViewModal
              isOpen={isOpen && currentStep === 'view'}
              onClose={handleClose}
              onBack={handleBackToList}
              emergencyId={selectedEmergencyId}
              mode={viewMode}
              onModeChange={handleModeChange}
            />
          )}
        </>
      )}
    </>
  )
}
