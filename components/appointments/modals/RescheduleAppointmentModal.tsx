"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ConsultorioCitasSelector } from "../selectors/ConsultorioCitasSelector"
import { TurnoSelector } from "../selectors/TurnoSelector"
import { AppointmentCalendar } from "../utils/AppointmentCalendar"
import { PatientInfoCardAppointment } from "../patient/PatientInfoCardAppointment"
import { CalendarClock, AlertTriangle, Loader2, CheckCircle, CreditCard, Clock, Hash, Building2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { extractDocumentFromToken } from "@/utils/jwtUtils"
import { availableDatesService } from "@/services/appointments/availableDatesService"
import { startOfMonth, endOfMonth, format } from "date-fns"

interface RescheduleAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
  onConfirm: (data: any) => Promise<void>
}

// ── helpers ────────────────────────────────────────────────────────────────────
function parseFecha(raw: string | undefined | null): string {
  if (!raw) return '—'
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '—'
  }
}

export function RescheduleAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onConfirm
}: RescheduleAppointmentModalProps) {
  const apiBase = import.meta.env.VITE_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011/api'
  const hcBase  = import.meta.env.VITE_API_HC_URL         || 'http://192.168.5.239:9011/api'

  const [patientInfo, setPatientInfo]       = useState<any>(null)
  const [loadingPatient, setLoadingPatient] = useState(false)

  const [consultorio, setConsultorio]           = useState('')
  const [consultorioData, setConsultorioData]   = useState<any>(null)
  const [turno, setTurno]                       = useState('')

  const [calendarMonth, setCalendarMonth]                     = useState<Date>(new Date())
  const [selectedDate, setSelectedDate]                       = useState<Date | undefined>()
  const [showPastDates, setShowPastDates]                     = useState(false)
  const [datesWithAppointments, setDatesWithAppointments]     = useState<Date[]>([])
  const [datesWithoutAvailability, setDatesWithoutAvailability] = useState<Date[]>([])
  const [loadingDates, setLoadingDates]                       = useState(false)

  const [availableCitas, setAvailableCitas] = useState<any[]>([])
  const [selectedCita, setSelectedCita]     = useState<any>(null)
  const [loadingCita, setLoadingCita]       = useState(false)

  const [isConfirming, setIsConfirming] = useState(false)
  const [errorMsg, setErrorMsg]         = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)

  const pagoIdRaw = ((appointment?.pagoId ?? appointment?.PAGOID) ?? '').toString().trim()
  const hasPagoId = pagoIdRaw.length > 0
    && pagoIdRaw.toLowerCase() !== 'null'
    && pagoIdRaw !== 'undefined'
    && pagoIdRaw !== '0'

  // ── init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !appointment) return
    const rawTurno  = (appointment.turnoConsulta ?? '').toString().trim()
    const turnoInit = rawTurno === 'M' ? 'MAÑANA' : rawTurno === 'T' ? 'TARDE' : ''
    setConsultorio((appointment.consultorio ?? '').toString().trim())
    setConsultorioData(null)
    setTurno(turnoInit)
    setSelectedDate(undefined)
    setSelectedCita(null)
    setAvailableCitas([])
    setDatesWithAppointments([])
    setDatesWithoutAvailability([])
    setErrorMsg(null)
    setSuccess(false)
    setCalendarMonth(new Date())
    setPatientInfo(null)

    const historia = (appointment.historia ?? '').toString().trim()
    if (historia) {
      setLoadingPatient(true)
      fetch(`${hcBase}/historia-clinica/pacientes/busqueda-historia?historia=${historia}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return
          const list = data.data ?? data
          const first = Array.isArray(list) ? list[0] : list
          if (first) setPatientInfo(first)
        })
        .catch(() => {})
        .finally(() => setLoadingPatient(false))
    }
  }, [isOpen, appointment])

  // ── load dates ──────────────────────────────────────────────────────────────
  const loadAvailableDates = useCallback(async (month: Date) => {
    if (!consultorio || !turno) {
      setDatesWithAppointments([])
      setDatesWithoutAvailability([])
      return
    }
    setLoadingDates(true)
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const monthStart       = startOfMonth(month)
      const monthEnd         = endOfMonth(month)
      const currentMonthStart = startOfMonth(today)

      if (monthStart < currentMonthStart && !showPastDates) {
        setDatesWithAppointments([])
        setDatesWithoutAvailability([])
        return
      }
      let startDate = monthStart
      if (monthStart.getTime() === currentMonthStart.getTime()) {
        startDate = showPastDates ? monthStart : today
      }
      const turnoConsulta = turno === 'MAÑANA' ? 'M' : 'T'
      const dates = await availableDatesService.fetchAvailableDates({
        fechaInicio: format(startDate, 'yyyy-MM-dd'),
        fechaFin:    format(monthEnd,  'yyyy-MM-dd'),
        consultorioId: consultorio,
        turnoConsulta,
      })
      const { available, unavailable } = availableDatesService.getDatesWithAvailability(dates, consultorio)
      setDatesWithAppointments(available)
      setDatesWithoutAvailability(unavailable)
    } catch {
      setDatesWithAppointments([])
      setDatesWithoutAvailability([])
    } finally {
      setLoadingDates(false)
    }
  }, [consultorio, turno, showPastDates])

  useEffect(() => {
    loadAvailableDates(calendarMonth)
  }, [consultorio, turno, calendarMonth, showPastDates, loadAvailableDates])

  // ── date select ─────────────────────────────────────────────────────────────
  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedCita(null)
    setAvailableCitas([])
    setErrorMsg(null)
    if (!date || !consultorio) return

    setLoadingCita(true)
    try {
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const consultorioNombre = consultorioData?.NOMBRE?.trim() || appointment?.consultorioNombre?.trim() || consultorio
      const qs = new URLSearchParams({
        desde:         dateStr,
        hasta:         dateStr,
        consultorio:   consultorioNombre,
        estado:        '1',
        turnoConsulta: turno === 'MAÑANA' ? 'M' : 'T',
      })
      const res = await fetch(`${apiBase}/cita/buscar/nombreConsultorio?${qs}`)
      if (res.ok) {
        const data = await res.json()
        const list: any[] = Array.isArray(data) ? data : (data?.content ?? [])
        if (list.length > 0) {
          setAvailableCitas(list)
        } else {
          setErrorMsg('No hay cupos disponibles (estado libre) para esta fecha en el consultorio seleccionado.')
        }
      } else {
        setErrorMsg('Error al consultar cupos disponibles.')
      }
    } catch {
      setErrorMsg('Error de conexión al consultar cupos disponibles.')
    } finally {
      setLoadingCita(false)
    }
  }

  // ── confirm ─────────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!hasPagoId) { setErrorMsg('Esta cita no tiene un pago asociado (PAGOID vacío). No es posible reprogramar.'); return }
    if (!selectedCita) { setErrorMsg('Seleccione un cupo disponible.'); return }
    setIsConfirming(true)
    setErrorMsg(null)
    try {
      const usuario       = extractDocumentFromToken()
      const citaIdOrigen  = appointment.id
      const citaIdDestino = String(selectedCita.citaId || selectedCita.id || '')

      const res = await fetch(`${apiBase}/cita/${citaIdOrigen}/reprogramar`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', 'usuario': usuario },
        body:    JSON.stringify({ citaIdDestino }),
      })

      if (!res.ok) {
        let msg = `Error al reprogramar (${res.status}).`
        try {
          const body = await res.json()
          if      (res.status === 409) msg = body.message || 'El cupo destino ya no está disponible. Seleccione otra fecha.'
          else if (res.status === 400) msg = body.message || 'Solicitud inválida.'
          else if (res.status === 404) msg = body.message || 'Cita no encontrada.'
          else if (res.status === 422) msg = body.message || 'La cita no cumple las condiciones para ser reprogramada.'
          else msg = body.message || msg
        } catch {}
        setErrorMsg(msg)
        return
      }

      setSuccess(true)
      toast({ title: 'Reprogramación exitosa', description: 'La cita fue reprogramada y el ticket de pago trasladado.' })
      await onConfirm({ citaIdDestino })
    } catch {
      setErrorMsg('Error de conexión. Intente nuevamente.')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleClose = () => { setSuccess(false); setErrorMsg(null); onClose() }

  if (!appointment) return null

  // ── derived display values ──────────────────────────────────────────────────
  const src = patientInfo?.data?.[0] ?? patientInfo ?? appointment ?? {}

  const calcularEdad = (birthRaw: string | number | undefined): string => {
    if (!birthRaw) return ''
    const birthStr = String(birthRaw).trim()
    if (!birthStr) return ''
    try {
      const [year, month, day] = birthStr.split('-').map(n => Number.parseInt(n, 10))
      if (!year || !month || !day) return ''
      const birth = new Date(year, month - 1, day)
      if (Number.isNaN(birth.getTime())) return ''
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
        age--
      }
      return age >= 0 ? String(age) : ''
    } catch {
      return ''
    }
  }

  const edadCalculada = calcularEdad(src.FECHA_NACIMIENTO ?? src.fechaNacimiento)

  const patientForCard = {
    HISTORIA: (src.HISTORIA ?? src.historia ?? appointment.historia ?? '').toString().trim(),
    NOMBRES: (src.NOMBRES ?? src.nombres ?? src.nombre ?? appointment.nombre ?? appointment.paciente ?? '').toString().trim(),
    NOMBRE: (src.NOMBRE ?? src.nombre ?? '').toString().trim(),
    PATERNO: (src.PATERNO ?? src.paterno ?? '').toString().trim(),
    MATERNO: (src.MATERNO ?? src.materno ?? '').toString().trim(),
    SEXO: (src.SEXO ?? src.sexo ?? '').toString().trim(),
    DOCUMENTO: (src.DOCUMENTO ?? src.documento ?? src.DNI ?? '').toString().trim(),
    TIPO_DOCUMENTO: (src.TIPO_DOCUMENTO ?? src.tipo_documento ?? src.tipoDocumento ?? src.nombreDocumento ?? '').toString().trim(),
    FECHA_NACIMIENTO: (src.FECHA_NACIMIENTO ?? src.fechaNacimiento ?? '').toString().trim(),
    EDAD: edadCalculada || (src.EDAD ?? src.edad ?? '').toString().trim(),
    ESTADO_CIVIL: (src.ESTADO_CIVIL ?? src.nombreEstadoCivil ?? src.estadoCivil ?? '').toString().trim(),
    DIRECCION: (src.DIRECCION ?? src.direccion ?? '').toString().trim(),
    DISTRITO: (src.DISTRITO ?? src.distrito ?? '').toString().trim(),
    Distrito_Dir: (src.Distrito_Dir ?? src.distritoDir ?? '').toString().trim(),
    TELEFONO1: (src.TELEFONO1 ?? src.telefono1 ?? '').toString().trim(),
    TELEFONO2: (src.TELEFONO2 ?? src.telefono2 ?? '').toString().trim(),
    CORREO: (src.CORREO ?? src.correo ?? src.email ?? '').toString().trim(),
    SEGURO: (src.SEGURO ?? src.seguro ?? '').toString().trim(),
    NOMBRE_SEGURO: (src.NOMBRE_SEGURO ?? src.nombreSeguro ?? appointment.seguroNombre ?? src.seguro ?? '').toString().trim(),
    RELIGION: (src.RELIGION ?? src.religion ?? '').toString().trim(),
    DESRELIGION: (src.DESRELIGION ?? src.desReligion ?? '').toString().trim(),
    Nombre_Localidad: (src.Nombre_Localidad ?? src.nombreLocalidad ?? '').toString().trim(),
    LOCALIDAD: (src.LOCALIDAD ?? src.localidad ?? '').toString().trim(),
    STRING_FOTO: (src.STRING_FOTO ?? src.stringFoto ?? '').toString().trim(),
    PACIENTE: (src.PACIENTE ?? src.pacienteId ?? src.paciente ?? '').toString().trim()
  }

  const consultorioNombreDisplay = consultorioData?.NOMBRE?.trim() || ''

  const turnoLabel = (raw: string) => {
    const t = raw?.trim()
    if (t === 'M') return 'MAÑANA'
    if (t === 'T') return 'TARDE'
    return raw || '—'
  }

  // ── success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md" onInteractOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle className="h-6 w-6" />
              ¡Reprogramación Exitosa!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <p className="text-gray-700">El ticket de pago fue trasladado a la nueva cita correctamente.</p>
            {selectedCita && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-left space-y-1">
                <p><span className="font-medium">ID cita destino:</span> {selectedCita.citaId || selectedCita.id}</p>
                <p><span className="font-medium">Consultorio:</span> {selectedCita.consultorioNombre || selectedCita.consultorio || '—'}</p>
                <p><span className="font-medium">Médico:</span> {selectedCita.medicoNombre || selectedCita.medico || '—'}</p>
                <p><span className="font-medium">Fecha:</span> {selectedDate?.toLocaleDateString('es-PE')}</p>
                <p><span className="font-medium">Hora:</span> {selectedCita.hora || '—'}</p>
              </div>
            )}
            <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ── main modal ──────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-blue-800 flex flex-wrap items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Reprogramar Cita — ID: {appointment.id}
          </DialogTitle>
        </DialogHeader>

        {/* Global alerts */}
        {!hasPagoId && (
          <div className="shrink-0 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-semibold text-sm">Sin pago asociado</p>
              <p className="text-red-600 text-sm">Esta cita no tiene un PAGOID válido. No es posible reprogramar sin un ticket de pago.</p>
            </div>
          </div>
        )}
        {errorMsg && (
          <div className="shrink-0 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          {/* ── RIGHT: New appointment selection ─────────────────────────── */}
          <div className="space-y-3 pl-1 border border-gray-200 rounded-xl bg-white p-3 order-2">
            <h3 className="text-sm font-semibold text-gray-700">Seleccionar Nueva Cita</h3>

            {/* 1. Consultorio */}
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1 block">
                1. Consultorio <span className="text-red-500">*</span>
              </Label>
              <ConsultorioCitasSelector
                label=""
                value={consultorio}
                onChange={(v) => {
                  setConsultorio(v)
                  setSelectedDate(undefined)
                  setSelectedCita(null)
                  setAvailableCitas([])
                  setErrorMsg(null)
                }}
                onConsultorioDataChange={(data) => setConsultorioData(data)}
              />
              {consultorioNombreDisplay && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {consultorioNombreDisplay}
                </p>
              )}
            </div>

            {/* 2. Turno */}
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1 block">
                2. Turno <span className="text-red-500">*</span>
              </Label>
              <TurnoSelector
                label=""
                value={turno}
                onChange={(v) => {
                  setTurno(v)
                  setSelectedDate(undefined)
                  setSelectedCita(null)
                  setAvailableCitas([])
                  setErrorMsg(null)
                }}
              />
            </div>

            {/* 3. Calendar */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 gap-2">
                <Label className="text-xs font-medium text-gray-600">
                  3. Seleccionar Fecha <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="showPastDatesReschedule"
                    checked={showPastDates}
                    onCheckedChange={v => setShowPastDates(v as boolean)}
                  />
                  <label htmlFor="showPastDatesReschedule" className="text-xs text-gray-500 cursor-pointer">
                    Permitir fechas pasadas
                  </label>
                </div>
              </div>
              {!consultorio || !turno ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-xs text-gray-400">
                  Seleccione un consultorio y turno para ver fechas disponibles
                </div>
              ) : (
                <>
                  <AppointmentCalendar
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    datesWithAppointments={datesWithAppointments}
                    datesWithoutAvailability={datesWithoutAvailability}
                    disablePastDates={!showPastDates}
                    onMonthChange={(m) => setCalendarMonth(m)}
                    compact
                    className="border-0 shadow-none bg-transparent"
                  />
                  {loadingDates && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Cargando fechas...
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    🟢 Con cupos &nbsp;·&nbsp; 🔴 Sin cupos
                  </p>
                </>
              )}
            </div>

            {/* 4. Available slot cards */}
            {loadingCita && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando cupos disponibles...
              </div>
            )}
            {availableCitas.length > 0 && !loadingCita && (
              <div>
                <div className="text-xs font-medium text-gray-600 block mb-2">
                  <span>4. Cupos disponibles</span>
                  {' '}
                  <span className="text-green-600 font-normal">({availableCitas.length} cupos)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableCitas.map((cita) => {
                    const citaId = cita.citaId || cita.id
                    const isSelected = (selectedCita?.citaId || selectedCita?.id) === citaId
                    return (
                      <button
                        key={citaId}
                        type="button"
                        onClick={() => { setSelectedCita(cita); setErrorMsg(null) }}
                        className={`text-left rounded-lg border-2 p-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            {cita.hora || '—'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Hash className="h-3 w-3" />N°{cita.numero || '—'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate" title={cita.medicoNombre || cita.medico}>
                          {cita.medicoNombre || cita.medico || '—'}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {cita.consultorioNombre?.trim() || cita.consultorio?.trim() || '—'}
                        </p>
                        {isSelected && (
                          <p className="text-xs text-blue-600 font-medium mt-1">✓ Seleccionado</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── LEFT: Patient info + Original appointment ──────────────── */}
          <div className="space-y-4 pr-1 order-1">

            {/* Patient info — full card */}
            {loadingPatient ? (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando datos del paciente...
              </div>
            ) : (
              <PatientInfoCardAppointment patient={patientForCard} />
            )}

            {/* Original appointment */}
            <div className="border border-gray-200 rounded-xl p-3 bg-white">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Cita Original</h3>
              <div className="space-y-2 text-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  <span className="text-gray-500">Consultorio</span>
                  <span className="font-medium text-right">{appointment.consultorioNombre || appointment.consultorio || '—'}</span>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  <span className="text-gray-500">Turno / Hora</span>
                  <span className="font-medium">{turnoLabel(appointment.turnoConsulta)} — {appointment.hora || '—'}</span>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-medium">{parseFecha(appointment.fecha)}</span>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  <span className="text-gray-500">Médico</span>
                  <span className="font-medium text-right sm:max-w-[60%] truncate" title={appointment.medicoNombre || appointment.medico}>{appointment.medicoNombre || appointment.medico || '—'}</span>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  <span className="text-gray-500">Paciente</span>
                  <span className="font-medium text-right sm:max-w-[60%] truncate" title={appointment.nombre || appointment.paciente}>{appointment.nombre || appointment.paciente || '—'}</span>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  <span className="text-gray-500">PAGOID</span>
                  <span className={`font-semibold text-sm flex items-center gap-1 ${hasPagoId ? 'text-green-700' : 'text-red-600'}`}>
                    <CreditCard className="h-3.5 w-3.5" />
                    {hasPagoId ? pagoIdRaw : 'Sin pago'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t mt-2">
          <Button variant="outline" onClick={handleClose} disabled={isConfirming} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedCita || isConfirming}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {isConfirming
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reprogramando...</>
              : 'Confirmar Reprogramación'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
