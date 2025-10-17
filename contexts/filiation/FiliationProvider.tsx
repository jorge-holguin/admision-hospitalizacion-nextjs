"use client"

import React, { ReactNode } from 'react'
import { ReligionProvider } from './ReligionContext'
import { EtniaProvider } from './EtniaContext'
import { OcupacionProvider } from './OcupacionContext'
import { EstadoCivilProvider } from './EstadoCivilContext'
import { GradoInstruccionProvider } from './GradoInstruccionContext'
import { PaisProvider } from './PaisContext'
import { SegurosProvider } from '../SegurosContext'

interface FiliationProviderProps {
  children: ReactNode
}

/**
 * Provider unificado para el módulo de filiación
 * Centraliza todos los contextos necesarios para evitar llamadas API duplicadas
 */
export function FiliationProvider({ children }: FiliationProviderProps) {
  return (
    <SegurosProvider>
      <ReligionProvider>
        <EtniaProvider>
          <OcupacionProvider>
            <EstadoCivilProvider>
              <GradoInstruccionProvider>
                <PaisProvider>
                  {children}
                </PaisProvider>
              </GradoInstruccionProvider>
            </EstadoCivilProvider>
          </OcupacionProvider>
        </EtniaProvider>
      </ReligionProvider>
    </SegurosProvider>
  )
}
