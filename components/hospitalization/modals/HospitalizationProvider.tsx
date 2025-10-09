"use client"

import React from 'react'
import { SegurosProvider } from "@/contexts/SegurosContext"
import { ConsultoriosProvider } from "@/contexts/ConsultoriosContext"
import { TiposDocumentoProvider } from "@/contexts/TiposDocumentoContext"
import { ServerDateTimeProvider } from "@/contexts/ServerDateTimeContext"
import { OrigenHospitalizacionProvider } from "@/contexts/OrigenHospitalizacionContext"

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
      <ConsultoriosProvider>
        <TiposDocumentoProvider>
          <ServerDateTimeProvider>
            <OrigenHospitalizacionProvider>
                {children}
            </OrigenHospitalizacionProvider>
          </ServerDateTimeProvider>
        </TiposDocumentoProvider>
      </ConsultoriosProvider>
    </SegurosProvider>
  )
}
