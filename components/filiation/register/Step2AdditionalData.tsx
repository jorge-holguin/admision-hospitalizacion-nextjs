"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileText, Shield, Loader2 } from "lucide-react"
import { SeguroSelector } from "@/components/hospitalization/selectors/SeguroSelector"
import { 
  GradoInstruccionSelector, 
  OcupacionSelector, 
  ReligionSelector, 
  EtniaSelector, 
  LocalidadSelector 
} from "@/components/filiation/selectors"
import { consultarSIS, mapSISSeguroToLocal } from "@/services/sisService"
import { toast } from "@/hooks/use-toast"

interface Step2AdditionalDataProps {
  formData: any
  onInputChange: (field: string, value: string) => void
  patientData?: any  // Datos del paciente en modo edición
}

export function Step2AdditionalData({ formData, onInputChange, patientData }: Step2AdditionalDataProps) {
  const [isVerifyingSIS, setIsVerifyingSIS] = useState(false)
  const [sisButtonUsed, setSisButtonUsed] = useState(false) // ✅ Controlar uso del botón SIS

  // ✅ Función para verificar SIS manualmente
  const handleVerifySIS = async () => {
    // Obtener DNI del formData o patientData
    const dni = formData.documento || patientData?.documento || patientData?.DOCUMENTO;
    
    if (!dni) {
      toast({
        title: "⚠️ Advertencia",
        description: "Debe ingresar un número de documento para verificar el seguro SIS.",
        variant: "destructive"
      });
      return;
    }

    setIsVerifyingSIS(true);
    try {
      const result = await consultarSIS(dni);

      if (result.success && result.data) {
        const nombreCompleto = formData.nombres || patientData?.nombres || patientData?.NOMBRES || '';
        const seguroId = mapSISSeguroToLocal(result.data.tipoSeguro, nombreCompleto);
        
        onInputChange("tipoSeguro", seguroId);
        setSisButtonUsed(true);
        
        toast({
          title: "✅ Verificación SIS Exitosa",
          description: `Seguro detectado: ${result.data.descTipoSeguro}. Estado: ${result.data.estado}`,
          variant: "default"
        });
      } else {
        // Si no se encontró afiliación, marcar como PAGANTE (0)
        onInputChange("tipoSeguro", "0");
        setSisButtonUsed(true);
        
        toast({
          title: "ℹ️ Sin seguro SIS",
          description: "No se encontró afiliación SIS para este documento. Se estableció como PAGANTE.",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "⚠️ Error",
        description: "No se pudo verificar el seguro SIS en este momento.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingSIS(false);
    }
  };

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
            <Label htmlFor="tipoSeguro">Tipo de Seguro <span className="text-red-600">*</span></Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SeguroSelector
                  value={formData.tipoSeguro}
                  onChange={(value) => onInputChange("tipoSeguro", value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleVerifySIS}
                disabled={isVerifyingSIS || sisButtonUsed}
                className="shrink-0 border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title={sisButtonUsed ? "SIS ya verificado" : "Verificar SIS"}
              >
                {isVerifyingSIS ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="gradoInstruccion">Grado de Instrucción <span className="text-red-600">*</span></Label>
            <GradoInstruccionSelector
              value={formData.gradoInstruccion}
              onChange={(value, reniec) => {
                onInputChange("gradoInstruccion", value)
                if (reniec) onInputChange("gradoInstruccionReniec", reniec)
              }}
            />
          </div>

          <div>
            <Label htmlFor="ocupacion">Ocupación <span className="text-red-600">*</span></Label>
            <OcupacionSelector
              value={formData.ocupacion}
              onChange={(value) => onInputChange("ocupacion", value)}
            />
          </div>
        </div>

        {/* Religión - Etnia - Centro poblado (Localidad) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="religion">Religión<span className="text-red-600">*</span></Label>
            <ReligionSelector
              value={formData.religion}
              onChange={(value) => onInputChange("religion", value)}
            />
          </div>
          <div>
            <Label htmlFor="etnia">Etnia <span className="text-red-600">*</span></Label>
            <EtniaSelector
              value={formData.etnia}
              onChange={(value) => onInputChange("etnia", value)}
            />
          </div>
          <div>
            <Label htmlFor="centroPoblado">Centro Poblado <span className="text-red-600">*</span></Label>
            <LocalidadSelector
              value={formData.centroPoblado}
              onChange={(value) => onInputChange("centroPoblado", value)}
            />
          </div>
        </div>

        {/* Teléfonos e hijos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="telefono1">Teléfono 1 <span className="text-red-600">*</span></Label>
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
              value={formData.hijos || "0"}
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
