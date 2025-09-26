"use client"

import React from 'react'
import { SegurosProvider } from "@/contexts/SegurosContext"
import { MedicosProvider } from "@/contexts/MedicosContext"
import { ConsultoriosProvider } from "@/contexts/ConsultoriosContext"
import { TiposDocumentoProvider } from "@/contexts/TiposDocumentoContext"
import { ServerDateTimeProvider } from "@/contexts/ServerDateTimeContext"
import { OrigenHospitalizacionProvider } from "@/contexts/OrigenHospitalizacionContext"
import { DiagnosticosProvider } from "@/contexts/DiagnosticosContext"

interface HospitalizationProviderProps {
  children: React.ReactNode
}

/**
 * Provider unificado que proporciona todos los contextos necesarios para hospitalización
 * Se puede usar tanto en modales como en páginas independientes
 */
export function HospitalizationProvider({ children }: HospitalizationProviderProps) {
  return (
    <SegurosProvider>
      <MedicosProvider>
        <ConsultoriosProvider>
          <TiposDocumentoProvider>
            <ServerDateTimeProvider>
              <OrigenHospitalizacionProvider>
                <DiagnosticosProvider>
                  {children}
                </DiagnosticosProvider>
              </OrigenHospitalizacionProvider>
            </ServerDateTimeProvider>
          </TiposDocumentoProvider>
        </ConsultoriosProvider>
      </MedicosProvider>
    </SegurosProvider>
  )
}
