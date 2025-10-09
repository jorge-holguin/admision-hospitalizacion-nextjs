"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Users, Heart } from "lucide-react"

interface Step3FamilyDataProps {
  formData: any
  onInputChange: (field: string, value: string) => void
  patientData?: any  // Datos del paciente en modo edición
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

export function Step3FamilyData({ formData, onInputChange }: Step3FamilyDataProps) {
  const [openFamilyOccupation, setOpenFamilyOccupation] = useState(false)
  const [openCompanionOccupation, setOpenCompanionOccupation] = useState(false)

  return (
    <div className="space-y-6">
      {/* Datos Familiares */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-blue-700 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Datos Familiares (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="padre">Nombre del Padre</Label>
              <Input
                id="padre"
                placeholder="Apellidos y nombres completos"
                value={formData.padre}
                onChange={(e) => onInputChange("padre", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="madre">Nombre de la Madre</Label>
              <Input
                id="madre"
                placeholder="Apellidos y nombres completos"
                value={formData.madre}
                onChange={(e) => onInputChange("madre", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="conyuge">Cónyuge</Label>
              <Input
                id="conyuge"
                placeholder="Apellidos y nombres completos"
                value={formData.conyuge}
                onChange={(e) => onInputChange("conyuge", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ocupacionFamiliar">Ocupación Familiar Principal</Label>
              <Popover open={openFamilyOccupation} onOpenChange={setOpenFamilyOccupation}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openFamilyOccupation}
                    className="w-full justify-between bg-transparent"
                  >
                    {formData.ocupacionFamiliar || "Seleccionar ocupación..."}
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
                              onInputChange("ocupacionFamiliar", option)
                              setOpenFamilyOccupation(false)
                            }}
                          >
                            <Check
                              className={
                                formData.ocupacionFamiliar === option
                                  ? "mr-2 h-4 w-4 opacity-100"
                                  : "mr-2 h-4 w-4 opacity-0"
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
        </CardContent>
      </Card>

      {/* Datos de Acompañante/Responsable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-blue-700 flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            Datos de Acompañante/Responsable (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre */}
          <div>
            <Label htmlFor="nombreAcompanante">Apellidos y Nombres del Acompañante</Label>
            <Input
              id="nombreAcompanante"
              placeholder="Nombres completos del acompañante"
              value={formData.nombreAcompanante}
              onChange={(e) => onInputChange("nombreAcompanante", e.target.value)}
            />
          </div>

          {/* Parentesco y Ocupación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parentesco">Parentesco</Label>
              <Select value={formData.parentesco} onValueChange={(value) => onInputChange("parentesco", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar parentesco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PADRE">Padre</SelectItem>
                  <SelectItem value="MADRE">Madre</SelectItem>
                  <SelectItem value="HIJO">Hijo(a)</SelectItem>
                  <SelectItem value="HERMANO">Hermano(a)</SelectItem>
                  <SelectItem value="CONYUGE">Cónyuge</SelectItem>
                  <SelectItem value="TIO">Tío(a)</SelectItem>
                  <SelectItem value="PRIMO">Primo(a)</SelectItem>
                  <SelectItem value="ABUELO">Abuelo(a)</SelectItem>
                  <SelectItem value="AMIGO">Amigo(a)</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ocupacionAcompanante">Ocupación del Acompañante</Label>
              <Popover open={openCompanionOccupation} onOpenChange={setOpenCompanionOccupation}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCompanionOccupation}
                    className="w-full justify-between bg-transparent"
                  >
                    {formData.ocupacionAcompanante || "Seleccionar ocupación..."}
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
                              onInputChange("ocupacionAcompanante", option)
                              setOpenCompanionOccupation(false)
                            }}
                          >
                            <Check
                              className={
                                formData.ocupacionAcompanante === option
                                  ? "mr-2 h-4 w-4 opacity-100"
                                  : "mr-2 h-4 w-4 opacity-0"
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

          {/* Dirección + Teléfono en una sola fila */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="direccionAcompanante">Dirección del Acompañante</Label>
              <Input
                id="direccionAcompanante"
                placeholder="Dirección completa"
                value={formData.direccionAcompanante}
                onChange={(e) => onInputChange("direccionAcompanante", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="telefonoAcompanante1">Teléfono</Label>
              <Input
                id="telefonoAcompanante1"
                placeholder="Número principal"
                value={formData.telefonoAcompanante1}
                onChange={(e) => onInputChange("telefonoAcompanante1", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
