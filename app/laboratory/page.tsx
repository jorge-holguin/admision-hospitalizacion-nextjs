"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Search, FlaskConical } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { LaboratoryTable } from "@/components/laboratory/LaboratoryTable"

export default function LaboratoryPage() {
  const [date, setDate] = useState<Date>(new Date())
  const [origen, setOrigen] = useState<string>("CE")
  const [estado, setEstado] = useState<string>("1")
  const [searchType, setSearchType] = useState<string>("historia")
  const [searchValue, setSearchValue] = useState<string>("")
  const [useIdCita, setUseIdCita] = useState<boolean>(false)
  const [idCita, setIdCita] = useState<string>("")

  const handleSearch = () => {
    // Implementar búsqueda cuando se conecten los endpoints
  }

  const handleReset = () => {
    setDate(new Date())
    setOrigen("CE")
    setEstado("1")
    setSearchType("historia")
    setSearchValue("")
    setUseIdCita(false)
    setIdCita("")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FlaskConical className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Citas Laboratorio</h1>
            <p className="text-gray-600">Gestión de citas de laboratorio</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-blue-800">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origen">Origen</Label>
              <Select value={origen} onValueChange={setOrigen}>
                <SelectTrigger id="origen">
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CE">Consulta Externa</SelectItem>
                  <SelectItem value="E">Emergencia</SelectItem>
                  <SelectItem value="H">Hospitalización</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Anulado</SelectItem>
                  <SelectItem value="1">Pendiente</SelectItem>
                  <SelectItem value="2">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchType">Tipo de Búsqueda</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger id="searchType">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="historia">Historia Clínica</SelectItem>
                  <SelectItem value="nombres">Apellidos y Nombres</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchValue">
                {searchType === "historia" ? "N° Historia Clínica" : "Apellidos y Nombres"}
              </Label>
              <Input
                id="searchValue"
                placeholder={searchType === "historia" ? "Ingrese N° Historia" : "Ingrese Apellidos y Nombres"}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                disabled={useIdCita}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="useIdCita"
                  checked={useIdCita}
                  onCheckedChange={(checked) => {
                    setUseIdCita(checked as boolean)
                    if (checked) setSearchValue("")
                  }}
                />
                <Label htmlFor="useIdCita" className="cursor-pointer">
                  Buscar por ID de Cita
                </Label>
              </div>
              <Input
                id="idCita"
                placeholder="Ingrese ID de Cita"
                value={idCita}
                onChange={(e) => setIdCita(e.target.value)}
                disabled={!useIdCita}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleReset}>
              Limpiar
            </Button>
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <LaboratoryTable
        fecha={date}
        origen={origen}
        estado={estado}
        searchType={searchType}
        searchValue={searchValue}
        useIdCita={useIdCita}
        idCita={idCita}
      />
    </div>
  )
}
