"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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

const procedencias = [
  { value: "EM", label: "EM - Emergencia" },
  { value: "CE", label: "CE - Consulta Externa" },
  { value: "RN", label: "RN - Recién Nacido" },
]

interface ProcedenciaSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function ProcedenciaSelector({ value, onChange, disabled = false, className }: ProcedenciaSelectorProps) {
  const [open, setOpen] = React.useState(false)
  
  // Encontrar la etiqueta correspondiente al valor actual
  const selectedProcedencia = procedencias.find(item => item.value === value)
  const displayValue = selectedProcedencia ? selectedProcedencia.label : value

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          {displayValue || "Seleccionar procedencia..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar procedencia..." />
          <CommandEmpty>No se encontró procedencia.</CommandEmpty>
          <CommandGroup>
            {procedencias.map((item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={(currentValue) => {
                  onChange(currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
