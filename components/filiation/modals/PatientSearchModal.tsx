"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { TipoDocumentoSelector } from "@/components/appointments/selectors"
import { useReniec } from "@/hooks/useReniec"
import { toast } from "@/components/ui/use-toast"
import { consultarSIS } from "@/services/sisService"
import { filiacionService } from "@/services/hospitalizacion/filiacionService"
import { AlertCircle, Clock } from "lucide-react"

interface PatientSearchModalProps {
  onSearchComplete: (patientData: any, sisData?: any) => void
  onPatientFound: (patientData: any) => void
  onCancel: () => void
  prefilledDocument?: string // Documento precargado desde appointments
}

export function PatientSearchModal({ onSearchComplete, onPatientFound, onCancel, prefilledDocument }: PatientSearchModalProps) {
  const [documentType, setDocumentType] = useState("D") // D = DNI (valor por defecto)
  const [documentNumber, setDocumentNumber] = useState(prefilledDocument || "")
  const [isLoadingReniec, setIsLoadingReniec] = useState(false)
  const [showExistsDialog, setShowExistsDialog] = useState(false)
  const [existingPatient, setExistingPatient] = useState<any>(null)
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false) // Estado para diálogo de timeout
  const [pendingManualData, setPendingManualData] = useState<any>(null) // Datos pendientes para registro manual
  const { consultarReniec } = useReniec()

  // Actualizar el número de documento cuando cambie el prop
  useEffect(() => {
    if (prefilledDocument) {
      setDocumentNumber(prefilledDocument)
    }
  }, [prefilledDocument])

  // ✅ Handler para cambio de tipo de documento
  const handleDocumentTypeChange = (newType: string) => {
    setDocumentType(newType)
    // Si es tipo "0" (Ninguno), autocompletar número con "0"
    if (newType === "0") {
      setDocumentNumber("0")
    }
  }

  // ✅ Verificar si el tipo es "Ninguno" (0)
  const isNingunoType = documentType.trim() === "0"

  const handleSearchReniec = async () => {
    // ✅ Excepción para tipo "Ninguno" (0): no requiere 8 caracteres
    if (!isNingunoType && (!documentNumber || documentNumber.length < 8)) {
      toast({
        title: "Validación",
        description: "Ingrese un número de documento válido",
        variant: "destructive"
      })
      return
    }

    setIsLoadingReniec(true)

    try {
      // ✅ Si es tipo "0" (Ninguno/RN), saltar validación de paciente existente
      // Los RN tienen TIPO_DOCUMENTO=0 y DOCUMENTO=0, pueden haber múltiples
      if (!isNingunoType) {
        // 1. Primero buscar en la API de filiación (solo si NO es tipo Ninguno)
        const filiacionData = await filiacionService.getPaginatedFiliacion(
          { documento: documentNumber },
          { page: 1, pageSize: 10 }
        );

        // 2. Si encuentra datos en filiación, mostrar diálogo de paciente existente
        if (filiacionData.data && filiacionData.data.length > 0) {
          setIsLoadingReniec(false);
          setExistingPatient(filiacionData.data[0]);
          setShowExistsDialog(true);
          return;
        }
      }

      // ✅ Si es tipo "0" (Ninguno/RN), ir directo al registro sin consultar APIs
      if (isNingunoType) {
        toast({
          title: "📋 Registro de Recién Nacido",
          description: "Se abrirá el formulario con campos autocompletados. Complete los datos del paciente.",
          duration: 4000
        })
        
        const manualData = {
          documentType: "0",
          document: "0",
          isRecienNacido: true // Flag para indicar que es RN
        }
        onSearchComplete(manualData, null)
        setIsLoadingReniec(false)
        return
      }

      // 3. Consultar APIs externas según tipo de documento
      const isDNI = documentType.trim() === 'D'
      
      // Procesar resultados
      let hasData = false
      let reniecData = null
      let sisData = null
      let reniecError: string | null = null

      // RENIEC: Solo para DNI de 8 dígitos
      if (isDNI && documentNumber.length === 8) {
        const reniecResult = await consultarReniec(documentNumber)
        
        if (reniecResult.success && reniecResult.data) {
          reniecData = reniecResult.data
          hasData = true
        } else if (reniecResult.error) {
          if (reniecResult.error.includes('RENIEC_TIMEOUT')) {
            reniecError = 'RENIEC_TIMEOUT'
            // Guardar datos para registro manual y mostrar diálogo
            const manualData = {
              documentType: documentType,
              document: documentNumber,
              reniecError: 'RENIEC_TIMEOUT'
            }
            setPendingManualData({ reniecData: manualData, sisData: null })
            setShowTimeoutDialog(true)
            setIsLoadingReniec(false)
            return // Salir para mostrar el diálogo
          } else if (reniecResult.error.includes('DNI_NO_EXISTE')) {
            reniecError = 'DNI_NO_EXISTE'
            toast({
              title: "⚠️ DNI no encontrado",
              description: "El DNI consultado no existe en la base de datos de RENIEC. Verifique el número o complete el registro manualmente.",
              variant: "destructive"
            })
          } else if (reniecResult.error.includes('UBIGEO')) {
            toast({
              title: "ℹ️ Información",
              description: "Algunos datos de ubicación no se pudieron cargar automáticamente. Puede completarlos manualmente.",
              variant: "default"
            })
          } else {
            toast({
              title: "Error RENIEC",
              description: reniecResult.error,
              variant: "destructive"
            })
          }
        }
      }

      // SIS: Para TODOS los tipos de documento con timeout de 2 segundos
      try {
        const sisResult: any = await Promise.race([
          consultarSIS(documentNumber),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SIS timeout')), 2000)
          )
        ])
        
        if (sisResult.success && sisResult.data) {
          sisData = sisResult.data
          hasData = true
        }
      } catch (error: any) {
        // Timeout SIS - continuar sin datos
      }

      // Mostrar resultados
      if (hasData) {
        const sources = []
        if (reniecData) sources.push('RENIEC')
        if (sisData) sources.push('SIS')
        
        if (reniecData && !sisData) {
          toast({
            title: "Datos encontrados en RENIEC",
            description: "⚠️ El paciente no cuenta con SIS activo. Se establecerá como PAGANTE.",
            variant: "default",
          })
        } else {
          toast({
            title: "Datos encontrados",
            description: `Se encontraron datos en ${sources.join(' y ')}. Complete el registro.`,
          })
        }
        
        // Crear objeto con datos de RENIEC o datos manuales
        const enhancedReniecData = reniecData ? {
          ...reniecData,
          documentType: reniecData.documentType || documentType,
          document: reniecData.document || documentNumber,
          reniecError: reniecError || undefined
        } : {
          documentType: documentType,
          document: documentNumber,
          reniecError: reniecError || undefined
        }
        
        onSearchComplete(enhancedReniecData, sisData)
      } else {
        toast({
          title: "No encontrado",
          description: `⚠️ El paciente no cuenta con SIS activo. Se establecerá como PAGANTE.`,
        })
        
        // Abrir modal de registro con tipo y número de documento (llenado manual)
        const manualData = {
          documentType: documentType,
          document: documentNumber,
          reniecError: reniecError || undefined
        }
        onSearchComplete(manualData, null)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al buscar paciente",
        variant: "destructive"
      })
    } finally {
      setIsLoadingReniec(false);
    }
  }

  // Si se muestra el diálogo de timeout de RENIEC
  if (showTimeoutDialog && pendingManualData) {
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-600 flex flex-wrap items-center gap-2">
            <Clock className="h-6 w-6" />
            Falla en servicio RENIEC
          </DialogTitle>
          <DialogDescription>
            No se pudo obtener respuesta del servicio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-gray-700 mb-3">
              La consulta a RENIEC ha excedido el tiempo de espera de <strong>15 segundos</strong>.
            </p>
            <p className="text-gray-600 text-sm">
              Esto puede deberse a problemas de conectividad o alta demanda en el servicio de RENIEC.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              ℹ️ Puede continuar con el <strong>registro manual</strong> del paciente. Deberá completar todos los datos personales manualmente.
            </p>
          </div>

          <div className="flex flex-wrap justify-end">
            <Button 
              onClick={() => {
                setShowTimeoutDialog(false)
                // Continuar con registro manual
                if (pendingManualData) {
                  onSearchComplete(pendingManualData.reniecData, pendingManualData.sisData)
                }
                setPendingManualData(null)
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Entendido
            </Button>
          </div>
        </div>
      </DialogContent>
    )
  }

  // Si se muestra el diálogo de paciente existente
  if (showExistsDialog && existingPatient) {
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600 flex flex-wrap items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Paciente ya existe
          </DialogTitle>
          <DialogDescription>
            No es posible crear una nueva historia clínica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-700 mb-3">
              El documento <strong>{documentNumber}</strong> ya está registrado en la base de datos.
            </p>
            <div className="bg-white rounded border p-3 space-y-1">
              <p className="text-sm"><strong>Historia:</strong> {existingPatient.HISTORIA || existingPatient.historia || 'N/A'}</p>
              <p className="text-sm"><strong>Nombre:</strong> {existingPatient.NOMBRES || existingPatient.nombres || 'N/A'}</p>
              <p className="text-sm"><strong>Documento:</strong> {existingPatient.DOCUMENTO || existingPatient.documento || documentNumber}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              ℹ️ Si necesita actualizar los datos del paciente, utilice la opción de <strong>Editar</strong> desde el módulo de Filiación.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setShowExistsDialog(false)
                setExistingPatient(null)
              }}
            >
              Buscar otro
            </Button>
            <Button 
              onClick={() => {
                onPatientFound(existingPatient)
                setShowExistsDialog(false)
                setExistingPatient(null)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    )
  }

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-blue-800">Buscar Paciente</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="w-full sm:w-[250px]">
            <Label htmlFor="documentType">Tipo de Documento</Label>
            <TipoDocumentoSelector
              value={documentType}
              onChange={handleDocumentTypeChange}
              placeholder="Seleccione tipo"
            />
          </div>

          <div className="flex-1 min-w-0">
            <Label htmlFor="documentNumber">Número de Documento</Label>
            <Input
              id="documentNumber"
              placeholder={isNingunoType ? "0" : "Ingrese número de documento..."}
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              maxLength={documentType.trim() === "D" ? 8 : 12}
              disabled={isNingunoType} // ✅ Deshabilitar si es "Ninguno"
              className="w-full"
            />
          </div>

          <Button 
            onClick={handleSearchReniec} 
            disabled={isLoadingReniec || (!isNingunoType && documentNumber.length < 1)} 
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {isLoadingReniec ? "Consultando..." : "Buscar"}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}
