"use client"

import React from 'react'
import { SegurosProvider } from "@/contexts/SegurosContext"
import { MedicosProvider } from "@/contexts/MedicosContext"
import { ConsultoriosProvider } from "@/contexts/ConsultoriosContext"
import { TiposDocumentoProvider } from "@/contexts/TiposDocumentoContext"
import { ServerDateTimeProvider } from "@/contexts/ServerDateTimeContext"
import { MotivosEmergenciaProvider } from "@/contexts/MotivosEmergenciaContext"
import { FormasIngresoProvider } from "@/contexts/FormasIngresoContext"

interface EmergencyProviderProps {
  children: React.ReactNode
}

/**
 * Provider unificado que proporciona todos los contextos necesarios para emergencias
 * Se puede usar tanto en modales como en páginas independientes
 */
export function EmergencyProvider({ children }: EmergencyProviderProps) {
  return (
    <SegurosProvider>
      <MedicosProvider>
        <ConsultoriosProvider>
          <TiposDocumentoProvider>
            <ServerDateTimeProvider>
              <MotivosEmergenciaProvider>
                <FormasIngresoProvider>
                  {children}
                </FormasIngresoProvider>
              </MotivosEmergenciaProvider>
            </ServerDateTimeProvider>
          </TiposDocumentoProvider>
        </ConsultoriosProvider>
      </MedicosProvider>
    </SegurosProvider>
  )
}
