"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { getProfesionesColegio, type ProfesionColegio } from "@/services/master-tables/profesionesColegioService"

interface ProfesionColegioSelectorProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  disabled?: boolean
}

export function ProfesionColegioSelector({
  value,
  onChange,
  label = "Profesión",
  required = false,
  disabled = false
}: ProfesionColegioSelectorProps) {
  const [open, setOpen] = useState(false)
  const [profesiones, setProfesiones] = useState<ProfesionColegio[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfesiones()
  }, [])

  const loadProfesiones = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProfesionesColegio()
      // Filtrar solo las activas
      const activas = data.filter(p => Number(p.ACTIVO) === 1)
      setProfesiones(activas)
    } catch (err) {
      console.error('Error loading profesiones:', err)
      setError('Error al cargar profesiones')
    } finally {
      setLoading(false)
    }
  }

  const selectedProfesion = profesiones.find(p => p.id_profesion === value)

  return (
    <div className="space-y-2">
      {label && (
        <Label className="flex items-center">
          <GraduationCap className="mr-2 h-4 w-4" /> 
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
              </>
            ) : selectedProfesion ? (
              <span className="truncate">
                {selectedProfesion.Profesion} - {selectedProfesion.Colegio}
              </span>
            ) : (
              <span className="text-muted-foreground">Seleccionar profesión...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full max-w-[400px] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
          <Command>
            <CommandInput placeholder="Buscar profesión..." />
            <CommandEmpty>
              {error ? error : "No se encontró profesión."}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto overscroll-contain">
              {profesiones.map((profesion) => (
                <CommandItem
                  key={profesion.id_profesion}
                  value={`${profesion.Profesion} ${profesion.Colegio}`}
                  onSelect={() => {
                    onChange(profesion.id_profesion)
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0",
                      value === profesion.id_profesion ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col truncate">
                    <span className="font-medium truncate">{profesion.Profesion}</span>
                    <span className="text-xs text-muted-foreground truncate">{profesion.Colegio}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
