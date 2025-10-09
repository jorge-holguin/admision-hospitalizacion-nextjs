"use client"

import { useState } from "react"
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
  Home 
} from "lucide-react"
import { SearchableSelect, OptionItem } from "@/components/ui/SearchableSelect"
import { paisOptions, departamentoOptions, distritoLimaOptions } from "@/lib/constants/filiation-options"

interface Step1BasicDataProps {
  formData: any
  onInputChange: (field: string, value: string) => void
  documentType: string
  documentNumber: string
  reniecData?: any
  patientData?: any  // Datos del paciente en modo edición
}

export function Step1BasicData({ 
  formData, 
  onInputChange, 
  documentType, 
  documentNumber, 
  reniecData,
  patientData
}: Step1BasicDataProps) {
  const [paisSearch, setPaisSearch] = useState("")
  const [departamentoSearch, setDepartamentoSearch] = useState("")
  const [distritoSearch, setDistritoSearch] = useState("")

  // Convertir opciones al formato OptionItem
  const paisOptionsFormatted: OptionItem[] = paisOptions.map(opt => ({
    value: opt.value,
    display: opt.label,
    data: opt
  }))

  const departamentoOptionsFormatted: OptionItem[] = departamentoOptions.map(opt => ({
    value: opt.value,
    display: opt.label,
    data: opt
  }))

  const distritoOptionsFormatted: OptionItem[] = distritoLimaOptions.map(opt => ({
    value: opt.value,
    display: opt.label,
    data: opt
  }))

  // Filtrar opciones basado en búsqueda
  const filteredPaisOptions = paisOptionsFormatted.filter(opt =>
    opt.display.toLowerCase().includes(paisSearch.toLowerCase())
  )

  const filteredDepartamentoOptions = departamentoOptionsFormatted.filter(opt =>
    opt.display.toLowerCase().includes(departamentoSearch.toLowerCase())
  )

  const filteredDistritoOptions = distritoOptionsFormatted.filter(opt =>
    opt.display.toLowerCase().includes(distritoSearch.toLowerCase())
  )

  // Obtener el display actual
  const getPaisDisplay = () => {
    const option = paisOptionsFormatted.find(opt => opt.value === formData.paisNacimiento)
    return option?.display || ""
  }

  const getDepartamentoDisplay = () => {
    const option = departamentoOptionsFormatted.find(opt => opt.value === formData.lugarNacimiento)
    return option?.display || ""
  }

  const getDistritoDisplay = () => {
    const option = distritoOptionsFormatted.find(opt => opt.value === formData.distritoProcedencia)
    return option?.display || ""
  }
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

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return ""
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age.toString()
  }

  return (
    <div className="space-y-6">
      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-blue-700 flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-6">
            {/* Foto del Paciente */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-32 h-48 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                {patientData?.STRING_FOTO ? (
                  <img 
                    src={`data:image/jpeg;base64,${patientData.STRING_FOTO}`} 
                    alt="Foto del paciente"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-500 text-center max-w-32">Foto RENIEC</p>
            </div>

            {/* Campos del sistema */}
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hc" className="flex items-center text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4 mr-1" />
                  N° Historia Clínica
                </Label>
                <Input 
                  id="hc" 
                  value={patientData?.HISTORIA?.trim() || "Se genera automáticamente"} 
                  disabled 
                  className="bg-gray-50 text-gray-600" 
                />
              </div>
              <div>
                <Label htmlFor="tipoDocumento" className="flex items-center text-sm font-medium text-gray-700">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Tipo de Documento
                </Label>
                <Input id="tipoDocumento" value={documentType} disabled className="bg-gray-50 text-gray-600" />
              </div>
              <div>
                <Label htmlFor="dni" className="flex items-center text-sm font-medium text-gray-700">
                  <Hash className="w-4 h-4 mr-1" />
                  N° Documento
                </Label>
                <Input
                  id="dni"
                  value={reniecData?.dni || documentNumber}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="edad" className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4 mr-1" />
                  Edad
                </Label>
                <Input
                  id="edad"
                  value={
                    formData.fechaNacimiento
                      ? `${calculateAge(formData.fechaNacimiento)} años` 
                      : "Se calcula automáticamente"
                  }
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="codigoPaciente" className="flex items-center text-sm font-medium text-gray-700">
                  <Hash className="w-4 h-4 mr-1" />
                  Código de Paciente
                </Label>
                <Input
                  id="codigoPaciente"
                  value={patientData?.PACIENTE || generatePatientCode()}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="fechaApertura" className="flex items-center text-sm font-medium text-gray-700">
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
    <CardTitle className="text-lg text-blue-700 flex items-center">
      <Calendar className="w-5 h-5 mr-2" />
      Datos Personales
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Apellido Paterno - Apellido Materno - Nombres */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="apellidoPaterno">Apellido Paterno</Label>
        <Input
          id="apellidoPaterno"
          value={formData.apellidoPaterno}
          onChange={(e) => onInputChange("apellidoPaterno", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="apellidoMaterno">Apellido Materno</Label>
        <Input
          id="apellidoMaterno"
          value={formData.apellidoMaterno}
          onChange={(e) => onInputChange("apellidoMaterno", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="nombres">Nombres</Label>
        <Input
          id="nombres"
          value={formData.nombres}
          onChange={(e) => onInputChange("nombres", e.target.value)}
        />
      </div>
    </div>

    {/* Fecha, Sexo y Estado Civil */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="fechaNacimiento">Fecha Nacimiento</Label>
        <Input
          id="fechaNacimiento"
          type="date"
          value={formData.fechaNacimiento}
          onChange={(e) => onInputChange("fechaNacimiento", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="sexo">Sexo</Label>
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
        <Label htmlFor="estadoCivil">Estado Civil</Label>
        <Select value={formData.estadoCivil} onValueChange={(value) => onInputChange("estadoCivil", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="S">Soltero(a)</SelectItem>
            <SelectItem value="C">Casado(a)</SelectItem>
            <SelectItem value="V">Viudo(a)</SelectItem>
            <SelectItem value="D">Divorciado(a)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* País y Lugar de Nacimiento */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <SearchableSelect
        label="País de Nacimiento"
        value={getPaisDisplay()}
        options={filteredPaisOptions}
        search={paisSearch}
        onSearchChange={setPaisSearch}
        onSelect={(option) => {
          onInputChange("paisNacimiento", option.value)
          setPaisSearch("")
        }}
        selectName="paisNacimiento"
        placeholder="Seleccionar país..."
      />
      <SearchableSelect
        label="Lugar Nacimiento (Departamento)"
        value={getDepartamentoDisplay()}
        options={filteredDepartamentoOptions}
        search={departamentoSearch}
        onSearchChange={setDepartamentoSearch}
        onSelect={(option) => {
          onInputChange("lugarNacimiento", option.value)
          setDepartamentoSearch("")
        }}
        selectName="lugarNacimiento"
        placeholder="Seleccionar departamento..."
      />
    </div>

    {/* Dirección y Distrito */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          placeholder="Dirección completa del paciente"
          value={formData.direccion}
          onChange={(e) => onInputChange("direccion", e.target.value)}
        />
      </div>
      <SearchableSelect
        label="Distrito de Procedencia"
        value={getDistritoDisplay()}
        options={filteredDistritoOptions}
        search={distritoSearch}
        onSearchChange={setDistritoSearch}
        onSelect={(option) => {
          onInputChange("distritoProcedencia", option.value)
          setDistritoSearch("")
        }}
        selectName="distritoProcedencia"
        placeholder="Seleccionar distrito..."
      />
    </div>
  </CardContent>
</Card>


    </div>
  )
}
