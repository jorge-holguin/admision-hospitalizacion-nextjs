"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Edit, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from '@/hooks/use-toast'
import { API_ENDPOINTS, normalizeHospitalizationData } from '@/lib/api-config'
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

      const response = await fetch(API_ENDPOINTS.hospitalizacion.byId(hospitalizationId))
      
      if (!response.ok) {
        throw new Error(`Error al cargar hospitalización: ${response.status}`)
      }

      const data = await response.json()

      let hospitalizationData: any

      // Verificar el formato de la respuesta
      if (data.success && data.data) {
        // Formato con wrapper {success: true, data: {...}}
        hospitalizationData = normalizeHospitalizationData(data.data)
      } else if (data.success === false || data.error || data.message) {
        // Formato de error {success: false, error: '...', message: '...'}
        throw new Error(data.error || data.message || 'Error al cargar los datos')
      } else if (data.IDHOSPITALIZACION || data.idHospitalizacion) {
        // Respuesta directa del objeto de hospitalización (con o sin mapeo de mayúsculas)
        hospitalizationData = normalizeHospitalizationData(data)
      } else {
        // Formato desconocido
        throw new Error('Formato de respuesta desconocido')
      }

      setHospitalizationData(hospitalizationData) 
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
    
    // Si ya tenemos initialData, usarlo directamente
    if (initialData) {
      setHospitalizationData(normalizeHospitalizationData(initialData))
      setLoading(false)
    } else {
      // Si no hay initialData, cargar desde la API
      loadHospitalizationData()
    }
  }, [isOpen, hospitalizationId]) // ✅ Removido initialData de dependencias

  const handleSave = (updatedData: any) => {
    setSubmitSuccess(true)

    toast({
      title: "¡Éxito!",
      description: "Hospitalización actualizada correctamente",
      variant: "default",
    })

    // Normalizar para asegurar campos en mayúsculas
    const normalizedData = normalizeHospitalizationData(updatedData)

    // Actualizar datos locales
    setHospitalizationData(normalizedData)

    // Esperar un momento para que el usuario vea el mensaje de éxito, luego regresar al listado
    setTimeout(() => {
      setSubmitSuccess(false)
      
      // Llamar callback de éxito para regresar al listado
      if (onSuccess) {
        onSuccess(normalizedData)
      }
    }, 1500)
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <DialogTitle className="flex flex-wrap items-center gap-2">
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
            
            <div className="flex flex-wrap items-center gap-2">
              {submitSuccess && (
                <div className="flex flex-wrap items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">¡Guardado exitosamente!</span>
                </div>
              )}
              
              {isReadOnly && onEdit && hospitalizationData?.ESTADO !== '0' && (
                <Button
                  onClick={handleEditClick}
                  className="bg-[#0074ba] hover:bg-[#0067a6] text-white mr-0 sm:mr-6"
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
            <div className="flex flex-wrap items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Cargando datos de hospitalización...</span>
            </div>
          ) : (
            hospitalizationData && (
              <HospitalizationViewRefactored 
                hospitalizationId={hospitalizationId}
                initialData={hospitalizationData}
                readOnly={isReadOnly}
                onSave={handleSave}
                onError={handleError}
                onCancel={handleBack}
              />
            )
          )}
        </div>

        {/* Container para alertas */}
        <div id="alertas-container" className="fixed top-4 right-4 z-50 space-y-2" />
      </DialogContent>
    </Dialog>
  )
}
