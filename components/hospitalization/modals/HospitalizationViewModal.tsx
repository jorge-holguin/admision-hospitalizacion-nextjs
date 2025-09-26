"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Edit, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { HospitalizationViewRefactored } from "../view/HospitalizationViewRefactored"

interface HospitalizationViewModalProps {
  isOpen: boolean
  onClose: () => void
  hospitalizationId: string
  mode?: 'view' | 'edit'
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
  onSuccess,
  onError,
  onBack,
  onEdit
}: HospitalizationViewModalProps) {
  const [hospitalizationData, setHospitalizationData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Cargar datos de la hospitalización
  const loadHospitalizationData = async () => {
    if (!hospitalizationId) return

    try {
      setLoading(true)
      setError(null)
      console.log('🏥 Cargando datos de hospitalización:', hospitalizationId)

      const response = await fetch(`/api/hospitalizacion/${hospitalizationId}`)
      
      if (!response.ok) {
        throw new Error(`Error al cargar hospitalización: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setHospitalizationData(data.data)
        console.log('✅ Datos de hospitalización cargados:', data.data)
      } else {
        throw new Error(data.message || 'Error al cargar los datos')
      }
    } catch (error: any) {
      console.error('❌ Error al cargar hospitalización:', error)
      setError(error.message || 'Error al cargar los datos de la hospitalización')
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && hospitalizationId) {
      loadHospitalizationData()
    }
  }, [isOpen, hospitalizationId])

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
  const title = isReadOnly ? 'Ver Hospitalización' : 'Editar Hospitalización'

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
              {title}
              {hospitalizationData && (
                <span className="text-sm font-normal text-gray-500">
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
                  className="bg-[#0074ba] hover:bg-[#0067a6] text-white"
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
              <HospitalizationViewRefactored 
                hospitalizationId={hospitalizationId}
                initialData={hospitalizationData}
                readOnly={isReadOnly}
                onSave={handleSave}
                onError={handleError}
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
