"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ArrowLeft, Save, X, HelpCircle } from 'lucide-react'

interface EmergencyRegisterFormProps {
  initialData?: any
  mode: "new" | "edit" | "view"
  onSave: (data: any) => void
  onCancel: () => void
}

export default function EmergencyRegisterForm({ initialData, mode, onSave, onCancel }: EmergencyRegisterFormProps) {
  const [formData, setFormData] = useState(
    initialData || {
      fechaAtencion: new Date().toLocaleDateString("es-ES"),
      hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      orden: "",
      id: "",
      fNacimiento: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      nombres: "",
      historiaClinica: "0",
      consultorioServicio: "",
      imprimirHoja: false,
      atencionPorUrgencia: false,
      edad: "",
      sexo: "",
      estadoCivil: "S [SOLTERO]",
      formaIngreso: "1 [Caminando]",
      telefono1: "",
      telefono2: "",
      domicilio: "",
      localidad: "",
      distrito: "",
      docIdentidad: "D [DNI]",
      nroDoc: "",
      religion: "0",
      acompanante: "",
      docAcompanante: "D [DNI]",
      nroDocAcompanante: "",
      motivoIngreso: "0",
      observacion: "",
      seguroPaciente: "0",
      condicionPaciente: "",
      nroCuentaSis: "",
    },
  )

  const [openSelects, setOpenSelects] = useState({
    estadoCivil: false,
    formaIngreso: false,
    docIdentidad: false,
    docAcompanante: false,
    motivoIngreso: false,
    seguroPaciente: false,
  })

  useEffect(() => {
    if (initialData && mode !== "new") {
      setFormData(initialData)
    } else if (mode === "new") {
      setFormData({
        fechaAtencion: new Date().toLocaleDateString("es-ES"),
        hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        orden: "",
        id: "",
        fNacimiento: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        nombres: "",
        historiaClinica: "0",
        consultorioServicio: "",
        imprimirHoja: false,
        atencionPorUrgencia: false,
        edad: "",
        sexo: "",
        estadoCivil: "S [SOLTERO]",
        formaIngreso: "1 [Caminando]",
        telefono1: "",
        telefono2: "",
        domicilio: "",
        localidad: "",
        distrito: "",
        docIdentidad: "D [DNI]",
        nroDoc: "",
        religion: "0",
        acompanante: "",
        docAcompanante: "D [DNI]",
        nroDocAcompanante: "",
        motivoIngreso: "0",
        observacion: "",
        seguroPaciente: "0",
        condicionPaciente: "",
        nroCuentaSis: "",
      })
    }
  }, [initialData, mode])

  const estadoCivilOptions = ["S [SOLTERO]", "C [CASADO]", "D [DIVORCIADO]", "V [VIUDO]"]
  const formaIngresoOptions = ["1 [Caminando]", "2 [Silla de Ruedas]", "3 [Camilla]"]
  const docIdentidadOptions = ["D [DNI]", "C [CARNET DE EXTRANJERIA]", "P [PASAPORTE]"]
  const motivoIngresoOptions = ["0 [Otros]", "Enfermedad Súbita", "Accidente", "Dolor Abdominal"]
  const seguroPacienteOptions = ["0 [SIS PEAS COMPLETO]", "SIS PEAS (DU046)", "SIS PEAS COMPLEMENTARIO"]

  const isReadOnly = mode === "view"

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isReadOnly) return
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (isReadOnly) return
    setFormData((prev) => ({ ...prev, [name]: value }))
    setOpenSelects((prev) => ({ ...prev, [name]: false }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    if (isReadOnly) return
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly) return // Should not happen if button is hidden
    console.log("Form Data Submitted:", formData)
    alert(`Hoja de Emergencia ${mode === "new" ? "guardada" : "actualizada"} exitosamente!`)
    onSave(formData)
  }

  return (
    <div className="p-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="text-xl text-blue-800 font-semibold tracking-tight">
            {mode === "new"
              ? "NUEVA HOJA DE EMERGENCIA"
              : mode === "edit"
                ? "EDITAR HOJA DE EMERGENCIA"
                : "VER HOJA DE EMERGENCIA"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border border-gray-300 rounded-md bg-gray-100">
              <div>
                <Label htmlFor="fechaAtencion" className="text-sm font-semibold text-gray-700">
                  Fecha de Atención:
                </Label>
                <Input
                  id="fechaAtencion"
                  name="fechaAtencion"
                  type="text"
                  value={formData.fechaAtencion}
                  onChange={handleChange}
                  className="mt-1 font-medium"
                  readOnly={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="hora" className="text-sm font-semibold text-gray-700">
                  Hora:
                </Label>
                <Input
                  id="hora"
                  name="hora"
                  type="text"
                  value={formData.hora}
                  onChange={handleChange}
                  className="mt-1 font-medium"
                  readOnly={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="orden" className="text-sm font-semibold text-gray-700">
                  Orden:
                </Label>
                <Input
                  id="orden"
                  name="orden"
                  type="text"
                  value={formData.orden}
                  onChange={handleChange}
                  className="mt-1 font-medium"
                  readOnly={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="id" className="text-sm font-semibold text-gray-700">
                  ID:
                </Label>
                <Input
                  id="id"
                  name="id"
                  type="text"
                  value={formData.id}
                  onChange={handleChange}
                  className="mt-1 font-medium"
                  readOnly={isReadOnly}
                />
              </div>

              <div className="col-span-full grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <Label htmlFor="fNacimiento" className="text-sm font-semibold text-gray-700">
                    F.Nacimiento.
                  </Label>
                  <Input
                    id="fNacimiento"
                    name="fNacimiento"
                    type="text"
                    value={formData.fNacimiento}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    placeholder="//"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="apellidoPaterno" className="text-sm font-semibold text-gray-700">
                    Apellido Paterno
                  </Label>
                  <Input
                    id="apellidoPaterno"
                    name="apellidoPaterno"
                    type="text"
                    value={formData.apellidoPaterno}
                    onChange={handleChange}
                    className="mt-1 font-medium bg-yellow-100"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="apellidoMaterno" className="text-sm font-semibold text-gray-700">
                    Apellido Materno
                  </Label>
                  <Input
                    id="apellidoMaterno"
                    name="apellidoMaterno"
                    type="text"
                    value={formData.apellidoMaterno}
                    onChange={handleChange}
                    className="mt-1 font-medium bg-yellow-100"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="nombres" className="text-sm font-semibold text-gray-700">
                    Nombres
                  </Label>
                  <Input
                    id="nombres"
                    name="nombres"
                    type="text"
                    value={formData.nombres}
                    onChange={handleChange}
                    className="mt-1 font-medium bg-yellow-100"
                    readOnly={isReadOnly}
                  />
                </div>
              </div>

              <div className="col-span-full grid grid-cols-1 md:grid-cols-4 gap-4 items-center mt-4">
                <div>
                  <Label htmlFor="historiaClinica" className="text-sm font-semibold text-gray-700">
                    Historia Clínica
                  </Label>
                  <Input
                    id="historiaClinica"
                    name="historiaClinica"
                    type="text"
                    value={formData.historiaClinica}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="consultorioServicio" className="text-sm font-semibold text-gray-700">
                    Consultorio/Servicio
                  </Label>
                  <Input
                    id="consultorioServicio"
                    name="consultorioServicio"
                    type="text"
                    value={formData.consultorioServicio}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="imprimirHoja"
                      checked={formData.imprimirHoja}
                      onCheckedChange={(checked) => handleCheckboxChange("imprimirHoja", !!checked)}
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="imprimirHoja" className="text-sm font-medium text-gray-700">
                      ¿Imprimir Hoja?
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="atencionPorUrgencia"
                      checked={formData.atencionPorUrgencia}
                      onCheckedChange={(checked) => handleCheckboxChange("atencionPorUrgencia", !!checked)}
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="atencionPorUrgencia" className="text-sm font-medium text-gray-700">
                      Atención por Urgencia
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab 0 Section */}
            <div className="p-4 border border-gray-300 rounded-md bg-gray-100">
              <h3 className="text-red-600 text-center font-bold mb-4">Detalle de la Hoja de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edad" className="text-sm font-semibold text-gray-700">
                    Edad:
                  </Label>
                  <Input
                    id="edad"
                    name="edad"
                    type="text"
                    value={formData.edad}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="sexo" className="text-sm font-semibold text-gray-700">
                    Sexo:
                  </Label>
                  <Input
                    id="sexo"
                    name="sexo"
                    type="text"
                    value={formData.sexo}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="estadoCivil" className="text-sm font-semibold text-gray-700">
                    Estado Civil:
                  </Label>
                  <Popover
                    open={openSelects.estadoCivil}
                    onOpenChange={(open) => setOpenSelects({ ...openSelects, estadoCivil: open })}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSelects.estadoCivil}
                        className="w-full justify-between mt-1 bg-white font-medium text-left"
                        disabled={isReadOnly}
                      >
                        <span className="truncate">{formData.estadoCivil || "Seleccionar..."}</span>
                        <ArrowLeft className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar estado civil..." className="font-medium" />
                        <CommandList>
                          <CommandEmpty className="font-medium text-gray-500">
                            No se encontraron resultados.
                          </CommandEmpty>
                          <CommandGroup>
                            {estadoCivilOptions.map((option) => (
                              <CommandItem
                                key={option}
                                value={option}
                                onSelect={() => handleSelectChange("estadoCivil", option)}
                                className="font-medium"
                              >
                                <ArrowLeft
                                  className={
                                    formData.estadoCivil === option
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

                <div>
                  <Label htmlFor="formaIngreso" className="text-sm font-semibold text-gray-700">
                    Forma Ingreso:
                  </Label>
                  <Popover
                    open={openSelects.formaIngreso}
                    onOpenChange={(open) => setOpenSelects({ ...openSelects, formaIngreso: open })}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSelects.formaIngreso}
                        className="w-full justify-between mt-1 bg-white font-medium text-left"
                        disabled={isReadOnly}
                      >
                        <span className="truncate">{formData.formaIngreso || "Seleccionar..."}</span>
                        <ArrowLeft className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar forma de ingreso..." className="font-medium" />
                        <CommandList>
                          <CommandEmpty className="font-medium text-gray-500">
                            No se encontraron resultados.
                          </CommandEmpty>
                          <CommandGroup>
                            {formaIngresoOptions.map((option) => (
                              <CommandItem
                                key={option}
                                value={option}
                                onSelect={() => handleSelectChange("formaIngreso", option)}
                                className="font-medium"
                              >
                                <ArrowLeft
                                  className={
                                    formData.formaIngreso === option
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
                <div>
                  <Label htmlFor="telefono1" className="text-sm font-semibold text-gray-700">
                    Teléfono 1:
                  </Label>
                  <Input
                    id="telefono1"
                    name="telefono1"
                    type="text"
                    value={formData.telefono1}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="telefono2" className="text-sm font-semibold text-gray-700">
                    Teléfono 2:
                  </Label>
                  <Input
                    id="telefono2"
                    name="telefono2"
                    type="text"
                    value={formData.telefono2}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>

                <div className="col-span-full">
                  <Label htmlFor="domicilio" className="text-sm font-semibold text-gray-700">
                    Domicilio:
                  </Label>
                  <Input
                    id="domicilio"
                    name="domicilio"
                    type="text"
                    value={formData.domicilio}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>

                <div>
                  <Label htmlFor="distrito" className="text-sm font-semibold text-gray-700">
                    Distrito:
                  </Label>
                  <Input
                    id="distrito"
                    name="distrito"
                    type="text"
                    value={formData.distrito}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="docIdentidad" className="text-sm font-semibold text-gray-700">
                    Doc. de Identidad:
                  </Label>
                  <Popover
                    open={openSelects.docIdentidad}
                    onOpenChange={(open) => setOpenSelects({ ...openSelects, docIdentidad: open })}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSelects.docIdentidad}
                        className="w-full justify-between mt-1 bg-white font-medium text-left"
                        disabled={isReadOnly}
                      >
                        <span className="truncate">{formData.docIdentidad || "Seleccionar..."}</span>
                        <ArrowLeft className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar tipo de documento..." className="font-medium" />
                        <CommandList>
                          <CommandEmpty className="font-medium text-gray-500">
                            No se encontraron resultados.
                          </CommandEmpty>
                          <CommandGroup>
                            {docIdentidadOptions.map((option) => (
                              <CommandItem
                                key={option}
                                value={option}
                                onSelect={() => handleSelectChange("docIdentidad", option)}
                                className="font-medium"
                              >
                                <ArrowLeft
                                  className={
                                    formData.docIdentidad === option
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
                <div>
                  <Label htmlFor="nroDoc" className="text-sm font-semibold text-gray-700">
                    Nro. Doc.:
                  </Label>
                  <Input
                    id="nroDoc"
                    name="nroDoc"
                    type="text"
                    value={formData.nroDoc}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>

                <div>
                  <Label htmlFor="localidad" className="text-sm font-semibold text-gray-700">
                    Localidad:
                  </Label>
                  <Input
                    id="localidad"
                    name="localidad"
                    type="text"
                    value={formData.localidad}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="religion" className="text-sm font-semibold text-gray-700">
                    Religión:
                  </Label>
                  <Input
                    id="religion"
                    name="religion"
                    type="text"
                    value={formData.religion}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>

                <div>
                  <Label htmlFor="acompanante" className="text-sm font-semibold text-gray-700">
                    Acompañante:
                  </Label>
                  <Input
                    id="acompanante"
                    name="acompanante"
                    type="text"
                    value={formData.acompanante}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="docAcompanante" className="text-sm font-semibold text-gray-700">
                    Doc. Acompañante:
                  </Label>
                  <Popover
                    open={openSelects.docAcompanante}
                    onOpenChange={(open) => setOpenSelects({ ...openSelects, docAcompanante: open })}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSelects.docAcompanante}
                        className="w-full justify-between mt-1 bg-white font-medium text-left"
                        disabled={isReadOnly}
                      >
                        <span className="truncate">{formData.docAcompanante || "Seleccionar..."}</span>
                        <ArrowLeft className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar tipo de documento..." className="font-medium" />
                        <CommandList>
                          <CommandEmpty className="font-medium text-gray-500">
                            No se encontraron resultados.
                          </CommandEmpty>
                          <CommandGroup>
                            {docIdentidadOptions.map((option) => (
                              <CommandItem
                                key={option}
                                value={option}
                                onSelect={() => handleSelectChange("docAcompanante", option)}
                                className="font-medium"
                              >
                                <ArrowLeft
                                  className={
                                    formData.docAcompanante === option
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
                <div>
                  <Label htmlFor="nroDocAcompanante" className="text-sm font-semibold text-gray-700">
                    Nro. Doc.:
                  </Label>
                  <Input
                    id="nroDocAcompanante"
                    name="nroDocAcompanante"
                    type="text"
                    value={formData.nroDocAcompanante}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>

                <div>
                  <Label htmlFor="motivoIngreso" className="text-sm font-semibold text-gray-700">
                    Motivo de Ingreso:
                  </Label>
                  <Popover
                    open={openSelects.motivoIngreso}
                    onOpenChange={(open) => setOpenSelects({ ...openSelects, motivoIngreso: open })}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSelects.motivoIngreso}
                        className="w-full justify-between mt-1 bg-white font-medium text-left"
                        disabled={isReadOnly}
                      >
                        <span className="truncate">{formData.motivoIngreso || "Seleccionar..."}</span>
                        <ArrowLeft className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar motivo de ingreso..." className="font-medium" />
                        <CommandList>
                          <CommandEmpty className="font-medium text-gray-500">
                            No se encontraron resultados.
                          </CommandEmpty>
                          <CommandGroup>
                            {motivoIngresoOptions.map((option) => (
                              <CommandItem
                                key={option}
                                value={option}
                                onSelect={() => handleSelectChange("motivoIngreso", option)}
                                className="font-medium"
                              >
                                <ArrowLeft
                                  className={
                                    formData.motivoIngreso === option
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
                <div className="col-span-2">
                  <Label htmlFor="observacion" className="text-sm font-semibold text-gray-700">
                    Observación:
                  </Label>
                  <Input
                    id="observacion"
                    name="observacion"
                    type="text"
                    value={formData.observacion}
                    onChange={handleChange}
                    className="mt-1 font-medium bg-yellow-100"
                    readOnly={isReadOnly}
                  />
                </div>

                <div>
                  <Label htmlFor="seguroPaciente" className="text-sm font-semibold text-gray-700">
                    Seguro del Paciente:
                  </Label>
                  <Popover
                    open={openSelects.seguroPaciente}
                    onOpenChange={(open) => setOpenSelects({ ...openSelects, seguroPaciente: open })}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSelects.seguroPaciente}
                        className="w-full justify-between mt-1 bg-white font-medium text-left"
                        disabled={isReadOnly}
                      >
                        <span className="truncate">{formData.seguroPaciente || "Seleccionar..."}</span>
                        <ArrowLeft className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar seguro..." className="font-medium" />
                        <CommandList>
                          <CommandEmpty className="font-medium text-gray-500">
                            No se encontraron resultados.
                          </CommandEmpty>
                          <CommandGroup>
                            {seguroPacienteOptions.map((option) => (
                              <CommandItem
                                key={option}
                                value={option}
                                onSelect={() => handleSelectChange("seguroPaciente", option)}
                                className="font-medium"
                              >
                                <ArrowLeft
                                  className={
                                    formData.seguroPaciente === option
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
                <div>
                  <Label htmlFor="condicionPaciente" className="text-sm font-semibold text-gray-700">
                    Condición del Paciente:
                  </Label>
                  <Input
                    id="condicionPaciente"
                    name="condicionPaciente"
                    type="text"
                    value={formData.condicionPaciente}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="nroCuentaSis" className="text-sm font-semibold text-gray-700">
                    Nº de Cuenta (SIS):
                  </Label>
                  <Input
                    id="nroCuentaSis"
                    name="nroCuentaSis"
                    type="text"
                    value={formData.nroCuentaSis}
                    onChange={handleChange}
                    className="mt-1 font-medium"
                    readOnly={isReadOnly}
                  />
                </div>
              </div>
            </div>

            {/* Help Text and Action Buttons */}
            <div className="flex justify-between items-center mt-6">
              <div className="flex items-center text-sm text-gray-600">
                <HelpCircle className="w-5 h-5 mr-2 text-purple-600" />
                <span>Si necesita ayuda pulse F1 en el dato.</span>
              </div>
              <div className="flex space-x-4">
                {mode !== "view" && (
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8 font-semibold">
                    <Save className="w-4 h-4 mr-2" />
                    Grabar (F5)
                  </Button>
                )}
                <Button variant="outline" onClick={onCancel} className="px-8 bg-white font-semibold">
                  {mode === "view" ? "Volver" : "Cancelar"}
                  {mode !== "view" && <X className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
