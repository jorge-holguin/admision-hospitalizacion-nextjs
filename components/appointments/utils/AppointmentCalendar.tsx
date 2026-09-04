"use client"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { es } from "date-fns/locale/es"

interface AppointmentCalendarProps {
  selectedDate: Date | undefined
  onDateSelect: (date: Date | undefined) => void
  className?: string
  datesWithAppointments?: Date[]  // Fechas que tienen citas disponibles (verdes)
  datesWithoutAvailability?: Date[]  // ✅ Fechas sin citas disponibles (rojas)
  disablePastDates?: boolean  // Deshabilitar días pasados
  onMonthChange?: (month: Date) => void  // Callback al navegar de mes
  compact?: boolean // ✅ Modo compacto (menor altura y celdas pequeñas)
}

const compactClassNames = {
  months: "flex flex-col w-full space-y-0",
  month: "space-y-1 w-full",
  caption: "flex justify-center relative items-center py-2",
  caption_label: "font-semibold text-base",
  nav: "flex items-center gap-2",
  nav_button: "h-7 w-7 bg-transparent p-0 opacity-75 hover:opacity-100 hover:bg-accent rounded-md",
  nav_button_previous: "absolute left-1",
  nav_button_next: "absolute right-1",
  table: "w-full border-collapse px-1",
  head_row: "flex justify-between mb-2",
  head_cell: "text-muted-foreground rounded-md w-10 h-8 font-medium text-xs text-center py-1",
  row: "flex w-full justify-between",
  cell: "w-10 h-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
  day: "w-10 h-10 p-0 font-normal text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
  day_range_end: "day-range-end",
  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
  day_today: "bg-accent text-accent-foreground font-medium rounded-md",
  day_outside: "day-outside text-muted-foreground/60 opacity-50",
  day_disabled: "text-muted-foreground/40 opacity-50",
  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
  day_hidden: "invisible",
}

const regularClassNames = {
  months: "flex flex-col space-y-4 w-full",
  month: "space-y-4 w-full",
  caption: "flex justify-center pt-4 pb-2 relative items-center",
  caption_label: "text-lg font-semibold",
  nav: "flex items-center gap-2",
  nav_button: "h-8 w-8 bg-transparent p-0 opacity-75 hover:opacity-100 hover:bg-accent rounded-md",
  nav_button_previous: "absolute left-4",
  nav_button_next: "absolute right-4",
  table: "w-full border-collapse space-y-1 px-4",
  head_row: "flex justify-between mb-2",
  head_cell: "text-muted-foreground rounded-md w-10 font-medium text-sm text-center py-2",
  row: "flex w-full justify-between",
  cell: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
  day: "h-10 w-10 p-0 font-normal text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
  day_range_end: "day-range-end",
  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
  day_today: "bg-accent text-accent-foreground font-medium rounded-md",
  day_outside: "day-outside text-muted-foreground/60 opacity-50",
  day_disabled: "text-muted-foreground/40 opacity-50",
  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
  day_hidden: "invisible",
}

export function AppointmentCalendar({
  selectedDate,
  onDateSelect,
  className = "",
  datesWithAppointments = [],
  datesWithoutAvailability = [],
  disablePastDates = false,
  onMonthChange,
  compact = false,
}: AppointmentCalendarProps) {

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          onMonthChange={onMonthChange}
          locale={es}
          className="w-full"
          disabled={disablePastDates ? (date) => date < today : undefined}
          modifiers={{
            hasAppointments: datesWithAppointments,
            noAvailability: datesWithoutAvailability,
          }}
          modifiersClassNames={{
            hasAppointments: "bg-green-100 text-green-800 font-semibold hover:bg-green-200",
            noAvailability: "bg-red-100 text-red-800 font-semibold hover:bg-red-200",
          }}
          classNames={compact ? compactClassNames : regularClassNames}
        />
      </CardContent>
    </Card>
  )
}
