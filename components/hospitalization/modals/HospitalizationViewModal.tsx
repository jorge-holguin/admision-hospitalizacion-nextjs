"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Edit, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { HospitalizationViewRefactored } from "../view/HospitalizationViewRefactored"
import { useConsultorios } from "@/contexts/ConsultoriosContext"

interface HospitalizationViewModalProps {
  isOpen: boolean
  onClose: () => void
  hospitalizationId: string
  mode?: 'view' | 'edit'
  initialData?: any // Datos iniciales para evitar llamada duplicada a la API
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  onBack?: () => void
  onEdit?: () => void
}

export function HospitalizationViewModal({
  isOpen,
  onClose,
  hospitalizationId,
  mode = 'view',
  initialData,
  onSuccess,
  onError,
  onBack,
  onEdit
}: HospitalizationViewModalProps) {
  const [hospitalizationData, setHospitalizationData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Contexto de consultorios
  const { consultoriosHospitalizacion, loadConsultoriosHospitalizacion } = useConsultorios()

  // Cargar datos de la hospitalización
  const loadHospitalizationData = async () => {
    if (!hospitalizationId) return

    try {
      setLoading(true)
      setError(null)
      console.log('🏥 Cargando datos de hospitalización:', hospitalizationId)

      const response = await fetch(`/api/hospitalization/${hospitalizationId}`)
      
      if (!response.ok) {
        throw new Error(`Error al cargar hospitalización: ${response.status}`)
      }

      const data = await response.json()
      
      console.log('📦 Respuesta RAW de la API:', data);
      console.log('📦 Campos de acompañante en respuesta RAW:', {
        ACOMPANANTE_NOMBRE: data.ACOMPANANTE_NOMBRE,
        ACOMPANANTE_TELEFONO: data.ACOMPANANTE_TELEFONO,
        ACOMPANANTE_DIRECCION: data.ACOMPANANTE_DIRECCION,
        ORIGENID: data.ORIGENID
      });
      
      // Verificar el formato de la respuesta
      if (data.success && data.data) {
        // Formato con wrapper {success: true, data: {...}}
        setHospitalizationData(data.data)
        console.log('✅ Datos de hospitalización cargados (formato success/data):', data.data)
      } else if (data.error || data.message) {
        // Formato de error {error: '...', message: '...'}
        throw new Error(data.error || data.message || 'Error al cargar los datos')
      } else if (data.IDHOSPITALIZACION) {
        // Respuesta directa del objeto de hospitalización
        setHospitalizationData(data)
        console.log('✅ Datos de hospitalización cargados (formato directo):', data)
      } else {
        // Formato desconocido
        console.warn('Formato de respuesta desconocido:', data)
        throw new Error('Formato de respuesta desconocido')
      } 
    } catch (error: any) {
      console.error('❌ Error al cargar hospitalización:', error)
      setError(error.message || 'Error al cargar los datos de la hospitalización')
    } finally {
      setLoading(false)
    }
  }

  // Cargar consultorios de hospitalización cuando se abre el modal
  useEffect(() => {
    if (isOpen && consultoriosHospitalizacion.length === 0) {
      console.log('🏥 Cargando consultorios de hospitalización...')
      loadConsultoriosHospitalizacion()
    }
  }, [isOpen, consultoriosHospitalizacion.length, loadConsultoriosHospitalizacion])

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (!isOpen) {
      // Limpiar datos cuando se cierra el modal
      setHospitalizationData(null)
      setError(null)
      return
    }
    
    if (!hospitalizationId) {
      return
    }
    
    console.log('🔴 HospitalizationViewModal useEffect ejecutado:', {
      isOpen,
      hospitalizationId,
      hasInitialData: !!initialData
    });
    
    // Si ya tenemos initialData, usarlo directamente
    if (initialData) {
      console.log('🏥 HospitalizationViewModal: Usando initialData proporcionado')
      setHospitalizationData(initialData)
      setLoading(false)
    } else {
      // Si no hay initialData, cargar desde la API
      console.log('🏥 HospitalizationViewModal: Cargando desde API')
      loadHospitalizationData()
    }
  }, [isOpen, hospitalizationId]) // ✅ Removido initialData de dependencias

  const handleSave = (updatedData: any) => {
    console.log('✅ Hospitalización actualizada:', updatedData)
    setSubmitSuccess(true)
    
    toast({
      title: "¡Éxito!",
      description: "Hospitalización actualizada correctamente",
      variant: "default",
    })

    // Actualizar datos locales
    setHospitalizationData(updatedData)

    // Llamar callback de éxito si existe
    if (onSuccess) {
      onSuccess(updatedData)
    }

    // Ocultar mensaje de éxito después de un tiempo
    setTimeout(() => {
      setSubmitSuccess(false)
    }, 3000)
  }

  const handleError = (errorMessage: string) => {
    console.error('❌ Error al actualizar hospitalización:', errorMessage)
    setError(errorMessage)

    // Llamar callback de error si existe
    if (onError) {
      onError(errorMessage)
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      onClose()
    }
  }

  const handleEditClick = () => {
    if (onEdit) {
      onEdit()
    }
  }

  if (!isOpen) return null

  const isReadOnly = mode === 'view'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-7xl max-h-[95vh] flex flex-col overflow-hidden p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
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
              <div className="flex flex-col">
                <span className="text-blue-600 font-bold text-lg">Hospitalización</span>
                <span className="text-black font-normal text-sm">
                  {isReadOnly ? 'Ver Hospitalización' : 'Editar Hospitalización'}
                </span>
              </div>
              {hospitalizationData && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ID: {hospitalizationId}
                </span>
              )}
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              {submitSuccess && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">¡Guardado exitosamente!</span>
                </div>
              )}
              
              {isReadOnly && onEdit && (
                <Button
                  onClick={handleEditClick}
                  className="bg-[#0074ba] hover:bg-[#0067a6] text-white  mr-6"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Cargando datos de hospitalización...</span>
            </div>
          ) : (
            hospitalizationData && (
              <>
                {(() => {
                  console.log('🔵 Renderizando HospitalizationViewRefactored con hospitalizationData:', {
                    IDHOSPITALIZACION: hospitalizationData.IDHOSPITALIZACION,
                    ACOMPANANTE_NOMBRE: hospitalizationData.ACOMPANANTE_NOMBRE,
                    ACOMPANANTE_TELEFONO: hospitalizationData.ACOMPANANTE_TELEFONO,
                    ACOMPANANTE_DIRECCION: hospitalizationData.ACOMPANANTE_DIRECCION,
                    ORIGENID: hospitalizationData.ORIGENID,
                    fullData: hospitalizationData
                  });
                  return null;
                })()}
                <HospitalizationViewRefactored 
                  hospitalizationId={hospitalizationId}
                  initialData={hospitalizationData}
                  readOnly={isReadOnly}
                  onSave={handleSave}
                  onError={handleError}
                  onCancel={handleBack}
                />
              </>
            )
          )}
        </div>

        {/* Container para alertas */}
        <div id="alertas-container" className="fixed top-4 right-4 z-50 space-y-2" />
      </DialogContent>
    </Dialog>
  )
}
