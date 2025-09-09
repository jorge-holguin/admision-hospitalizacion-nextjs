"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, ChevronUp, ChevronDown } from "lucide-react"
// Usamos utilidades nativas de Date para evitar dependencias y errores de tipo

interface TimeSlot {
  time: string
  available: boolean
  appointmentCount?: number
}

interface TimeSlotSelectorProps {
  selectedDate: Date | undefined
  selectedTime: string | null
  onTimeSelect: (time: string) => void
  appointments?: any[]
  className?: string
}

const timeSlots: TimeSlot[] = [
  { time: "08:00", available: true },
  { time: "08:30", available: true },
  { time: "09:00", available: true },
  { time: "09:30", available: true },
  { time: "10:00", available: true },
  { time: "10:30", available: true },
  { time: "11:00", available: true },
  { time: "11:30", available: true },
  { time: "12:00", available: true },
  { time: "12:30", available: true },
  { time: "13:00", available: true },
  { time: "13:30", available: true },
  { time: "14:00", available: true },
  { time: "14:30", available: true },
  { time: "15:00", available: true },
  { time: "15:30", available: true },
  { time: "16:00", available: true },
  { time: "16:30", available: true },
  { time: "17:00", available: true },
  { time: "17:30", available: true },
  { time: "18:00", available: true },
]

export function TimeSlotSelector({ 
  selectedDate, 
  selectedTime, 
  onTimeSelect, 
  appointments = [],
  className = "" 
}: TimeSlotSelectorProps) {
  // Renderizaremos todos los horarios y usaremos el scroll nativo

  const getAppointmentCountForTime = (time: string) => {
    if (!selectedDate) return 0
    const y = selectedDate.getFullYear()
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const d = String(selectedDate.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    return appointments.filter(apt => 
      apt.fecha === dateStr && apt.hora === time
    ).length
  }

  const isTimeAvailable = (time: string) => {
    const count = getAppointmentCountForTime(time)
    return count < 3 // Assuming max 3 appointments per slot
  }

  // Eliminamos navegación por flechas, el usuario puede desplazarse con el scroll

  const formatDateHeader = (date: Date | undefined) => {
    if (!date) return "Selecciona una fecha"
    return date.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit' })
  }

  return (
    <Card className={`${className} h-full`}>
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-blue-800 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {formatDateHeader(selectedDate)}
          </h3>
          {/* Se removieron flechas; el ScrollArea permite desplazamiento natural */}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ScrollArea className="h-80">
          <div className="space-y-1">
            {selectedDate ? (
              timeSlots.map((slot) => {
                const appointmentCount = getAppointmentCountForTime(slot.time)
                const available = isTimeAvailable(slot.time)
                const isSelected = selectedTime === slot.time
                
                return (
                  <Button
                    key={slot.time}
                    variant={isSelected ? "default" : "ghost"}
                    className={`
                      w-full h-10 text-sm font-medium justify-start px-3
                      ${isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : available 
                          ? "hover:bg-gray-100" 
                          : "opacity-50 cursor-not-allowed"
                      }
                    `}
                    onClick={() => available && onTimeSelect(slot.time)}
                    disabled={!available}
                    title={available ? `${appointmentCount} citas` : "Sin disponibilidad"}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-medium">{slot.time}</span>
                      {appointmentCount > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {appointmentCount}
                        </span>
                      )}
                    </div>
                  </Button>
                )
              })
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecciona una fecha para ver horarios</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
