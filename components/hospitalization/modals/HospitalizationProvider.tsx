"use client"

import React from 'react'
import { SegurosProvider } from "@/contexts/SegurosContext"
import { TiposDocumentoProvider } from "@/contexts/TiposDocumentoContext"
import { ServerDateTimeProvider } from "@/contexts/ServerDateTimeContext"
import { OrigenHospitalizacionProvider } from "@/contexts/OrigenHospitalizacionContext"

interface HospitalizationProviderProps {
  children: React.ReactNode
}

/**
 * Provider unificado que proporciona todos los contextos necesarios para hospitalización
 * Se puede usar tanto en modales como en páginas independientes
 * 
 * NOTA: ConsultoriosProvider NO se incluye aquí porque:
 * - Carga automáticamente consultorios de emergencia (TIPO='E')
 * - Los modales de hospitalización cargan consultorios de hospitalización (TIPO='H') bajo demanda
 * - Esto evita llamadas API innecesarias
 */
export function HospitalizationProvider({ children }: HospitalizationProviderProps) {
  return (
    <SegurosProvider>
      <TiposDocumentoProvider>
        <ServerDateTimeProvider>
          <OrigenHospitalizacionProvider>
            {children}
          </OrigenHospitalizacionProvider>
        </ServerDateTimeProvider>
      </TiposDocumentoProvider>
    </SegurosProvider>
  )
}
