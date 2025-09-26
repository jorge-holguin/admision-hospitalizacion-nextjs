"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { HospitalizationFormRefactored } from "../register/HospitalizationFormRefactored"
import { PatientInfoCard } from "../PatientInfoCard"
import { usePatientData, useFetchPatientData } from "@/contexts/PatientDataContext"

interface HospitalizationRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  hospitalizationId?: string
  hospitalizationData?: any
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  onBack?: () => void
}

export function HospitalizationRegistrationModal({
  isOpen,
  onClose,
  patientId,
  hospitalizationId,
  hospitalizationData,
  onSuccess,
  onError,
  onBack
}: HospitalizationRegistrationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  // Contexto de datos del paciente
  const { getPatientData } = usePatientData()
  const { fetchPatientData, isLoading: patientDataLoading } = useFetchPatientData(patientId)
  
  // Obtener datos del paciente
  const patientData = getPatientData(patientId)

  // Cargar datos del paciente si no están disponibles
  useEffect(() => {
    if (isOpen && patientId && !patientData) {
      console.log('🏥 Cargando datos del paciente para hospitalización:', patientId)
      fetchPatientData()
    }
  }, [isOpen, patientId, patientData, fetchPatientData])

  // Crear paciente mejorado con datos adicionales
  const enhancedPatient = patientData ? {
    ...patientData,
    pacienteId: patientId,
    name: patientData.name || `${patientData.nombres || ''} ${patientData.apellidos || ''}`.trim(),
    documento: patientData.documento || patientData.numeroDocumento || '',
    age: patientData.age || patientData.edad || '',
    sex: patientData.sex || patientData.sexo || '',
    birthDate: patientData.birthDate || patientData.fechaNacimiento || '',
    maritalStatus: patientData.maritalStatus || patientData.estadoCivil || '',
    address: patientData.address || patientData.direccion || '',
    phone: patientData.phone || patientData.telefono || ''
  } : null

  const handleSuccess = (data: any) => {
    console.log('✅ Hospitalización guardada exitosamente:', data)
    setSubmitSuccess(true)
    
    toast({
      title: "¡Éxito!",
      description: hospitalizationId 
        ? "Hospitalización actualizada correctamente" 
        : "Nueva hospitalización registrada correctamente",
      variant: "default",
    })

    // Llamar callback de éxito si existe
    if (onSuccess) {
      onSuccess(data)
    }

    // Cerrar modal después de un breve delay
    setTimeout(() => {
      setSubmitSuccess(false)
      onClose()
    }, 1500)
  }

  const handleError = (error: string) => {
    console.error('❌ Error al guardar hospitalización:', error)
    
    toast({
      title: "Error",
      description: error || "Error al guardar la hospitalización",
      variant: "destructive",
    })

    // Llamar callback de error si existe
    if (onError) {
      onError(error)
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {hospitalizationId ? 'Editar Hospitalización' : 'Nueva Hospitalización'}
            </DialogTitle>
            
            {submitSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">¡Guardado exitosamente!</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
            {/* Patient Info - Left Side */}
            <div className="lg:col-span-1">
              <div className="sticky top-0">
                {patientDataLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : enhancedPatient ? (
                  <PatientInfoCard
                    patientData={enhancedPatient}
                    className="border-0 shadow-none"
                  />
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    No se pudieron cargar los datos del paciente
                  </div>
                )}
              </div>
            </div>
            
            {/* Hospitalization Form - Right Side */}
            <div className="lg:col-span-3">
                <HospitalizationFormRefactored
                  patientId={patientId}
                  hospitalizationId={hospitalizationId}
                  hospitalizationData={hospitalizationData}
                  patient={enhancedPatient}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onBack={onBack}
                  isModal={true}
                  alertsContainerId="alertas-container"
                />
            </div>
          </div>
        </div>

        {/* Container para alertas */}
        <div id="alertas-container" className="fixed top-4 right-4 z-50 space-y-2" />
      </DialogContent>
    </Dialog>
  )
}
