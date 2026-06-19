"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Edit } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { PatientEditModal } from "@/components/filiation/modals/PatientEditModal"
import { FiliationProvider } from "@/contexts/filiation/FiliationProvider"

interface PatientBase {
  PACIENTE?: string
  HISTORIA?: string
  DOCUMENTO?: string
  [key: string]: any
}

interface UpdateClinicalHistoryButtonProps {
  patient: PatientBase
  onPatientUpdated?: (updatedPatient: PatientBase) => void
  className?: string
}

function mapApiToPatient(apiData: any, original: PatientBase): PatientBase {
  return {
    ...original,
    HISTORIA: apiData.historia || original.HISTORIA,
    NOMBRES: apiData.nombres
      ? `${apiData.apellidoPaterno || ''} ${apiData.apellidoMaterno || ''} ${apiData.nombres || ''}`.trim()
      : original.NOMBRES,
    NOMBRE: apiData.nombres || original.NOMBRE,
    PATERNO: apiData.apellidoPaterno || original.PATERNO,
    MATERNO: apiData.apellidoMaterno || original.MATERNO,
    SEXO: apiData.sexo || original.SEXO,
    DOCUMENTO: apiData.numeroDocumento || apiData.documento || original.DOCUMENTO,
    TIPO_DOCUMENTO:
      (typeof apiData.tipoDocumento === 'object'
        ? apiData.tipoDocumento?.tipoDocumento
        : apiData.tipoDocumento) || original.TIPO_DOCUMENTO,
    FECHA_NACIMIENTO: apiData.fechaNacimiento || original.FECHA_NACIMIENTO,
    EDAD: apiData.edad || original.EDAD,
    ESTADO_CIVIL:
      (apiData.estadoCivil?.estadoCivil ?? apiData.estadoCivil)?.toString().trim() ||
      original.ESTADO_CIVIL,
    DIRECCION: apiData.direccion || original.DIRECCION,
    DISTRITO: apiData.distrito || original.DISTRITO,
    Distrito_Dir: apiData.distritoNacimiento || apiData.Distrito_Dir || original.Distrito_Dir,
    TELEFONO1: apiData.telefono || original.TELEFONO1,
    CORREO: apiData.correo || original.CORREO,
    SEGURO: apiData.seguro?.seguro?.trim() || apiData.seguro || original.SEGURO,
    NOMBRE_SEGURO: apiData.seguro?.nombre || apiData.nombreSeguro || original.NOMBRE_SEGURO,
    STRING_FOTO: apiData.foto || original.STRING_FOTO,
    PACIENTE: apiData.paciente || original.PACIENTE,
  }
}

export function UpdateClinicalHistoryButton({
  patient,
  onPatientUpdated,
  className,
}: UpdateClinicalHistoryButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [fullPatientData, setFullPatientData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const pacienteId = patient?.PACIENTE || patient?.HISTORIA

  const handleClick = async () => {
    if (!pacienteId) {
      toast({
        title: "Error",
        description: "No se pudo identificar al paciente",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
      const response = await fetch(`${apiUrl}/historia-clinica/pacientes/${pacienteId}`)
      if (!response.ok) throw new Error("Error al cargar datos del paciente")
      const data = await response.json()
      setFullPatientData(data)
      setShowModal(true)
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos completos del paciente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    setFullPatientData(null)
  }

  const handleSuccess = async () => {
    handleClose()

    if (pacienteId) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
        const response = await fetch(`${apiUrl}/historia-clinica/pacientes/${pacienteId}`)
        if (response.ok) {
          const data = await response.json()
          onPatientUpdated?.(mapApiToPatient(data, patient))
        }
      } catch {
        console.error("Error al recargar datos del paciente tras actualización")
      }
    }

    toast({
      title: "✅ Historia actualizada",
      description: "Los cambios se han guardado correctamente.",
    })
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isLoading}
        className={
          className ??
          "w-full justify-center px-6 py-2.5 h-11 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 relative z-10"
        }
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
            Cargando...
          </>
        ) : (
          <>
            <Edit className="h-4 w-4 mr-2" />
            Actualizar Historia Clínica
          </>
        )}
      </Button>

      {showModal && fullPatientData && (
        <Dialog open={showModal} onOpenChange={(open) => { if (!open) handleClose() }}>
          <FiliationProvider>
            <PatientEditModal
              patient={fullPatientData}
              onCancel={handleClose}
              onSuccess={handleSuccess}
            />
          </FiliationProvider>
        </Dialog>
      )}
    </>
  )
}
