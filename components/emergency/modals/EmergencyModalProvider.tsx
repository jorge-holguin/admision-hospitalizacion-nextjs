"use client"

import React from 'react'
import { EmergencyProvider } from "@/contexts/EmergencyProvider"
import { SegurosCitaProvider } from "@/contexts/SegurosCitaContext"
import { EmergencyMainModal } from './EmergencyMainModal'

interface EmergencyModalProviderProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  patientName?: string
}

/**
 * Wrapper que proporciona todos los contextos necesarios para los modales de emergencia
 * Solo carga los contextos cuando el modal está abierto para evitar llamadas API innecesarias
 */
export function EmergencyModalProvider({
  isOpen,
  onClose,
  patientId,
  patientName
}: EmergencyModalProviderProps) {
  // Solo renderizar los providers cuando el modal esté abierto
  if (!isOpen) {
    return (
      <EmergencyMainModal
        isOpen={isOpen}
        onClose={onClose}
        patientId={patientId}
        patientName={patientName}
      />
    )
  }

  return (
    <SegurosCitaProvider>
      <EmergencyProvider>
        <EmergencyMainModal
          isOpen={isOpen}
          onClose={onClose}
          patientId={patientId}
          patientName={patientName}
        />
      </EmergencyProvider>
    </SegurosCitaProvider>
  )
}
