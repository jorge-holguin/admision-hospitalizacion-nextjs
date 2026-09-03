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
  patientName?: string
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
  patientId,
  patientName
}: EmergencyMainModalProps) {  const { patientData } = usePatient()
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
    setCurrentStep('view') // Usar 'view' como en hospitalización
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
    // No cambiar currentStep, solo el viewMode
  }

  // Validar que tenemos el patientId
  if (!patientId) {
    console.warn('🚑 [EmergencyMainModal] missing patientId, returning null')
    return null
  }

  return (
    <>
      {/* Modal de Lista de Emergencias */}
      {currentStep === 'list' && (
        <EmergencyListModal
          isOpen={isOpen}
          onClose={handleClose}
          patientId={patientId}
          patientName={patientName}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onView={handleView}
        />
      )}

      {/* Modal de Registro/Creación */}
      {currentStep === 'create' && (
        <EmergencyRegistrationModal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBackToList}
          patient={patientData}
          patientId={patientId}
          onSuccess={handleCreateSuccess}
          onError={handleCreateError}
        />
      )}

      {/* Modal de Vista/Edición - Ambos modos usan EmergencyViewModal */}
      {(currentStep === 'view' || currentStep === 'edit') && selectedEmergencyId && (
        <EmergencyViewModal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBackToList}
          emergencyId={selectedEmergencyId}
          mode={viewMode}
          onModeChange={handleModeChange}
          onSuccess={(data) => {
            toast({
              title: "Emergencia actualizada",
              description: "Se ha actualizado la emergencia correctamente",
              variant: "default"
            })
            // Volver a la lista después de mostrar el toast
            handleBackToList()
          }}
          onError={handleCreateError}
        />
      )}
    </>
  )
}
