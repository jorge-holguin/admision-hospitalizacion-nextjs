"use client"

import React, { useState } from 'react'
import { HospitalizationListModal } from './HospitalizationListModal'
import { HospitalizationRegistrationModal } from './HospitalizationRegistrationModal'
import { HospitalizationViewModal } from './HospitalizationViewModal'

interface HospitalizationMainModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  patientName?: string
}

type ModalStep = 'list' | 'create' | 'view' | 'edit'

export function HospitalizationMainModal({
  isOpen,
  onClose,
  patientId,
  patientName
}: HospitalizationMainModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('list')
  const [selectedHospitalizationId, setSelectedHospitalizationId] = useState<string | null>(null)
  const [selectedHospitalizationData, setSelectedHospitalizationData] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view')

  // Manejar navegación entre modales
  const handleCreateNew = () => {
    setCurrentStep('create')
    setSelectedHospitalizationId(null)
  }

  const handleView = (hospitalizationId: string, hospitalizationData: any) => {
    console.log('🏥 HospitalizationMainModal: Ver hospitalización ID:', hospitalizationId)
    setSelectedHospitalizationId(hospitalizationId)
    // NO pasar hospitalizationData porque viene de la lista y no tiene todos los campos
    // HospitalizationViewModal cargará los datos completos desde la API
    setSelectedHospitalizationData(null)
    setViewMode('view')
    setCurrentStep('view')
  }

  const handleEdit = (hospitalizationId: string, hospitalizationData: any) => {
    console.log('🏥 HospitalizationMainModal: Editar hospitalización ID:', hospitalizationId)
    setSelectedHospitalizationId(hospitalizationId)
    // NO pasar hospitalizationData porque viene de la lista y no tiene todos los campos
    // HospitalizationViewModal cargará los datos completos desde la API
    setSelectedHospitalizationData(null)
    setViewMode('edit')
    setCurrentStep('view')
  }

  const handleBackToList = () => {
    setCurrentStep('list')
    setSelectedHospitalizationId(null)
    setSelectedHospitalizationData(null)
  }

  const handleSuccess = (data: any) => {
    console.log('✅ Operación exitosa en hospitalización:', data)
    // Volver a la lista después de una operación exitosa
    handleBackToList()
  }

  const handleError = (error: string) => {
    console.error('❌ Error en operación de hospitalización:', error)
    // Mantener en el modal actual para que el usuario pueda corregir
  }

  const handleEditFromView = () => {
    setViewMode('edit')
  }

  // Cerrar todos los modales
  const handleCloseAll = () => {
    setCurrentStep('list')
    setSelectedHospitalizationId(null)
    onClose()
  }

  return (
    <>
      {/* Modal de Lista de Hospitalizaciones */}
      {currentStep === 'list' && (
        <HospitalizationListModal
          isOpen={isOpen}
          onClose={handleCloseAll}
          patientId={patientId}
          patientName={patientName}
          onCreateNew={handleCreateNew}
          onView={handleView}
          onEdit={handleEdit}
        />
      )}

      {/* Modal de Registro/Creación */}
      {currentStep === 'create' && (
        <HospitalizationRegistrationModal
          isOpen={isOpen}
          onClose={handleCloseAll}
          patientId={patientId}
          onSuccess={handleSuccess}
          onError={handleError}
          onBack={handleBackToList}
        />
      )}

      {/* Modal de Visualización/Edición */}
      {currentStep === 'view' && selectedHospitalizationId && (
        <HospitalizationViewModal
          isOpen={isOpen}
          onClose={handleCloseAll}
          hospitalizationId={selectedHospitalizationId}
          mode={viewMode}
          initialData={selectedHospitalizationData} // Pasar datos iniciales para evitar llamada duplicada
          onSuccess={handleSuccess}
          onError={handleError}
          onBack={handleBackToList}
          onEdit={handleEditFromView}
        />
      )}
    </>
  )
}
