"use client"

import React from 'react'
import { TiposDocumentoProvider } from "@/contexts/TiposDocumentoContext"
import { ServerDateTimeProvider } from "@/contexts/ServerDateTimeContext"
import { OrigenHospitalizacionProvider } from "@/contexts/OrigenHospitalizacionContext"
import { PatientAccountProvider } from "@/contexts/PatientAccountContext"

interface HospitalizationProviderProps {
  children: React.ReactNode
}

/**
 * Provider unificado que proporciona todos los contextos necesarios para hospitalización
 * Se puede usar tanto en modales como en páginas independientes
 * 
 * NOTA: SegurosProvider NO se incluye aquí porque:
 * - HospitalizationModalProvider ya envuelve con SegurosCitaProvider
 * - Esto evita llamadas API duplicadas a /api/appointments/insurances
 * 
 * NOTA: ConsultoriosProvider NO se incluye aquí porque:
 * - Carga automáticamente consultorios de emergencia (TIPO='E')
 * - Los modales de hospitalización cargan consultorios de hospitalización (TIPO='H') bajo demanda
 * - Esto evita llamadas API innecesarias
 */
export function HospitalizationProvider({ children }: HospitalizationProviderProps) {
  return (
    <PatientAccountProvider>
      <TiposDocumentoProvider>
        <ServerDateTimeProvider>
          <OrigenHospitalizacionProvider>
            {children}
          </OrigenHospitalizacionProvider>
        </ServerDateTimeProvider>
      </TiposDocumentoProvider>
    </PatientAccountProvider>
  )
}
