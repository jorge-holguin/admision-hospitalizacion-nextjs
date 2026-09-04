"use client"

import React, { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"

export interface EstadoOption {
  value: string
  label: string
  color: string
}

interface EstadoSelectorProps {
  label?: string
  value: string | "all"
  onChange: (value: string | "all") => void
  className?: string
  options?: EstadoOption[]
}

export const ESTADO_OPTIONS: EstadoOption[] = [
  { value: "1", label: "NO OTORGADA", color: "bg-gray-500" },
  { value: "2", label: "SIN PAGO O FUA", color: "bg-yellow-500" },
  { value: "3", label: "PAGADO O FUA", color: "bg-blue-500" },
  { value: "4", label: "ATENDIDO", color: "bg-green-500" },
  { value: "5", label: "DESERCION", color: "bg-red-500" },
]

export function EstadoSelector({ label = "Estado", value, onChange, className = "", options = ESTADO_OPTIONS }: EstadoSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const display = useMemo(() => {
    if (value === "all" || !value) return "Seleccionar estado..."
    const found = options.find(o => o.value === value)
    return found?.label ?? value
  }, [value, options])

  return (
    <div className={className}>
      {label && <Label className="text-sm font-semibold text-gray-700">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {display}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Buscar estado..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onChange("all")
                    setOpen(false)
                  }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === "all" ? "opacity-100" : "opacity-0"}`} />
                  Todos los estados
                </CommandItem>
                {options
                  .filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
                  .map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.value}
                    onSelect={() => {
                      onChange(o.value)
                      setOpen(false)
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${value === o.value ? "opacity-100" : "opacity-0"}`} />
                    <div className="flex flex-wrap items-center">
                      <div className={`w-3 h-3 rounded-full ${o.color} mr-2`}></div>
                      {o.label}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandEmpty>No se encontraron estados</CommandEmpty>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
