"use client"

import React from 'react'
import { HospitalizationProvider } from "./HospitalizationProvider"
import { ConsultoriosProvider } from "@/contexts/ConsultoriosContext"
import { HospitalizationMainModal } from './HospitalizationMainModal'

interface HospitalizationModalProviderProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  patientName?: string
}

/**
 * Wrapper que proporciona todos los contextos necesarios para los modales de hospitalización
 * Solo carga los contextos cuando el modal está abierto para evitar llamadas API innecesarias
 * 
 * NOTA: ConsultoriosProvider se incluye aquí para que esté disponible,
 * pero los consultorios de hospitalización (TIPO='H') se cargan bajo demanda
 * en cada modal que los necesite
 */
export function HospitalizationModalProvider({
  isOpen,
  onClose,
  patientId,
  patientName
}: HospitalizationModalProviderProps) {
  // Solo renderizar los providers cuando el modal esté abierto
  if (!isOpen) {
    return (
      <HospitalizationMainModal
        isOpen={isOpen}
        onClose={onClose}
        patientId={patientId}
        patientName={patientName}
      />
    )
  }

  return (
    <ConsultoriosProvider>
      <HospitalizationProvider>
        <HospitalizationMainModal
          isOpen={isOpen}
          onClose={onClose}
          patientId={patientId}
          patientName={patientName}
        />
      </HospitalizationProvider>
    </ConsultoriosProvider>
  )
}
