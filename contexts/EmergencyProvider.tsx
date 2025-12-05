"use client"

import React from 'react'
import { SegurosProvider } from "@/contexts/SegurosContext"
import { MedicosProvider } from "@/contexts/MedicosContext"
import { ConsultoriosProvider } from "@/contexts/ConsultoriosContext"
import { ServerDateTimeProvider } from "@/contexts/ServerDateTimeContext"
import { MotivosEmergenciaProvider } from "@/contexts/MotivosEmergenciaContext"
import { FormasIngresoProvider } from "@/contexts/FormasIngresoContext"

interface EmergencyProviderProps {
  children: React.ReactNode
}

/**
 * Provider unificado que proporciona todos los contextos necesarios para emergencias
 * Nota: TipoDocumentoProvider ya está disponible globalmente en layout.tsx
 */
export function EmergencyProvider({ children }: EmergencyProviderProps) {
  return (
    <SegurosProvider>
      <MedicosProvider>
        <ConsultoriosProvider>
          <ServerDateTimeProvider>
            <MotivosEmergenciaProvider>
              <FormasIngresoProvider>
                {children}
              </FormasIngresoProvider>
            </MotivosEmergenciaProvider>
          </ServerDateTimeProvider>
        </ConsultoriosProvider>
      </MedicosProvider>
    </SegurosProvider>
  )
}
