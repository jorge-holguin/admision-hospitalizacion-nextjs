"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { EmergencyFormRefactored } from "../register/EmergencyFormRefactored"
import { PatientInfoCardEmergency } from "../PatientInfoCardEmergency"
import { usePatientData, useFetchPatientData } from "@/contexts/PatientDataContext"
import { useConsultorios } from "@/contexts/ConsultoriosContext"

interface EmergencyRegistrationModalProps {
  isOpen?: boolean
  patient: any
  patientId: string
  onClose: () => void
  onBack?: () => void
  emergencyId?: string | null
  emergencyData?: any
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function EmergencyRegistrationModal({
  isOpen = true,
  patient,
  patientId,
  onClose,
  onBack,
  emergencyId,
  emergencyData,
  onSuccess,
  onError
}: EmergencyRegistrationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [currentEmergencyId, setCurrentEmergencyId] = useState<string>(emergencyId || "")

  // Usar el contexto de datos del paciente
  const { getPatientData } = usePatientData()
  const { fetchPatientData, isLoading: isLoadingPatientData } = useFetchPatientData(patientId)
  
  // Contexto de consultorios
  const { consultorios, loadConsultoriosEmergencia } = useConsultorios()
  
  const [enhancedPatient, setEnhancedPatient] = useState<any>(null)

  // Cargar consultorios de emergencia cuando se abre el modal
  useEffect(() => {
    if (isOpen && consultorios.length === 0) {
      console.log('🏥 Cargando consultorios de emergencia...')
      loadConsultoriosEmergencia()
    }
  }, [isOpen, consultorios.length, loadConsultoriosEmergencia])

  // Cargar datos del paciente desde PatientDataContext
  useEffect(() => {
    const loadPatientData = async () => {
      console.log('🔍 Cargando datos del paciente desde PatientDataContext para ID:', patientId)
      
      // Primero intentar obtener datos del contexto PatientDataContext
      let patientInfo = getPatientData(patientId)
      
      if (!patientInfo) {
        // Si no está en el contexto, hacer la llamada a la API para obtener datos completos
        console.log('📡 Obteniendo datos desde la API de filiación...')
        patientInfo = await fetchPatientData()
      }
      
      if (patientInfo) {
        console.log('✅ Datos completos del paciente cargados desde PatientDataContext:', patientInfo)
        setEnhancedPatient(patientInfo)
      } else if (patient) {
        // Fallback a los datos proporcionados como prop
        console.log('⚠️ Usando datos proporcionados como prop')
        setEnhancedPatient(patient)
      }
    }
    
    if (isOpen) {
      loadPatientData()
    }
  }, [patientId, isOpen, getPatientData, fetchPatientData, patient])

  const handleEmergencySuccess = (emergencyData: any) => {
    setCurrentEmergencyId(emergencyData.id || emergencyData.EMERGENCIA || 'N/A')
    setShowSuccess(true)
    
    toast({
      title: "¡Registro exitoso!",
      description: `Se ha registrado la emergencia correctamente. ID: ${emergencyData.id || emergencyData.EMERGENCIA || 'N/A'}`,
      variant: "default"
    })

    // Auto-close after 3 seconds
    setTimeout(() => {
      onClose()
    }, 3000)
  }

  const handleEmergencyError = (error: string) => {
    toast({
      title: "Error en el registro",
      description: error,
      variant: "destructive"
    })
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-700 mb-2">
            ¡Registro Exitoso!
          </h2>
          <p className="text-gray-600 mb-4">
            La emergencia se ha registrado correctamente
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>ID de Emergencia:</strong> {emergencyId}
            </p>
            <p className="text-sm text-green-800">
              <strong>Paciente:</strong> {enhancedPatient?.NOMBRES || patient?.NOMBRES}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <Button 
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700"
          >
            Cerrar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-7xl max-h-[95vh] h-[95vh] p-0 flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center space-x-2">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle className="text-lg font-semibold text-red-700">
                {emergencyId ? 'Editar Emergencia' : 'Registro de Emergencia'}
              </DialogTitle>
              <p className="text-sm text-gray-600">
                Complete los datos para {emergencyId ? 'actualizar' : 'registrar'} la emergencia
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Alertas y validaciones - Fuera de los bloques */}
          <div className="mb-6">
            {/* Aquí se mostrarán las alertas de validación de cuenta */}
            <div id="alertas-container"></div>
          </div>

          {/* Grid con los dos bloques alineados */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Patient Info Card - Left Side */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-md shadow-sm h-full">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold">Datos del Paciente</h3>
                </div>
                <div className="p-4">
                  <PatientInfoCardEmergency
                    patientId={patientId}
                    patient={enhancedPatient}
                    className="border-0 shadow-none"
                  />
                </div>
              </div>
            </div>
            
            {/* Emergency Form - Right Side */}
            <div className="lg:col-span-3">
                <EmergencyFormRefactored
                  patientId={patientId}
                  emergencyId={emergencyId}
                  emergencyData={emergencyData}
                  patient={enhancedPatient}
                  onSuccess={onSuccess}
                  onError={onError}
                  onBack={onBack}
                  isModal={true}
                  alertsContainerId="alertas-container"
                />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
