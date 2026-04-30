"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface DateRangePickerProps {
  from: Date | undefined
  to: Date | undefined
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void
  label?: string
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  from,
  to,
  onSelect,
  label = "Fecha",
  placeholder = "Seleccione rango de fechas",
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempFrom, setTempFrom] = useState<Date | undefined>(from)
  const [tempTo, setTempTo] = useState<Date | undefined>(to)

  // Maneja la selección de un día.
  // Soporta rango de un solo día: cuando ya hay tempFrom y no hay tempTo, al hacer
  // click en el mismo día se establece tempTo = tempFrom (rango de 1 día).
  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    if (!tempFrom || (tempFrom && tempTo)) {
      // Primera selección o reiniciar
      setTempFrom(date)
      setTempTo(undefined)
    } else if (tempFrom && !tempTo) {
      // Segunda selección (permite mismo día)
      if (date < tempFrom) {
        setTempTo(tempFrom)
        setTempFrom(date)
      } else {
        setTempTo(date)
      }
    }
  }

  const handleApply = () => {
    // Si el usuario solo eligió un día, tomarlo como rango de un solo día
    const finalTo = tempTo ?? tempFrom
    onSelect({ from: tempFrom, to: finalTo })
    setIsOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempFrom(from)
      setTempTo(to)
    }
    setIsOpen(open)
  }

  const formatDateRange = () => {
    if (from && to) {
      return `${format(from, "dd/MM/yyyy", { locale: es })} - ${format(to, "dd/MM/yyyy", { locale: es })}`
    }
    if (from) {
      return format(from, "dd/MM/yyyy", { locale: es })
    }
    return placeholder
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-[38px] border-[#9CD2D3]",
              !from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="start">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-[#114C5F]">
                Seleccione rango de fechas
              </h4>
              <p className="text-xs text-gray-500">
                {tempFrom && !tempTo && "Seleccione la fecha final"}
                {tempFrom && tempTo &&
                  `${format(tempFrom, "dd/MM/yyyy")} - ${format(tempTo, "dd/MM/yyyy")}`}
                {!tempFrom && "Seleccione la fecha inicial"}
              </p>
            </div>
            <Calendar
              mode="single"
              selected={tempFrom}
              onSelect={handleSelect}
              locale={es}
              className="rounded-md border bg-white"
              modifiers={{
                start: tempFrom ? [tempFrom] : [],
                end: tempTo ? [tempTo] : [],
                range:
                  tempFrom && tempTo
                    ? { from: tempFrom, to: tempTo }
                    : [],
              }}
              modifiersStyles={{
                start: {
                  backgroundColor: "#4F9BB6",
                  color: "white",
                  fontWeight: "bold",
                },
                end: {
                  backgroundColor: "#4F9BB6",
                  color: "white",
                  fontWeight: "bold",
                },
                range: {
                  backgroundColor: "#9CD2D3",
                  color: "#114C5F",
                },
              }}
            />
            <div className="flex">
              <Button
                onClick={handleApply}
                className="w-full bg-[#4F9BB6] hover:bg-[#4A6EB0] text-white"
                disabled={!tempFrom}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
