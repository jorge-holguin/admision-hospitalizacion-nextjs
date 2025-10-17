"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"
import { SeguroSelector } from "@/components/hospitalization/selectors/SeguroSelector"
import { 
  GradoInstruccionSelector, 
  OcupacionSelector, 
  ReligionSelector, 
  EtniaSelector, 
  LocalidadSelector 
} from "@/components/filiation/selectors"

interface Step2AdditionalDataProps {
  formData: any
  onInputChange: (field: string, value: string) => void
  patientData?: any  // Datos del paciente en modo edición
}

export function Step2AdditionalData({ formData, onInputChange, patientData }: Step2AdditionalDataProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-blue-700 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Datos Adicionales del Paciente
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Seguro - Grado de instrucción - Ocupación */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="tipoSeguro">Tipo de Seguro</Label>
            <SeguroSelector
              value={formData.tipoSeguro}
              onChange={(value) => onInputChange("tipoSeguro", value)}
            />
          </div>

          <div>
            <Label htmlFor="gradoInstruccion">Grado de Instrucción</Label>
            <GradoInstruccionSelector
              value={formData.gradoInstruccion}
              onChange={(value, reniec) => {
                onInputChange("gradoInstruccion", value)
                if (reniec) onInputChange("gradoInstruccionReniec", reniec)
              }}
            />
          </div>

          <div>
            <Label htmlFor="ocupacion">Ocupación</Label>
            <OcupacionSelector
              value={formData.ocupacion}
              onChange={(value) => onInputChange("ocupacion", value)}
            />
          </div>
        </div>

        {/* Religión - Etnia - Centro poblado (Localidad) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="religion">Religión</Label>
            <ReligionSelector
              value={formData.religion}
              onChange={(value) => onInputChange("religion", value)}
            />
          </div>
          <div>
            <Label htmlFor="etnia">Etnia</Label>
            <EtniaSelector
              value={formData.etnia}
              onChange={(value) => onInputChange("etnia", value)}
            />
          </div>
          <div>
            <Label htmlFor="centroPoblado">Centro Poblado</Label>
            <LocalidadSelector
              value={formData.centroPoblado}
              onChange={(value) => onInputChange("centroPoblado", value)}
            />
          </div>
        </div>

        {/* Teléfonos e hijos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="telefono1">Teléfono 1</Label>
            <Input
              id="telefono1"
              placeholder="Número principal"
              value={formData.telefono1}
              onChange={(e) => onInputChange("telefono1", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="telefono2">Teléfono 2</Label>
            <Input
              id="telefono2"
              placeholder="Número secundario"
              value={formData.telefono2}
              onChange={(e) => onInputChange("telefono2", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="hijos">N° Hijos</Label>
            <Input
              id="hijos"
              type="number"
              min="0"
              value={formData.hijos}
              onChange={(e) => onInputChange("hijos", e.target.value)}
            />
          </div>
        </div>

        {/* Correo Electrónico y Observación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="correoElectronico">Correo Electrónico</Label>
            <Input
              id="correoElectronico"
              type="email"
              placeholder="ejemplo@correo.com"
              value={formData.correoElectronico}
              onChange={(e) => onInputChange("correoElectronico", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="observacion">Observación</Label>
            <Textarea
              id="observacion"
              rows={2}
              value={formData.observacion}
              onChange={(e) => onInputChange("observacion", e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
