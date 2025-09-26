"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import EmergencySectionView from '@/components/emergency/view/EmergencySectionView'
import { resolveStatus } from '@/utils/statusUtils'
import { toast } from "@/components/ui/use-toast"

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
        
        const response = await fetch(`/api/emergencia/${emergencyId}`)
        
        // Handle HTTP errors
        if (response.status === 404) {
          throw new Error('Registro de emergencia no encontrado')
        } else if (response.status === 403) {
          throw new Error('No tiene permisos para acceder a este registro')
        } else if (!response.ok) {
          throw new Error(`Error al cargar los datos de emergencia (${response.status})`)
        }
        
        const data = await response.json()
        
        if (data.success && data.data) {
          const emergency = data.data
          setEmergencyData(emergency)
          
          // Validate patient ID
          if (!emergency.PACIENTE) {
            throw new Error('El registro no contiene un ID de paciente válido')
          }
          
          setPatientId(emergency.PACIENTE)
          
          // Determinar el estado según el estado de la emergencia y el modo
          const emergencyStatus = emergency.ESTADO
          const isEditable = emergencyStatus === '2' // Solo estado REGISTRADO (2) es editable
          
          // Si el modo es 'edit' y el registro es editable, permitir edición
          if (mode === 'edit' && isEditable) {
            setCurrentMode('edit')
            setStatusInfo({
              isReadOnly: false,
              statusText: 'Modo edición'
            })
          } else {
            setCurrentMode('view')
            setStatusInfo({
              isReadOnly: true,
              statusText: mode === 'edit' && !isEditable 
                ? 'No editable - Estado del registro no permite modificaciones'
                : 'Modo visualización'
            })
          }
        } else {
          throw new Error(data.error || 'No se encontraron datos de emergencia')
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-2">
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
          
          <div className="flex items-center gap-3">
            {currentMode === 'view' && emergencyData?.ESTADO === '2' && (
              <Button
                onClick={handleToggleEditMode}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
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
              <AlertTitle className="text-amber-800">Registro en modo lectura</AlertTitle>
              <AlertDescription className="text-amber-700">
                Este registro está cerrado y no puede ser modificado.
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
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
