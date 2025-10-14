"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

// Interface for patient data
export interface PatientData {
  hc: string // Historia Clínica
  name: string // Full patient name
  documento?: string // Document number (optional)
  pacienteId?: string // Patient ID (optional)
  FECHA_NACIMIENTO?: string // Birth date from filiation API (YYYY-MM-DD)
  fechaNacimiento?: string // Alias for birth date
  [key: string]: any // Allow additional fields from filiation
}

// Interface for the context
interface PatientContextType {
  patientData: PatientData | null
  setPatientData: (data: PatientData | null) => void
  clearPatientData: () => void
}

// Create the context
const PatientContext = createContext<PatientContextType | undefined>(undefined)

// Provider component
export function PatientProvider({ children }: { children: ReactNode }) {
  const [patientData, setPatientData] = useState<PatientData | null>(null)

  const clearPatientData = () => {
    setPatientData(null)
  }

  const value: PatientContextType = {
    patientData,
    setPatientData,
    clearPatientData
  }

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  )
}

// Custom hook to use the patient context
export function usePatient() {
  const context = useContext(PatientContext)
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider')
  }
  return context
}
