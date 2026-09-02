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
import { type DateRange } from "react-day-picker"

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
  const [tempRange, setTempRange] = useState<DateRange | undefined>({ from, to })

  const handleSelect = (range: DateRange | undefined) => {
    setTempRange(range)
    if (range?.from && range?.to) {
      onSelect({ from: range.from, to: range.to })
      setIsOpen(false)
    }
  }

  const handleApply = () => {
    const finalFrom = tempRange?.from
    const finalTo = tempRange?.to ?? tempRange?.from
    onSelect({ from: finalFrom, to: finalTo })
    setIsOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempRange({ from, to })
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
          <div className="p-2 space-y-2">
            {/* Cabecera compacta con accesos rápidos */}
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-xs text-gray-600 flex-1 truncate">
                {tempRange?.from && tempRange?.to
                  ? `${format(tempRange.from, "dd/MM/yyyy")} - ${format(tempRange.to, "dd/MM/yyyy")}`
                  : tempRange?.from
                    ? `${format(tempRange.from, "dd/MM/yyyy")} - ...`
                    : "Seleccione el rango"}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs border-[#9CD2D3]"
                onClick={() => {
                  const today = new Date()
                  setTempRange({ from: today, to: today })
                  onSelect({ from: today, to: today })
                  setIsOpen(false)
                }}
              >
                Hoy
              </Button>
            </div>
            <Calendar
              mode="range"
              selected={tempRange}
              onSelect={handleSelect}
              locale={es}
              numberOfMonths={1}
              defaultMonth={tempRange?.from}
              className="rounded-md border bg-white"
              classNames={{
                day_selected:
                  "bg-[#4F9BB6] text-white font-bold rounded-full hover:bg-[#4F9BB6] hover:text-white",
                day_range_middle:
                  "bg-[#9CD2D3] text-[#114C5F] hover:bg-[#9CD2D3] hover:text-[#114C5F]",
              }}
            />
            {/* Botón Aplicar visible al pie del popover */}
            <Button
              onClick={handleApply}
              disabled={!tempRange?.from}
              className="w-full h-10 bg-[#4F9BB6] hover:bg-[#4A6EB0] text-white font-semibold shadow-md"
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
