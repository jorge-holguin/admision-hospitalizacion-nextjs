"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Copy, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import EmergencySectionView from '@/components/emergency/view/EmergencySectionView'
import { resolveStatus } from '@/utils/statusUtils'
import { toast } from "@/components/ui/use-toast"
import { useConsultorios } from "@/contexts/ConsultoriosContext"
import { emergenciaService } from "@/services/emergencia/emergenciaService"
import { PatientEditModal } from "@/components/filiation/modals/PatientEditModal"
import { useFetchPatientData } from "@/contexts/PatientDataContext"
import { EstadoCivilProvider } from "@/contexts/filiation/EstadoCivilContext"
import { PaisProvider } from "@/contexts/filiation/PaisContext"
import { EtniaProvider } from "@/contexts/filiation/EtniaContext"
import { ReligionProvider } from "@/contexts/filiation/ReligionContext"
import { OcupacionProvider } from "@/contexts/filiation/OcupacionContext"
import { GradoInstruccionProvider } from "@/contexts/filiation/GradoInstruccionContext"

interface EmergencyViewModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  emergencyId: string
  mode?: 'view' | 'edit'
  onModeChange?: (mode: 'view' | 'edit') => void
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

// Normaliza la respuesta de Spring (camelCase) al formato uppercase que espera la vista
function mapApiToViewData(raw: any): any {
  const src = raw?.data || raw || {};

  return {
    EMERGENCIA_ID: src.emergenciaId || src.EMERGENCIA_ID || '',
    PACIENTE: src.paciente || src.PACIENTE || '',
    FECHA: src.fecha || src.FECHA || '',
    HORA: src.hora || src.HORA || '',
    CONSULTORIO: src.consultorio || src.CONSULTORIO || '',
    CONSULTORIO_DESCRIPCION: src.consultorioNombre || src.CONSULTORIO_DESCRIPCION || '',
    MOTIVO_EMERGENCIA: src.motivoConsulta || src.motivoEmergencia || src.MOTIVO_EMERGENCIA || '',
    MOTIVO_DESCRIPCION: src.motivoConsultaDescripcion || src.motivoNombre || src.MOTIVO_DESCRIPCION || '',
    TIPOATENCION: src.tipoAtencion || src.TIPOATENCION || '',
    ESTADO_PACIENTE: src.estadoPaciente || src.condicionPaciente || src.ESTADO_PACIENTE || '',
    FORMA_INGRESO: src.formaIngreso || src.FORMA_INGRESO || '',
    FORMA_INGRESO_DESCRIPCION: src.formaIngresoNombre || src.FORMA_INGRESO_DESCRIPCION || '',
    SEGUROLIQ: src.seguroLiq || src.seguro || src.SEGUROLIQ || src.SEGURO || '',
    SEGUROLIQ_NOMBRE: src.seguroNombre || src.seguroDescripcion || src.SEGUROLIQ_NOMBRE || '',
    SEGURO: src.seguro || src.SEGURO || '',
    SEGURO_NOMBRE: src.seguroNombre || src.SEGURO_NOMBRE || '',
    EMPRESASEGURO: src.empresaSeguro || src.aseguradora || src.EMPRESASEGURO || '',
    EMPRESASEG_NOMBRE: src.empresaSeguroNombre || src.aseguradoraNombre || src.EMPRESASEG_NOMBRE || '',
    OBSERVACION1: src.observacion1 || src.OBSERVACION1 || '',
    OBSERVACION2: src.observacion2 || src.OBSERVACION2 || '',
    RELATO: src.relato || src.RELATO || '',
    ACOMPANANTE: src.acompanante || src.ACOMPANANTE || '',
    TIPO_DOCUMENTOA: src.tipoDocumentoA || src.tipoDocumentoAcompanante || src.TIPO_DOCUMENTOA || '',
    DOCUMENTOA: src.documentoA || src.documentoAcompanante || src.DOCUMENTOA || '',
    _debug_acompanante: null,
    ESTADO: String(src.estado ?? src.ESTADO ?? ''),
    CUENTAID: src.cuentaId || src.CUENTAID || '',
    MEDICO: src.medico || src.MEDICO || '0',
    NOMBRES: src.nombres || src.NOMBRES || '',
    NOMBRE: src.nombre || src.NOMBRE || '',
    PATERNO: src.paterno || src.PATERNO || '',
    MATERNO: src.materno || src.MATERNO || '',
    DOCUMENTO: src.documento || src.DOCUMENTO || '',
    EDAD: src.edad || src.EDAD || '',
    USUARIO: src.usuario || src.USUARIO || '',
    ESTADO_CIVIL: src.estadoCivil || src.ESTADO_CIVIL || src.ESTADOCIVIL || ''
  };
}

