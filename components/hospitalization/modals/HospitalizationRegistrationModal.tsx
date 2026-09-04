"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, Loader2, Edit } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { HospitalizationFormRefactored } from "../register/HospitalizationFormRefactored"
import { PatientInfoCard } from "../PatientInfoCard"
import { usePatientData, useFetchPatientData } from "@/contexts/PatientDataContext"
import { useConsultorios } from "@/contexts/ConsultoriosContext"
import { ErrorAlert } from "@/components/ui/error-alert"
import { PatientEditModal } from "@/components/filiation/modals/PatientEditModal"
import { EstadoCivilProvider } from "@/contexts/filiation/EstadoCivilContext"
import { PaisProvider } from "@/contexts/filiation/PaisContext"
import { EtniaProvider } from "@/contexts/filiation/EtniaContext"
import { ReligionProvider } from "@/contexts/filiation/ReligionContext"
import { OcupacionProvider } from "@/contexts/filiation/OcupacionContext"
import { GradoInstruccionProvider } from "@/contexts/filiation/GradoInstruccionContext"

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [showPatientEditModal, setShowPatientEditModal] = useState(false)
  const [isLoadingFullPatient, setIsLoadingFullPatient] = useState(false)
  const [fullPatientData, setFullPatientData] = useState<any>(null)
  const [refreshPatientKey, setRefreshPatientKey] = useState(0)
  
  // Contexto de datos del paciente
  const { getPatientData } = usePatientData()
  const { fetchPatientData, refetchPatientData, isLoading: patientDataLoading } = useFetchPatientData(patientId)
  
  // Contexto de consultorios
  const { consultoriosHospitalizacion, loadConsultoriosHospitalizacion } = useConsultorios()
  
  // Obtener datos del paciente
  const patientData = getPatientData(patientId)

  // Cargar datos del paciente si no están disponibles
  useEffect(() => {
    if (isOpen && patientId && !patientData) {
      fetchPatientData()
    }
  }, [isOpen, patientId, patientData, fetchPatientData])

  // Cargar consultorios de hospitalización cuando se abre el modal
  useEffect(() => {
    if (isOpen && consultoriosHospitalizacion.length === 0) {
      loadConsultoriosHospitalizacion()
    }
  }, [isOpen, consultoriosHospitalizacion.length, loadConsultoriosHospitalizacion])

  // Crear paciente mejorado con datos adicionales
  const enhancedPatient = patientData ? {
    ...patientData,
    pacienteId: patientId,
    name: patientData.name || `${patientData.nombres || ''} ${patientData.apellidos || ''}`.trim(),
    documento: patientData.documento || patientData.numeroDocumento || '',
    age: patientData.age || patientData.edad || patientData.EDAD || '',
    EDAD: patientData.EDAD || patientData.edad || '', // Asegurar campo EDAD en mayúsculas
    sex: patientData.sex || patientData.sexo || '',
    birthDate: patientData.birthDate || patientData.fechaNacimiento || patientData.FECHA_NACIMIENTO || '',
    FECHA_NACIMIENTO: patientData.FECHA_NACIMIENTO || patientData.fechaNacimiento || '', // Asegurar campo FECHA_NACIMIENTO en mayúsculas
    fechaNacimiento: patientData.fechaNacimiento || patientData.FECHA_NACIMIENTO || '', // Asegurar alias minúscula
    maritalStatus: patientData.maritalStatus || patientData.estadoCivil || '',
    address: patientData.address || patientData.direccion || '',
    phone: patientData.phone || patientData.telefono || ''
  } : null

  const handleSuccess = (data: any) => {
    setSubmitSuccess(true)
    
    toast({
      title: "¡Éxito!",
      description: hospitalizationId 
        ? "Hospitalización actualizada correctamente" 
        : "Nueva hospitalización registrada correctamente",
      variant: "default",
    })

    // Llamar callback de éxito si existe
    // El padre (HospitalizationMainModal) se encargará de volver a la lista
    if (onSuccess) {
      onSuccess(data)
    }

    // Limpiar estado de éxito después de un breve delay
    // NO cerramos el modal aquí porque el padre maneja la navegación
    setTimeout(() => {
      setSubmitSuccess(false)
    }, 1500)
  }

  const handleError = (error: string) => {
    console.error('❌ Error al guardar hospitalización:', error)
    
    // Mostrar alerta grande y visible
    setErrorMessage(error || "Error al guardar la hospitalización")
    setShowErrorAlert(true)
    
    // También mostrar toast como respaldo
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

  const handleCloseErrorAlert = () => {
    setShowErrorAlert(false)
    setErrorMessage(null)
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-7xl max-h-[95vh] flex flex-col overflow-hidden p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
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
                <DialogTitle className="text-lg font-bold text-blue-600">
                  {hospitalizationId ? 'Editar Hospitalización' : 'Registro de Hospitalización'}
                </DialogTitle>
              </div>
              <p className="text-sm text-gray-600 mt-1 ml-10">
                {hospitalizationId 
                  ? 'Modifique los datos de la hospitalización' 
                  : 'Complete los datos para registrar la hospitalización'}
              </p>
            </div>
            
            {submitSuccess && (
              <div className="flex flex-wrap items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">¡Guardado exitosamente!</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {/* Hospitalization Form - Full Width */}
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
            onUpdatePatient={async () => {
              try {
                setIsLoadingFullPatient(true)
                const apiUrl = import.meta.env.VITE_API_CITAS_MASTER_URL
                const response = await fetch(`${apiUrl}/historia-clinica/pacientes/${patientId}`)
                if (response.ok) {
                  const data = await response.json()
                  setFullPatientData(data)
                  setShowPatientEditModal(true)
                } else {
                  toast({
                    title: "Error",
                    description: "No se pudieron cargar los datos del paciente",
                    variant: "destructive"
                  })
                }
              } catch (error) {
                console.error('Error loading patient data:', error)
                toast({
                  title: "Error",
                  description: "Error al cargar datos del paciente",
                  variant: "destructive"
                })
              } finally {
                setIsLoadingFullPatient(false)
              }
            }}
            isLoadingUpdate={isLoadingFullPatient}
            refreshPatientKey={refreshPatientKey}
          />
        </div>

        {/* Container para alertas */}
        <div id="alertas-container" className="fixed top-4 right-4 z-50 space-y-2" />
      </DialogContent>

      {/* Modal de edición de paciente con providers necesarios */}
      {showPatientEditModal && fullPatientData && (
        <Dialog open={showPatientEditModal} onOpenChange={(open) => {
          if (!open) {
            setShowPatientEditModal(false)
            setFullPatientData(null)
          }
        }}>
          <EstadoCivilProvider>
            <PaisProvider>
              <EtniaProvider>
                <ReligionProvider>
                  <OcupacionProvider>
                    <GradoInstruccionProvider>
                      <PatientEditModal
                        patient={fullPatientData}
                        onCancel={() => {
                          setShowPatientEditModal(false)
                          setFullPatientData(null)
                        }}
                        onSuccess={async () => {
                          setShowPatientEditModal(false)
                          setFullPatientData(null)
                          // Refrescar datos del paciente (forzar recarga desde API)
                          await refetchPatientData()
                          setRefreshPatientKey(prev => prev + 1)
                          toast({
                            title: "Éxito",
                            description: "Historia clínica actualizada correctamente",
                          })
                        }}
                      />
                    </GradoInstruccionProvider>
                  </OcupacionProvider>
                </ReligionProvider>
              </EtniaProvider>
            </PaisProvider>
          </EstadoCivilProvider>
        </Dialog>
      )}
    </Dialog>

    {/* Alerta de error grande y visible - Fuera del Dialog principal para permitir cerrar */}
    <ErrorAlert
      show={showErrorAlert}
      title="Error al Guardar Hospitalización"
      message={errorMessage || "Ha ocurrido un error al guardar la hospitalización"}
      onClose={handleCloseErrorAlert}
    />
    </>
  )
}
