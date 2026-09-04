"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  UserCheck, 
  User, 
  FileText, 
  CreditCard, 
  Calendar, 
  Clock, 
  Hash, 
  Home,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ImageWithLoader from "@/components/ui/ImageWithLoader"
import { UbigeoSelector, EstadoCivilSelector, PaisSelector } from "@/components/filiation/selectors"
import { TipoDocumentoSelector } from "@/components/filiation/selectors/TipoDocumentoSelector"
import { calculateAgeFormatted, formatAgeReadable } from "@/lib/ageCalculator"

interface Step1BasicDataProps {
  formData: any
  onInputChange: (field: string, value: string) => void
  documentType: string
  documentNumber: string
  reniecData?: any
  patientData?: any  // Datos del paciente en modo edición
  onDocumentTypeChange?: (type: string) => void
  onDocumentNumberChange?: (number: string) => void
  onEditHistoryNumber?: () => void  // Callback para abrir modal de edición de historia
  isEditMode?: boolean  // Indica si está en modo edición
}

export function Step1BasicData({ 
  formData, 
  onInputChange, 
  documentType, 
  documentNumber, 
  reniecData,
  patientData,
  onDocumentTypeChange,
  onDocumentNumberChange,
  onEditHistoryNumber,
  isEditMode = false
}: Step1BasicDataProps) {
  // Estado para la foto con cache-busting
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoTimestamp, setPhotoTimestamp] = useState<number>(Date.now())
  const [distritoReniecNombre, setDistritoReniecNombre] = useState<string>('')
  const [docEditEnabled, setDocEditEnabled] = useState<boolean>(false)
  const [showEditDocConfirm, setShowEditDocConfirm] = useState<boolean>(false)
  
  
  // Actualizar foto cuando cambien los datos
  useEffect(() => {
    let newPhotoUrl: string | null = null
    
    if (reniecData?.photoReniec) {
      newPhotoUrl = `data:image/jpeg;base64,${reniecData.photoReniec}`
    }
    else if (patientData?.STRING_FOTO || patientData?.stringFoto) {
      const rawBase64 = patientData.STRING_FOTO || patientData.stringFoto
      const cleanBase64 = String(rawBase64).replace(/\s/g, '')
      newPhotoUrl = cleanBase64.startsWith('data:') 
        ? cleanBase64 
        : `data:image/jpeg;base64,${cleanBase64}`
    }
    
    if (newPhotoUrl) {
      setPhotoUrl(newPhotoUrl)
      setPhotoTimestamp(Date.now())
    }
  }, [reniecData?.photoReniec, patientData?.STRING_FOTO, patientData?.stringFoto])
  
  // Obtener nombre del distrito RENIEC cuando cambia
  useEffect(() => {
    const fetchDistritoReniecNombre = async () => {
      const codigo = reniecData?.distritoReniec || formData.distritoReniec || patientData?.distritoReniec
      if (codigo && codigo.trim() !== '') {
        const codigoTrimmed = codigo.trim()
        
        // ✅ Distinguir entre código RENIEC (6 dígitos) y ubigeo BD (7 dígitos)
        const esCodigoReniec = codigoTrimmed.length === 6 || (codigoTrimmed.length < 7 && !codigoTrimmed.includes(' '))
        
        if (esCodigoReniec) {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_CITAS_MASTER_URL}/maestro/ubigeo/reniec/${codigoTrimmed}`)
            if (response.ok) {
              const text = await response.text()
              if (text && text.trim()) {
                const data = JSON.parse(text)
                setDistritoReniecNombre(`${codigoTrimmed} - ${data.distrito}`)
              } else {
                setDistritoReniecNombre(codigoTrimmed)
              }
            } else {
              setDistritoReniecNombre(codigoTrimmed)
            }
          } catch (error) {
            setDistritoReniecNombre(codigoTrimmed)
          }
        } else {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_CITAS_MASTER_URL}/maestro/ubigeo/${codigoTrimmed}`)
            if (response.ok) {
              const text = await response.text()
              if (text && text.trim()) {
                const data = JSON.parse(text)
                setDistritoReniecNombre(`${codigoTrimmed} - ${data.distrito}`)
              } else {
                setDistritoReniecNombre(codigoTrimmed)
              }
            } else {
              setDistritoReniecNombre(codigoTrimmed)
            }
          } catch (error) {
            setDistritoReniecNombre(codigoTrimmed)
          }
        }
      } else {
        setDistritoReniecNombre('')
      }
    }
    fetchDistritoReniecNombre()
  }, [reniecData?.distritoReniec, formData.distritoReniec, patientData?.distritoReniec])
  // Generar datos automáticos
  const currentDate = new Date()
  const currentDateTime = currentDate.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  const generatePatientCode = () => {
    return `PAC${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, "0")}${Math.floor(
      Math.random() * 10000,
    )
      .toString()
      .padStart(4, "0")}`
  }

  // Calcular edad usando el helper centralizado
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return ""
    return calculateAgeFormatted(birthDate)
  }

  return (
    <div className="space-y-6">
      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-blue-700 flex flex-wrap items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Foto del Paciente */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-32 h-48 bg-gray-200 rounded-lg flex flex-wrap items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                {photoUrl ? (
                  <ImageWithLoader
                    key={photoTimestamp}
                    src={photoUrl.startsWith('data:') ? photoUrl : `${photoUrl}?t=${photoTimestamp}`}
                    alt="Foto del paciente"
                    width={128}
                    height={192}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-500 text-center max-w-32">Foto RENIEC</p>
            </div>

            {/* Campos del sistema */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hc" className="flex flex-wrap items-center text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4 mr-1" />
                  N° Historia Clínica
                </Label>
                <div className="flex flex-wrap gap-2 items-center">
                  <Input 
                    id="hc" 
                    value={
                      patientData?.HISTORIA?.trim() || 
                      patientData?.historia?.trim() || 
                      reniecData?.historyNumber || 
                      // Si es DNI (D), usar el número de documento como historia
                      (documentType === 'D' || documentType === 'DNI' ? documentNumber : '') || 
                      "Se genera automáticamente"
                    } 
                    disabled 
                    className="bg-gray-50 text-gray-600 flex-1" 
                  />
                  {isEditMode && onEditHistoryNumber && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onEditHistoryNumber}
                      className="shrink-0"
                      title="Editar número de historia clínica"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="tipoDocumento" className="flex flex-wrap items-center text-sm font-medium text-gray-700">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Tipo de Documento <span className="text-red-600">*</span>
                </Label>
                {/* Solo bloquear si viene de RENIEC con DNI válido */}
                {reniecData && reniecData.dni ? (
                  <Input id="tipoDocumento" value="DNI" disabled className="bg-gray-50 text-gray-600 uppercase" />
                ) : (
                  <TipoDocumentoSelector
                    value={documentType}
                    onChange={(value) => onDocumentTypeChange?.(value)}
                    disabled={false}
                  />
                )}
              </div>
              <div>
                <Label htmlFor="dni" className="flex flex-wrap items-center text-sm font-medium text-gray-700">
                  <Hash className="w-4 h-4 mr-1" />
                  N° Documento <span className="text-red-600">*</span>
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="dni"
                    value={
                      isEditMode && docEditEnabled
                        ? (documentNumber ?? patientData?.documento ?? patientData?.DOCUMENTO ?? '')
                        : (reniecData?.document ?? reniecData?.dni ?? documentNumber ?? patientData?.documento ?? patientData?.DOCUMENTO ?? '')
                    }
                    onChange={(e) => onDocumentNumberChange?.(e.target.value)}
                    placeholder="Ingrese número de documento"
                    disabled={isEditMode ? !docEditEnabled : Boolean(reniecData && (documentType === 'D' || documentType === 'DNI'))}
                    className={`${isEditMode && !docEditEnabled ? 'bg-gray-50 text-gray-600' : ''}`}
                  />
                  {isEditMode && !docEditEnabled && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditDocConfirm(true)}
                      title="Editar número de documento"
                      className="shrink-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="edad" className="flex flex-wrap items-center text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4 mr-1" />
                  Edad
                </Label>
                <Input
                  id="edad"
                  value={reniecData?.age || (formData.fechaNacimiento ? calculateAge(formData.fechaNacimiento) : "Se calcula automáticamente")}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
              </div>
      {/*         <div>
                <Label htmlFor="codigoPaciente" className="flex flex-wrap items-center text-sm font-medium text-gray-700">
                  <Hash className="w-4 h-4 mr-1" />
                  Código de Paciente
                </Label>
                <Input
                  id="codigoPaciente"
                  value={patientData?.PACIENTE || generatePatientCode()}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
              </div> */}
              <div>
                <Label htmlFor="fechaApertura" className="flex flex-wrap items-center text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 mr-1" />
                  Fecha y Hora de Apertura
                </Label>
                <Input 
                  id="fechaApertura" 
                  value={
                    patientData?.FECHA_APERTURA && patientData.FECHA_APERTURA !== '1901-01-01 00:00:00.000'
                      ? `${patientData.FECHA_APERTURA} ${patientData.HORA_APERTURA || ''}`
                      : patientData?.HORA_APERTURA || currentDateTime
                  } 
                  disabled 
                  className="bg-gray-50 text-gray-600" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos de Identificación */}
 {/* Datos Personales */}
<Card>
  <CardHeader>
    <CardTitle className="text-lg text-blue-700 flex flex-wrap items-center">
      <Calendar className="w-5 h-5 mr-2" />
      Datos Personales
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Apellido Paterno - Apellido Materno - Nombres */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="apellidoPaterno">Apellido Paterno <span className="text-red-600">*</span></Label>
                <Input
                  id="apellidoPaterno"
                  value={reniecData?.apellidoPaterno || formData.apellidoPaterno || patientData?.PATERNO || ""}
                  onChange={(e) => onInputChange("apellidoPaterno", e.target.value.toUpperCase())}
                  className="uppercase"
                  required
                />
      </div>
      <div>
        <Label htmlFor="apellidoMaterno">Apellido Materno <span className="text-red-600">*</span></Label>
                <Input
                  id="apellidoMaterno"
                  value={reniecData?.apellidoMaterno || formData.apellidoMaterno || patientData?.MATERNO || ""}
                  onChange={(e) => onInputChange("apellidoMaterno", e.target.value.toUpperCase())}
                  className="uppercase"
                  required
                />
      </div>
      <div>
        <Label htmlFor="nombres">Nombres <span className="text-red-600">*</span></Label>
                <Input
                  id="nombres"
                  value={reniecData?.nombres || formData.nombres || patientData?.NOMBRES || ""}
                  onChange={(e) => onInputChange("nombres", e.target.value.toUpperCase())}
                  className="uppercase"
                  required
                />
      </div>
    </div>

    {/* Fecha, Sexo y Estado Civil */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="fechaNacimiento">Fecha Nacimiento <span className="text-red-600">*</span></Label>
        <Input
          id="fechaNacimiento"
          type="date"
          value={formData.fechaNacimiento}
          onChange={(e) => onInputChange("fechaNacimiento", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="sexo">Sexo <span className="text-red-600">*</span></Label>
        <Select value={formData.sexo} onValueChange={(value) => onInputChange("sexo", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M">Masculino</SelectItem>
            <SelectItem value="F">Femenino</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="estadoCivil">Estado Civil <span className="text-red-600">*</span></Label>
        <EstadoCivilSelector
          value={formData.estadoCivil}
          onChange={(value, reniec) => {
            onInputChange("estadoCivil", value)
            if (reniec) onInputChange("estadoCivilReniec", reniec)
          }}
        />
      </div>
    </div>

    {/* País y Lugar de Nacimiento */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="paisNacimiento">País de Nacimiento <span className="text-red-600">*</span></Label>
        <PaisSelector
          value={formData.paisNacimiento}
          onChange={(value) => onInputChange("paisNacimiento", value)}
        />
      </div>
      <div>
        <Label htmlFor="lugarNacimiento">Lugar de Nacimiento (Distrito) <span className="text-red-600">*</span></Label>
        <UbigeoSelector
          value={formData.lugarNacimiento}
          onChange={(value, ubigeoreniec) => {
            onInputChange("lugarNacimiento", value)
            if (ubigeoreniec) onInputChange("lugarNacimientoReniec", ubigeoreniec)
          }}
          placeholder="Buscar distrito de nacimiento..."
          ubigeoReniecInitial={reniecData?.ubigeoReniecNacimiento}
        />
      </div>
    </div>

    {/* Dirección y Distrito */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="direccion">Dirección <span className="text-red-600">*</span></Label>
              <Input
                id="direccion"
                placeholder="Ingrese dirección completa"
                value={formData.direccion}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  // Limitar a 60 caracteres para evitar problemas con la vista de BD
                  const truncatedValue = value.slice(0, 60);
                  onInputChange("direccion", truncatedValue);
                }}
                maxLength={60}
                className="uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">Máximo 60 caracteres</p>
      </div>
      <div>
        <Label htmlFor="distritoProcedencia">Distrito de Procedencia <span className="text-red-600">*</span></Label>
        <UbigeoSelector
          value={formData.distritoProcedencia}
          onChange={(value, ubigeoreniec) => {
            onInputChange("distritoProcedencia", value)
            if (ubigeoreniec) onInputChange("ubigeoReniec", ubigeoreniec)
          }}
          placeholder="Buscar distrito de procedencia..."
          ubigeoReniecInitial={reniecData?.ubigeoReniecProcedencia}
        />
      </div>
    </div>

    {/* Dirección y Distrito RENIEC (solo lectura) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="direccionReniec">Dirección RENIEC</Label>
        <Input
          id="direccionReniec"
          value={reniecData?.direccionReniec || formData.direccionReniec || patientData?.direccionReniec || ""}
          disabled
          className="bg-gray-50 text-gray-600 uppercase"
        />
      </div>
      <div>
        <Label htmlFor="distritoReniec">Distrito RENIEC</Label>
        <Input
          id="distritoReniec"
          value={distritoReniecNombre}
          disabled
          className="bg-gray-50 text-gray-600 uppercase"
        />
      </div>
    </div>
  </CardContent>
</Card>

      {/* Confirmación para habilitar edición de N° Documento */}
      <AlertDialog open={showEditDocConfirm} onOpenChange={setShowEditDocConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar número de documento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea habilitar la edición del número de documento? Esta acción puede afectar la identificación del paciente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDocEditEnabled(true)
                setShowEditDocConfirm(false)
              }}
            >
              Habilitar edición
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