export function EmergencyViewModal({
  isOpen,
  onClose,
  onBack,
  emergencyId,
  mode = 'view',
  onModeChange,
  onSuccess,
  onError
}: EmergencyViewModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emergencyData, setEmergencyData] = useState<any>(null)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [currentMode, setCurrentMode] = useState<'edit' | 'view'>(mode === 'edit' ? 'edit' : 'view')
  const [statusInfo, setStatusInfo] = useState<{
    isReadOnly: boolean;
    statusText: string;
  }>({ isReadOnly: mode !== 'edit', statusText: 'Cargando...' })
  const [showPatientEditModal, setShowPatientEditModal] = useState(false)
  const [isLoadingFullPatient, setIsLoadingFullPatient] = useState(false)
  const [fullPatientData, setFullPatientData] = useState<any>(null)
  const [refreshPatientKey, setRefreshPatientKey] = useState(0)

  // Hook para refrescar datos del paciente
  const { refetchPatientData } = useFetchPatientData(patientId)

  // Contexto de consultorios
  const { consultorios, loadConsultoriosEmergencia } = useConsultorios()

  // Cargar consultorios de emergencia cuando se abre el modal
  useEffect(() => {
    if (isOpen && consultorios.length === 0) {
      loadConsultoriosEmergencia()
    }
  }, [isOpen, consultorios.length, loadConsultoriosEmergencia])

  // Fetch emergency data
  useEffect(() => {
    const fetchEmergencyData = async () => {
      if (!emergencyId || !isOpen) return

      try {
        setLoading(true)
        setError(null)
        
        // Validate emergencyId
        if (emergencyId === 'undefined') {
          throw new Error('ID de emergencia inválido')
        }

        const raw = await emergenciaService.getEmergenciaById(emergencyId)

        if (!raw) {
          throw new Error('Registro de emergencia no encontrado')
        }

        const emergency = mapApiToViewData(raw)
        setEmergencyData(emergency)

        // Validate patient ID
        if (!emergency.PACIENTE) {
          throw new Error('El registro no contiene un ID de paciente válido')
        }

        setPatientId(emergency.PACIENTE)
          
          // Determinar el estado según el estado de la emergencia y el modo
          const emergencyStatus = emergency.ESTADO
          // Permitir edición en modo 'edit' - no restringir por estado
          const isEditable = mode === 'edit'
          
          // Si el modo es 'edit', permitir edición
          if (isEditable) {
            setCurrentMode('edit')
            setStatusInfo({
              isReadOnly: false,
              statusText: 'Modo edición'
            })
          } else {
            setCurrentMode('view')
            setStatusInfo({
              isReadOnly: true,
              statusText: 'Modo visualización'
            })
          }
      } catch (error: any) {
        console.error('Error fetching emergency data:', error)
        setError(error.message)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchEmergencyData()
  }, [emergencyId, isOpen, mode])

  // Function to toggle edit mode
  const handleToggleEditMode = () => {
    if (currentMode === 'view' && emergencyData?.ESTADO === '2') {
      const newMode = 'edit'
      setCurrentMode(newMode)
      setStatusInfo({
        isReadOnly: false,
        statusText: 'Modo edición'
      })
      if (onModeChange) {
        onModeChange(newMode)
      }
    }
  }

  // Function to logically delete the emergency
  const handleDelete = async () => {
    if (!emergencyData?.EMERGENCIA_ID) return

    const argumento = window.prompt(
      `Ingrese el motivo de anulación para la emergencia ${emergencyData.EMERGENCIA_ID}:`
    )
    if (!argumento || argumento.trim() === '') return

    try {
      setLoading(true)
      await emergenciaService.deleteEmergencia(emergencyData.EMERGENCIA_ID, argumento.trim())
      toast({
        title: 'Emergencia eliminada',
        description: 'La emergencia fue anulada correctamente'
      })
      onBack()
    } catch (error: any) {
      toast({
        title: 'Error al eliminar',
        description: error.message || 'No se pudo eliminar la emergencia',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (updatedData: any) => {
    // Update local state with new data
    setEmergencyData(updatedData)
    
    // Call onSuccess if provided (for modal integration)
    if (onSuccess) {
      onSuccess(updatedData)
    } else {
      // Default toast if no onSuccess handler
      toast({
        title: "Datos actualizados",
        description: "Los datos de emergencia se han actualizado correctamente"
      })
    }
    
    // Switch back to view mode after saving
    setCurrentMode('view')
    setStatusInfo({
      isReadOnly: true,
      statusText: 'Modo visualización'
    })
    if (onModeChange) {
      onModeChange('view')
    }
  }

  const handleError = (error: string) => {
    // Call onError if provided (for modal integration)
    if (onError) {
      onError(error)
    } else {
      // Default toast if no onError handler
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    }
  }

  const getModalTitle = () => {
    return currentMode === 'edit' ? 'Editar Registro de Emergencia' : 'Ver Registro de Emergencia'
  }

  const loadFullPatientData = async (pacienteId: string) => {
    try {
      setIsLoadingFullPatient(true)
      const apiUrl = import.meta.env.VITE_API_CITAS_MASTER_URL
      const response = await fetch(`${apiUrl}/historia-clinica/pacientes/${pacienteId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del paciente')
      }
      
      const data = await response.json()
      setFullPatientData(data)
    } catch (error) {
      console.error('Error al cargar datos del paciente:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos completos del paciente",
        variant: "destructive"
      })
    } finally {
      setIsLoadingFullPatient(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-4 border-b">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle className="text-xl font-semibold text-red-700">
                EMERGENCIA
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                {getModalTitle()}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {currentMode === 'view' && (
              <Button
                onClick={handleToggleEditMode}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}

            {emergencyData?.ESTADO === '2' && currentMode === 'view' && (
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}

            <Badge 
              variant={currentMode === 'edit' ? "outline" : "secondary"}
              className="text-sm py-1 px-3"
            >
              {statusInfo.statusText}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {statusInfo.isReadOnly && currentMode === 'view' && emergencyData?.ESTADO !== '2' && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertTitle className="text-amber-800 flex flex-wrap items-center gap-2">
                <Copy className="h-4 w-4" />
                Registro en modo lectura
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                Este registro está cerrado y no puede ser modificado. 
                <span className="font-medium"> Puede seleccionar y copiar el contenido de los campos para reutilizarlo.</span>
              </AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            emergencyData && (
              <EmergencySectionView 
                emergencyId={emergencyId}
                initialData={emergencyData}
                readOnly={statusInfo.isReadOnly}
                onSave={handleSave}
                onError={handleError}
                onCancel={onBack}
                onUpdatePatient={async () => {
                  if (patientId) {
                    await loadFullPatientData(patientId)
                    setShowPatientEditModal(true)
                  }
                }}
                isLoadingUpdate={isLoadingFullPatient}
                refreshPatientKey={refreshPatientKey}
              />
            )
          )}
        </div>
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
                          // Refrescar datos del paciente desde el contexto
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
  )
}
