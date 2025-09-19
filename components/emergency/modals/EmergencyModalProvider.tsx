"use client"

import React from 'react'
import { SegurosProvider } from "@/contexts/SegurosContext"
import { MedicosProvider } from "@/contexts/MedicosContext"
import { ConsultoriosProvider } from "@/contexts/ConsultoriosContext"
import { TiposDocumentoProvider } from "@/contexts/TiposDocumentoContext"
import { ServerDateTimeProvider } from "@/contexts/ServerDateTimeContext"
import { MotivosEmergenciaProvider } from "@/contexts/MotivosEmergenciaContext"
import { FormasIngresoProvider } from "@/contexts/FormasIngresoContext"
import { EmergencyMainModal } from './EmergencyMainModal'

interface EmergencyModalProviderProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
}

/**
 * Wrapper que proporciona todos los contextos necesarios para los modales de emergencia
 * Solo carga los contextos cuando el modal está abierto para evitar llamadas API innecesarias
 */
export function EmergencyModalProvider({
  isOpen,
  onClose,
  patientId
}: EmergencyModalProviderProps) {
  // Solo renderizar los providers cuando el modal esté abierto
  if (!isOpen) {
    return (
      <EmergencyMainModal
        isOpen={isOpen}
        onClose={onClose}
        patientId={patientId}
      />
    )
  }

  return (
    <SegurosProvider>
      <MedicosProvider>
        <ConsultoriosProvider>
          <TiposDocumentoProvider>
            <ServerDateTimeProvider>
              <MotivosEmergenciaProvider>
                <FormasIngresoProvider>
                  <EmergencyMainModal
                    isOpen={isOpen}
                    onClose={onClose}
                    patientId={patientId}
                  />
                </FormasIngresoProvider>
              </MotivosEmergenciaProvider>
            </ServerDateTimeProvider>
          </TiposDocumentoProvider>
        </ConsultoriosProvider>
      </MedicosProvider>
    </SegurosProvider>
  )
}
