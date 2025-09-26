"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, FileText } from "lucide-react"

interface Step2AdditionalDataProps {
  formData: any
  onInputChange: (field: string, value: string) => void
}

const occupationOptions = [
  "ESTUDIANTE",
  "EMPLEADO",
  "OBRERO",
  "COMERCIANTE",
  "PROFESIONAL",
  "TECNICO",
  "AGRICULTOR",
  "GANADERO",
  "PESCADOR",
  "ARTESANO",
  "CONDUCTOR",
  "DOMESTICA",
  "JUBILADO",
  "DESEMPLEADO",
  "OTROS",
]

export function Step2AdditionalData({ formData, onInputChange }: Step2AdditionalDataProps) {
  const [openOccupation, setOpenOccupation] = useState(false)

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
            <Select value={formData.tipoSeguro} onValueChange={(value) => onInputChange("tipoSeguro", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar seguro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIS">SIS</SelectItem>
                <SelectItem value="ESSALUD">ESSALUD</SelectItem>
                <SelectItem value="PARTICULAR">PARTICULAR</SelectItem>
                <SelectItem value="OTRO">OTRO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="gradoInstruccion">Grado de Instrucción</Label>
            <Select
              value={formData.gradoInstruccion}
              onValueChange={(value) => onInputChange("gradoInstruccion", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIMARIA">Primaria</SelectItem>
                <SelectItem value="SECUNDARIA">Secundaria</SelectItem>
                <SelectItem value="SUPERIOR">Superior</SelectItem>
                <SelectItem value="NINGUNO">Ninguno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="ocupacion">Ocupación</Label>
            <Popover open={openOccupation} onOpenChange={setOpenOccupation}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openOccupation}
                  className="w-full justify-between bg-transparent"
                >
                  {formData.ocupacion || "Seleccionar ocupación..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar ocupación..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                    <CommandGroup>
                      {occupationOptions.map((option) => (
                        <CommandItem
                          key={option}
                          value={option}
                          onSelect={() => {
                            onInputChange("ocupacion", option)
                            setOpenOccupation(false)
                          }}
                        >
                          <Check
                            className={
                              formData.ocupacion === option ? "mr-2 h-4 w-4 opacity-100" : "mr-2 h-4 w-4 opacity-0"
                            }
                          />
                          {option}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Religión - Etnia - Centro poblado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="religion">Religión</Label>
            <Input
              id="religion"
              value={formData.religion}
              onChange={(e) => onInputChange("religion", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="etnia">Etnia</Label>
            <Input
              id="etnia"
              value={formData.etnia}
              onChange={(e) => onInputChange("etnia", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="centroPoblado">Centro Poblado</Label>
            <Input
              id="centroPoblado"
              value={formData.centroPoblado}
              onChange={(e) => onInputChange("centroPoblado", e.target.value)}
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

        {/* Observación */}
        <div>
          <Label htmlFor="observacion">Observación</Label>
          <Textarea
            id="observacion"
            rows={3}
            value={formData.observacion}
            onChange={(e) => onInputChange("observacion", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
