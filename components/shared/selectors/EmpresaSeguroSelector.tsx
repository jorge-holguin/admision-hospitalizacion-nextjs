"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface EmpresaSeguro {
  EMPRESASEGURO: string
  NOMBRE: string
}

interface EmpresaSeguroSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function EmpresaSeguroSelector({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Seleccione empresa de seguro..."
}: EmpresaSeguroSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [empresas, setEmpresas] = React.useState<EmpresaSeguro[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Cargar empresas de seguro al montar el componente
  React.useEffect(() => {
    const fetchEmpresas = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/emergency/empresas-seguro')
        if (response.ok) {
          const data = await response.json()
          setEmpresas(data || [])
        } else {
          console.error('Error al cargar empresas de seguro')
        }
      } catch (error) {
        console.error('Error al cargar empresas de seguro:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresas()
  }, [])

  // Filtrar empresas basado en la búsqueda
  const filteredEmpresas = React.useMemo(() => {
    if (!searchQuery) return empresas
    const query = searchQuery.toLowerCase()
    return empresas.filter(empresa => 
      empresa.NOMBRE?.toLowerCase().includes(query) ||
      empresa.EMPRESASEGURO?.toLowerCase().includes(query)
    )
  }, [empresas, searchQuery])

  // Obtener el nombre de la empresa seleccionada
  const selectedEmpresa = React.useMemo(() => {
    return empresas.find(e => e.EMPRESASEGURO?.trim() === value?.trim())
  }, [empresas, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </span>
          ) : selectedEmpresa ? (
            <span className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span className="truncate">{selectedEmpresa.NOMBRE?.trim()}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar empresa..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Cargando..." : "No se encontraron empresas."}
            </CommandEmpty>
            <CommandGroup>
              {/* Opción para limpiar selección */}
              <CommandItem
                value=""
                onSelect={() => {
                  onChange("")
                  setOpen(false)
                  setSearchQuery("")
                }}
                className="text-gray-500"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="italic">Sin empresa de seguro</span>
              </CommandItem>
              
              {filteredEmpresas.map((empresa) => (
                <CommandItem
                  key={empresa.EMPRESASEGURO}
                  value={empresa.EMPRESASEGURO}
                  onSelect={() => {
                    onChange(empresa.EMPRESASEGURO?.trim() || "")
                    setOpen(false)
                    setSearchQuery("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.trim() === empresa.EMPRESASEGURO?.trim()
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{empresa.NOMBRE?.trim()}</span>
                    <span className="text-xs text-gray-500">
                      Código: {empresa.EMPRESASEGURO?.trim()}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default EmpresaSeguroSelector
